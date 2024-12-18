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
    console.warn('Missing or invalid authorization header');
    return NextResponse.json(
      {
        error: 'Unauthorized',
        details: 'Missing or invalid authorization header',
      },
      { status: 401 }
    );
  }

  try {
    const token = authHeader.split(' ')[1];
    console.log('Validating token for request:', request.nextUrl.pathname);
    
    const validation = await validateToken(token);

    if (!validation.valid) {
      console.warn('Token validation failed:', validation.error);
      return NextResponse.json(
        {
          error: validation.error?.message || 'Unauthorized',
          details: validation.error?.details || 'Invalid token',
        },
        { status: 401 }
      );
    }

    if (!validation.details?.userId) {
      console.warn('Token validation succeeded but no user ID was provided');
      return NextResponse.json(
        {
          error: 'Invalid token',
          details: 'Token validation response is missing user information',
        },
        { status: 401 }
      );
    }

    // Add user information to the request headers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', validation.details.userId);
    requestHeaders.set('x-token-expires', validation.details.expiresAt || '');

    console.log('Token validated successfully for user:', validation.details.userId);

    // Return the request with modified headers
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: 'An error occurred while processing the request',
      },
      { status: 500 }
    );
  }
}

export const config = {
  matcher: [
    // Skip all internal paths (_next, static, etc)
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 