import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { currentUser } from '@clerk/nextjs/server'
import { PaymentStatus } from '@prisma/client'

/**
 * POST /api/payments/verify
 * Verifies the Razorpay signature and marks the shipment as PAID.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      shipmentId,
    } = await req.json()

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !shipmentId) {
      return NextResponse.json({ error: 'Missing payment fields' }, { status: 400 })
    }

    // Verify HMAC SHA256 signature
    const body = `${razorpay_order_id}|${razorpay_payment_id}`
    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest('hex')

    if (expectedSig !== razorpay_signature) {
      // Mark payment as failed
      await prisma.shipment.update({
        where: { id: shipmentId },
        data: { paymentStatus: PaymentStatus.FAILED },
      })
      return NextResponse.json({ error: 'Payment signature verification failed' }, { status: 400 })
    }

    // Signature valid — mark shipment as PAID
    const shipment = await prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        paymentStatus: PaymentStatus.PAID,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        paidAt: new Date(),
      },
    })

    return NextResponse.json({ success: true, shipment })
  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
