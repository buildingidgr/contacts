interface TokenValidationResponse {
  valid: boolean;
  details?: {
    userId: string;
    expiresAt: string;
  };
  error?: {
    message: string;
    details: string;
  };
}

export async function validateToken(token: string): Promise<TokenValidationResponse> {
  if (!process.env.AUTH_SERVICE_URL) {
    console.error('AUTH_SERVICE_URL is not configured');
    return {
      valid: false,
      error: {
        message: 'Auth service configuration error',
        details: 'Authentication service is not properly configured',
      },
    };
  }

  try {
    console.log(`Validating token with auth service at ${process.env.AUTH_SERVICE_URL}`);
    
    const response = await fetch(process.env.AUTH_SERVICE_URL + '/v1/token/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ accessToken: token }),
    });

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Unexpected response type:', contentType);
      console.error('Response status:', response.status);
      const text = await response.text();
      console.error('Response body:', text);
      return {
        valid: false,
        error: {
          message: 'Invalid response from auth service',
          details: `Expected JSON response, got ${contentType}`,
        },
      };
    }

    if (!response.ok) {
      const error = await response.json();
      console.error('Auth service error:', error);
      return {
        valid: false,
        error: {
          message: error.error || 'Token validation failed',
          details: error.details || `HTTP ${response.status}: ${response.statusText}`,
        },
      };
    }

    const data = await response.json();
    console.log('Token validation successful:', {
      userId: data.details?.userId,
      expiresAt: data.details?.expiresAt,
    });
    
    return data;
  } catch (error) {
    console.error('Token validation error:', error);
    return {
      valid: false,
      error: {
        message: 'Token validation failed',
        details: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
    };
  }
} 