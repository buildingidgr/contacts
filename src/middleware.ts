import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Handle API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // For non-API routes, redirect to home
  if (request.nextUrl.pathname !== '/') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Skip all internal paths (_next, static, etc)
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
} 