import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/track(.*)',
  '/api/webhooks/clerk',
])

// Define role-specific routes
const isAdminRoute = createRouteMatcher(['/admin(.*)'])
const isAgentRoute = createRouteMatcher(['/agent(.*)'])
const isCustomerRoute = createRouteMatcher(['/customer(.*)'])

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth()

  // Allow public routes
  if (isPublicRoute(req)) {
    return NextResponse.next()
  }

  // If not authenticated, redirect to sign-in
  if (!userId) {
    const signInUrl = new URL('/sign-in', req.url)
    signInUrl.searchParams.set('redirect_url', req.url)
    return NextResponse.redirect(signInUrl)
  }

  // Get user role from session claims (stored in Clerk public metadata)
  const role = (sessionClaims?.publicMetadata as { role?: string })?.role

  // Check admin routes
  if (isAdminRoute(req) && role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/', req.url))
  }

  // Check agent routes
  if (isAgentRoute(req) && role !== 'AGENT' && role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/', req.url))
  }

  // Check customer routes
  if (isCustomerRoute(req) && role !== 'CUSTOMER' && role !== 'ADMIN') {
    if (!role) {
      return NextResponse.next()
    }
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
