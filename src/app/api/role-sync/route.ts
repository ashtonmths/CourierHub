import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { syncClerkUserToDatabase } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ role: null }, { status: 200 })
  }

  const dbUser = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    select: { role: true },
  })

  if (!dbUser) {
    const client = await clerkClient()
    const clerkUser = await client.users.getUser(userId)

    const synced = await syncClerkUserToDatabase({
      id: clerkUser.id,
      emailAddresses: clerkUser.emailAddresses.map((e) => ({ emailAddress: e.emailAddress })),
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      phoneNumbers: clerkUser.phoneNumbers?.map((p) => ({ phoneNumber: p.phoneNumber })),
    })

    return NextResponse.json({ role: synced.role }, { status: 200 })
  }

  if (!dbUser.role) {
    return NextResponse.json({ role: null }, { status: 200 })
  }

  return NextResponse.json({ role: dbUser.role }, { status: 200 })
}
