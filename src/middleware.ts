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

  // Log detailed request information
  console.log('Processing request:', {
    path: request.nextUrl.pathname,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
  });

  // Get the token from the Authorization header
  const authHeader = request.headers.get('authorization');
  console.log('Authorization header:', authHeader);

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn('Missing or invalid authorization header:', {
      headerExists: !!authHeader,
      headerValue: authHeader,
      path: request.nextUrl.pathname
    });
    return NextResponse.json(
      {
        error: 'Invalid request',
        details: 'Access token is required.',
      },
      { 
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }

  try {
    const token = authHeader.split(' ')[1];
    console.log('Validating token for request:', request.nextUrl.pathname);
    
    const validation = await validateToken(token);

    if (!validation.valid) {
      // Map auth service errors to appropriate HTTP status codes
      let status = 401; // Default to unauthorized
      if (validation.error?.message === 'Invalid request') {
        status = 400;
      } else if (validation.error?.message === 'Internal server error') {
        status = 500;
      }

      console.warn('Token validation failed for:', request.nextUrl.pathname, validation.error);
      return NextResponse.json(
        {
          error: validation.error?.message || 'Unauthorized',
          details: validation.error?.details || 'Invalid token',
        },
        { 
          status,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }

    if (!validation.details?.userId) {
      console.warn('Token validation succeeded but no user ID was provided for:', request.nextUrl.pathname);
      return NextResponse.json(
        {
          error: 'Invalid response format',
          details: 'Token validation response is missing user information',
        },
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }

    // Add user information to the request headers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', validation.details.userId);
    requestHeaders.set('x-token-expires', validation.details.expiresAt || '');

    console.log('Token validated successfully for user:', validation.details.userId, 'path:', request.nextUrl.pathname);

    // Return the request with modified headers
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.error('Middleware error for:', request.nextUrl.pathname, error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: 'An unexpected error occurred while processing the request',
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
}

export const config = {
  matcher: [
    // Skip all internal paths (_next, static, etc)
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 