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

  if (userRole === UserRole.CUSTOMER) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        address: user.address || 'Not provided',
        joinDate: user.joinDate || new Date(),
      },
    })
  }

  if (userRole === UserRole.AGENT) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        zone: user.zone || 'Unassigned',
        status: user.status || AgentStatus.ACTIVE,
        maxActiveDeliveries: user.maxActiveDeliveries || 5,
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
