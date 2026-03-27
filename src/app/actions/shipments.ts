'use server'

import { prisma } from '@/lib/prisma'
import { currentUser } from '@clerk/nextjs/server'
import { ShipmentStatus, PackageType, DeliveryType, StatusUpdateSource } from '@prisma/client'
import { nanoid } from 'nanoid'
import { revalidatePath } from 'next/cache'

/**
 * Get all shipments (admin only)
 */
export async function getAllShipments() {
  const user = await currentUser()
  if (!user) throw new Error('Unauthorized')

  const shipments = await prisma.shipment.findMany({
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      deliveryAgent: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return shipments
}

/**
 * Sync the current Clerk user to the database.
 * Safe to call multiple times — uses upsert internally.
 * Call this after sign-in if you can't rely on the webhook firing.
 */
export async function syncCurrentUser() {
  const user = await currentUser()
  if (!user) return null

  const { syncClerkUserToDatabase } = await import('@/lib/auth')
  const dbUser = await syncClerkUserToDatabase({
    id: user.id,
    emailAddresses: user.emailAddresses.map((e) => ({ emailAddress: e.emailAddress })),
    firstName: user.firstName,
    lastName: user.lastName,
    phoneNumbers: user.phoneNumbers?.map((p) => ({ phoneNumber: p.phoneNumber })),
  })

  return dbUser
}

/**
 * Get shipments for a specific customer
 */
export async function getCustomerShipments(customerId?: string) {
  const user = await currentUser()
  if (!user) throw new Error('Unauthorized')

  // If customerId not provided, find/auto-create current user in DB
  let userId = customerId
  if (!userId) {
    let dbUser = await prisma.user.findUnique({
      where: { clerkUserId: user.id },
    })

    // Auto-sync if user not in DB yet (webhook may not have fired)
    if (!dbUser) {
      const { syncClerkUserToDatabase } = await import('@/lib/auth')
      dbUser = await syncClerkUserToDatabase({
        id: user.id,
        emailAddresses: user.emailAddresses.map((e) => ({ emailAddress: e.emailAddress })),
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumbers: user.phoneNumbers?.map((p) => ({ phoneNumber: p.phoneNumber })),
      })
    }

    userId = dbUser?.id
  }

  if (!userId) throw new Error('User not found')

  const shipments = await prisma.shipment.findMany({
    where: {
      customerId: userId,
    },
    include: {
      deliveryAgent: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      statusHistory: {
        orderBy: {
          timestamp: 'desc',
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return shipments
}

/**
 * Get shipments for a specific delivery agent
 */
export async function getAgentShipments(agentId?: string) {
  const user = await currentUser()
  if (!user) throw new Error('Unauthorized')

  // If agentId not provided, get current user's shipments
  let userId = agentId
  if (!userId) {
    let dbUser = await prisma.user.findUnique({
      where: { clerkUserId: user.id },
    })

    if (!dbUser) {
      const { syncClerkUserToDatabase } = await import('@/lib/auth')
      dbUser = await syncClerkUserToDatabase({
        id: user.id,
        emailAddresses: user.emailAddresses.map((e) => ({ emailAddress: e.emailAddress })),
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumbers: user.phoneNumbers?.map((p) => ({ phoneNumber: p.phoneNumber })),
      })
    }

    userId = dbUser?.id
  }

  if (!userId) throw new Error('User not found')

  const shipments = await prisma.shipment.findMany({
    where: {
      deliveryAgentId: userId,
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      statusHistory: {
        orderBy: {
          timestamp: 'desc',
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return shipments
}

/**
 * Get shipment by tracking ID (public)
 */
export async function getShipmentByTrackingId(trackingId: string) {
  const normalizedTrackingId = trackingId.trim().toUpperCase()
  const shipment = await prisma.shipment.findUnique({
    where: {
      trackingId: normalizedTrackingId,
    },
    include: {
      deliveryAgent: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      statusHistory: {
        orderBy: {
          timestamp: 'asc',
        },
      },
    },
  })

  return shipment
}

/**
 * Create a new shipment
 */
export async function createShipment(data: {
  senderName: string
  senderAddress: string
  receiverName: string
  receiverAddress: string
  packageWeight: number
  packageType: PackageType
  deliveryType: DeliveryType
  senderPhone?: string
  senderEmail?: string
  receiverPhone?: string
  receiverEmail?: string
  originCity?: string
  destinationCity?: string
  declaredValue?: number
  isInsured?: boolean
  specialInstructions?: string
  estimatedDelivery?: Date
  razorpayOrderId?: string  // Stored immediately; payment status updated after verification
}) {
  const user = await currentUser()
  if (!user) throw new Error('Unauthorized: Please sign in to create a shipment')

  // Find or auto-create the user in DB (covers cases where webhook hasn't fired)
  let dbUser = await prisma.user.findUnique({
    where: { clerkUserId: user.id },
  })

  if (!dbUser) {
    // Auto-sync: create user record on first action
    const { syncClerkUserToDatabase } = await import('@/lib/auth')
    dbUser = await syncClerkUserToDatabase({
      id: user.id,
      emailAddresses: user.emailAddresses.map((e) => ({ emailAddress: e.emailAddress })),
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumbers: user.phoneNumbers?.map((p) => ({ phoneNumber: p.phoneNumber })),
    })
  }

  const customerId = dbUser.id
  const updaterUserId = dbUser.id

  // Generate unique tracking ID
  const trackingId = `CH-${new Date().getFullYear()}-${nanoid(6).toUpperCase()}`

  // Calculate estimated delivery if not provided
  const estimatedDelivery = data.estimatedDelivery ||
    new Date(Date.now() + (data.deliveryType === DeliveryType.EXPRESS ? 2 : 5) * 24 * 60 * 60 * 1000)

  // Validate weight against package type limits
  const { validateWeight, calculatePrice } = await import('@/lib/pricing')
  const weightCheck = validateWeight(data.packageWeight, data.packageType)
  if (!weightCheck.valid) throw new Error(weightCheck.message)

  // Calculate price using the shared pricing config (keeps UI and DB in sync)
  const price = calculatePrice(data.packageWeight, data.packageType, data.deliveryType)


  const shipment = await prisma.$transaction(async (tx) => {
    const created = await tx.shipment.create({
      data: {
        trackingId,
        senderName: data.senderName,
        senderAddress: data.senderAddress,
        senderPhone: data.senderPhone,
        senderEmail: data.senderEmail,
        originCity: data.originCity,
        receiverName: data.receiverName,
        receiverAddress: data.receiverAddress,
        receiverPhone: data.receiverPhone,
        receiverEmail: data.receiverEmail,
        destinationCity: data.destinationCity,
        packageWeight: data.packageWeight,
        packageType: data.packageType,
        deliveryType: data.deliveryType,
        declaredValue: data.declaredValue ?? 0,
        isInsured: data.isInsured ?? false,
        insuranceFee: 0,
        fuelSurcharge: 0,
        taxAmount: 0,
        price,
        totalAmount: price,
        status: ShipmentStatus.ORDER_CREATED,
        estimatedDelivery,
        customerId,
        razorpayOrderId: data.razorpayOrderId,
      },
    })

    await tx.statusHistory.create({
      data: {
        shipmentId: created.id,
        status: ShipmentStatus.ORDER_CREATED,
        updatedBy: updaterUserId,
        source: StatusUpdateSource.CUSTOMER,
        notes: data.specialInstructions || 'Shipment created',
      },
    })

    await tx.user.update({
      where: { id: customerId },
      data: { totalShipments: { increment: 1 } },
    })

    return created
  })

  revalidatePath('/admin')
  revalidatePath('/customer')
  revalidatePath('/agent')

  return shipment
}

/**
 * Update shipment status
 */
export async function updateShipmentStatus(
  shipmentId: string,
  status: ShipmentStatus,
  notes?: string
) {
  const user = await currentUser()
  if (!user) throw new Error('Unauthorized')

  const dbUser = await prisma.user.findUnique({
    where: { clerkUserId: user.id },
  })

  if (!dbUser) throw new Error('User not found')

  const shipment = await prisma.$transaction(async (tx) => {
    const existing = await tx.shipment.findUnique({
      where: { id: shipmentId },
      select: { status: true, deliveryAgentId: true },
    })

    if (!existing) throw new Error('Shipment not found')

    const deliveredAt = status === ShipmentStatus.DELIVERED ? new Date() : undefined
    const updated = await tx.shipment.update({
      where: { id: shipmentId },
      data: { status, deliveredAt, lastStatusAt: new Date() },
    })

    await tx.statusHistory.create({
      data: {
        shipmentId,
        status,
        updatedBy: dbUser.id,
        source:
          dbUser.role === 'ADMIN'
            ? StatusUpdateSource.ADMIN
            : dbUser.role === 'AGENT'
              ? StatusUpdateSource.AGENT
              : StatusUpdateSource.CUSTOMER,
        notes,
      },
    })

    const wasDelivered = existing.status === ShipmentStatus.DELIVERED
    const isDelivered = status === ShipmentStatus.DELIVERED

    if (existing.deliveryAgentId && wasDelivered !== isDelivered) {
      await tx.user.update({
        where: { id: existing.deliveryAgentId },
        data: {
          activeDeliveries: isDelivered ? { decrement: 1 } : { increment: 1 },
          completedDeliveries: isDelivered ? { increment: 1 } : { decrement: 1 },
        },
      })
    }

    return updated
  })

  revalidatePath('/admin')
  revalidatePath('/customer')
  revalidatePath('/agent')

  return shipment
}

/**
 * Assign delivery agent to shipment
 */
export async function assignAgentToShipment(
  shipmentId: string,
  agentId: string
) {
  const user = await currentUser()
  if (!user) throw new Error('Unauthorized')

  const normalizedAgentId = agentId || null

  const shipment = await prisma.$transaction(async (tx) => {
    const existing = await tx.shipment.findUnique({
      where: { id: shipmentId },
      select: { deliveryAgentId: true, status: true },
    })

    if (!existing) throw new Error('Shipment not found')

    const updated = await tx.shipment.update({
      where: { id: shipmentId },
      data: {
        deliveryAgentId: normalizedAgentId,
      },
    })

    const isActive = existing.status !== ShipmentStatus.DELIVERED
    const agentChanged = existing.deliveryAgentId !== normalizedAgentId

    if (isActive && agentChanged) {
      if (existing.deliveryAgentId) {
        await tx.user.update({
          where: { id: existing.deliveryAgentId },
          data: { activeDeliveries: { decrement: 1 } },
        })
      }

      if (normalizedAgentId) {
        await tx.user.update({
          where: { id: normalizedAgentId },
          data: { activeDeliveries: { increment: 1 } },
        })
      }
    }

    return updated
  })

  revalidatePath('/admin')
  revalidatePath('/agent')

  return shipment
}

/**
 * Get shipment statistics
 */
export async function getShipmentStats() {
  const user = await currentUser()
  if (!user) throw new Error('Unauthorized')

  const [
    totalShipments,
    activeDeliveries,
    completedShipments,
    pendingPickups,
  ] = await Promise.all([
    prisma.shipment.count(),
    prisma.shipment.count({
      where: {
        status: {
          in: [
            ShipmentStatus.PICKED_UP,
            ShipmentStatus.IN_TRANSIT,
            ShipmentStatus.OUT_FOR_DELIVERY,
          ],
        },
      },
    }),
    prisma.shipment.count({
      where: { status: ShipmentStatus.DELIVERED },
    }),
    prisma.shipment.count({
      where: { status: ShipmentStatus.ORDER_CREATED },
    }),
  ])

  return {
    totalShipments,
    activeDeliveries,
    completedShipments,
    pendingPickups,
  }
}
