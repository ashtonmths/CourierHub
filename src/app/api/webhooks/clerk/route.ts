import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { syncClerkUserToDatabase } from '@/lib/auth'
import { clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occurred -- no svix headers', {
      status: 400,
    })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Create a new Svix instance with your secret.
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '')

  let evt: WebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error occurred', {
      status: 400,
    })
  }

  // Handle the webhook
  const eventType = evt.type

  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name, phone_numbers } = evt.data

    try {
      // Sync user to database
      const user = await syncClerkUserToDatabase({
        id,
        emailAddresses: email_addresses.map((e) => ({ emailAddress: e.email_address })),
        firstName: first_name,
        lastName: last_name,
        phoneNumbers: phone_numbers?.map((p) => ({ phoneNumber: p.phone_number })),
      })

      // Update Clerk user metadata with role
      const client = await clerkClient()
      await client.users.updateUserMetadata(id, {
        publicMetadata: {
          role: user.role,
        },
      })

      console.log('✅ User synced to database:', user.email)
    } catch (error) {
      console.error('Error syncing user to database:', error)
      return NextResponse.json(
        { error: 'Failed to sync user to database' },
        { status: 500 }
      )
    }
  }

  if (eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name, phone_numbers } = evt.data

    try {
      // Sync user to database
      await syncClerkUserToDatabase({
        id,
        emailAddresses: email_addresses.map((e) => ({ emailAddress: e.email_address })),
        firstName: first_name,
        lastName: last_name,
        phoneNumbers: phone_numbers?.map((p) => ({ phoneNumber: p.phone_number })),
      })

      console.log('✅ User updated in database')
    } catch (error) {
      console.error('Error updating user in database:', error)
      return NextResponse.json(
        { error: 'Failed to update user in database' },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({ message: 'Webhook processed successfully' })
}
