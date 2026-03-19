import { currentUser } from '@clerk/nextjs/server'
import { prisma } from './prisma'
import { UserRole, AgentStatus } from '@prisma/client'

/**
 * Get user role from database
 */
export async function getUserRole(clerkUserId: string): Promise<UserRole | null> {
  const user = await prisma.user.findUnique({
    where: { clerkUserId },
    select: { role: true },
  })
  return user?.role || null
}

/**
 * Get current authenticated user with role
 */
export async function getCurrentUser() {
  const clerkUser = await currentUser()
  if (!clerkUser) return null

  const dbUser = await prisma.user.findUnique({
    where: { clerkUserId: clerkUser.id },
    include: {
      customer: true,
      deliveryAgent: true,
    },
  })

  return dbUser
}

/**
 * Check if user has required role
 */
export async function checkUserRole(
  clerkUserId: string,
  allowedRoles: UserRole[]
): Promise<boolean> {
  const role = await getUserRole(clerkUserId)
  if (!role) return false
  return allowedRoles.includes(role)
}

/**
 * Sync Clerk user to database
 */
export async function syncClerkUserToDatabase(
  clerkUser: {
    id: string
    emailAddresses: Array<{ emailAddress: string }>
    firstName?: string | null
    lastName?: string | null
    phoneNumbers?: Array<{ phoneNumber: string }>
  },
  role: UserRole = UserRole.CUSTOMER
) {
  const email = clerkUser.emailAddresses[0]?.emailAddress
  if (!email) throw new Error('No email found for user')

  const firstName = clerkUser.firstName || null
  const lastName = clerkUser.lastName || null
  const name = `${firstName || ''} ${lastName || ''}`.trim() || 'User'
  const phone = clerkUser.phoneNumbers?.[0]?.phoneNumber || null

  // Check if this is the admin email
  const isAdmin = email === process.env.ADMIN_EMAIL
  const userRole = isAdmin ? UserRole.ADMIN : role

  // Upsert user in database
  const user = await prisma.user.upsert({
    where: { clerkUserId: clerkUser.id },
    update: {
      email,
      name,
      firstName,
      lastName,
      phone,
      role: userRole,
      lastLoginAt: new Date(),
    },
    create: {
      clerkUserId: clerkUser.id,
      email,
      name,
      firstName,
      lastName,
      phone,
      role: userRole,
      lastLoginAt: new Date(),
    },
  })

  // Create customer profile if role is CUSTOMER and doesn't exist
  if (userRole === UserRole.CUSTOMER) {
    await prisma.customer.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        address: 'Not provided',
        totalShipments: 0,
        joinDate: new Date(),
      },
    })
  }

  // Create agent profile if role is AGENT and doesn't exist
  if (userRole === UserRole.AGENT) {
    await prisma.deliveryAgent.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        zone: 'Unassigned',
        activeDeliveries: 0,
        completedDeliveries: 0,
        rating: 0,
        status: AgentStatus.ACTIVE,
        maxActiveDeliveries: 5,
      },
    })
  }

  return user
}

/**
 * Get dashboard URL based on user role
 */
export function getDashboardUrl(role: UserRole): string {
  switch (role) {
    case UserRole.ADMIN:
      return '/admin'
    case UserRole.AGENT:
      return '/agent'
    case UserRole.CUSTOMER:
      return '/customer'
    default:
      return '/'
  }
}
