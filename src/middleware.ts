import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { validateToken } from './lib/auth';

export async function middleware(request: NextRequest) {
  // Skip authentication for non-API routes
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Skip authentication for health check endpoint
  if (request.nextUrl.pathname === '/api/health') {
    return NextResponse.next();
  }

  // Get the token from the Authorization header
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      {
        error: 'Unauthorized',
        details: 'Missing or invalid authorization header',
      },
      { status: 401 }
    );
  }

  const token = authHeader.split(' ')[1];
  const validation = await validateToken(token);

  if (!validation.valid) {
    return NextResponse.json(
      {
        error: validation.error?.message || 'Unauthorized',
        details: validation.error?.details || 'Invalid token',
      },
      { status: 401 }
    );
  }

  // Add user information to the request headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', validation.details?.userId || '');
  requestHeaders.set('x-token-expires', validation.details?.expiresAt || '');

  // Return the request with modified headers
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    // Skip all internal paths (_next, static, etc)
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 