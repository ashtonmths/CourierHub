'use server'

import { prisma } from '@/lib/prisma'
import { currentUser, clerkClient } from '@clerk/nextjs/server'
import { UserRole, AgentStatus } from '@prisma/client'
import { revalidatePath } from 'next/cache'

/**
 * Get all users (admin only)
 */
export async function getAllUsers() {
  const user = await currentUser()
  if (!user) throw new Error('Unauthorized')

  const users = await prisma.user.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  })

  return users
}

/**
 * Get all customers
 */
export async function getAllCustomers() {
  const user = await currentUser()
  if (!user) throw new Error('Unauthorized')

  const customers = await prisma.user.findMany({
    where: {
      role: UserRole.CUSTOMER,
    },
    include: {
      shipments: {
        select: {
          id: true,
          trackingId: true,
          status: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return customers
}

/**
 * Get all delivery agents
 */
export async function getAllAgents() {
  const user = await currentUser()
  if (!user) throw new Error('Unauthorized')

  const agents = await prisma.user.findMany({
    where: {
      role: UserRole.AGENT,
    },
    include: {
      assignedShipments: {
        where: {
          status: {
            in: ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'],
          },
        },
        select: {
          id: true,
          trackingId: true,
          status: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  })

  return agents
}

/**
 * Get current user profile
 */
export async function getCurrentUserProfile() {
  const user = await currentUser()
  if (!user) throw new Error('Unauthorized')

  let dbUser = await prisma.user.findUnique({
    where: {
      clerkUserId: user.id,
    },
  })

  if (!dbUser) {
    const { syncClerkUserToDatabase } = await import('@/lib/auth')
    const synced = await syncClerkUserToDatabase({
      id: user.id,
      emailAddresses: user.emailAddresses.map((e) => ({ emailAddress: e.emailAddress })),
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumbers: user.phoneNumbers?.map((p) => ({ phoneNumber: p.phoneNumber })),
    })

    dbUser = await prisma.user.findUnique({
      where: {
        id: synced.id,
      },
    })
  }

  return dbUser
}

/**
 * Update user role (admin only)
 */
export async function updateUserRole(userId: string, newRole: UserRole) {
  const user = await currentUser()
  if (!user) throw new Error('Unauthorized')

  // Check if current user is admin
  const currentDbUser = await prisma.user.findUnique({
    where: { clerkUserId: user.id },
  })

  if (currentDbUser?.role !== UserRole.ADMIN) {
    throw new Error('Only admins can update user roles')
  }

  // Update user in database
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { role: newRole },
  })

  // Create or update profile based on new role
  if (newRole === UserRole.CUSTOMER) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        address: 'Not provided',
        joinDate: new Date(),
      },
    })
  } else if (newRole === UserRole.AGENT) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        zone: 'Unassigned',
        activeDeliveries: 0,
        completedDeliveries: 0,
        rating: 0,
        status: AgentStatus.ACTIVE,
        maxActiveDeliveries: 5,
      },
    })
  }

  // Update Clerk user metadata
  const client = await clerkClient()
  await client.users.updateUserMetadata(updatedUser.clerkUserId, {
    publicMetadata: {
      role: newRole,
    },
  })

  revalidatePath('/admin')
  revalidatePath('/admin/users')

  return updatedUser
}

/**
 * Update agent profile (zone, status, etc.)
 */
export async function updateAgentProfile(
  agentId: string,
  data: {
    zone?: string
    status?: 'ACTIVE' | 'INACTIVE' | 'ON_BREAK'
  }
) {
  const user = await currentUser()
  if (!user) throw new Error('Unauthorized')

  const agent = await prisma.user.update({
    where: { id: agentId },
    data,
  })

  revalidatePath('/admin')
  revalidatePath('/agent')

  return agent
}

/**
 * Get user statistics (admin dashboard)
 */
export async function getUserStats() {
  const user = await currentUser()
  if (!user) throw new Error('Unauthorized')

  const [totalCustomers, totalAgents, activeAgents] = await Promise.all([
    prisma.user.count({
      where: { role: UserRole.CUSTOMER },
    }),
    prisma.user.count({
      where: { role: UserRole.AGENT },
    }),
    prisma.user.count({
      where: { role: UserRole.AGENT, status: 'ACTIVE' },
    }),
  ])

  return {
    totalCustomers,
    totalAgents,
    activeAgents,
  }
}
