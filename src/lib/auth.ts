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

interface AuthServiceResponse {
  isValid: boolean;
  error?: string;
}

export async function validateToken(token: string): Promise<TokenValidationResponse> {
  if (!process.env.AUTH_SERVICE_URL) {
    console.error('AUTH_SERVICE_URL environment variable is not configured');
    return {
      valid: false,
      error: {
        message: 'Configuration error',
        details: 'The authentication service URL is not configured. Please set the AUTH_SERVICE_URL environment variable.',
      },
    };
  }

  const url = `${process.env.AUTH_SERVICE_URL}/v1/token/validate`;
  console.log('Validating token at:', url);

  try {
    // Log the request payload for debugging
    const payload = { token };
    console.log('Sending validation request with payload:', payload);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    // Log response details for debugging
    console.log('Auth service response:', {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type'),
    });

    // Handle different response status codes as per documentation
    switch (response.status) {
      case 200: {
        const data = await response.json() as AuthServiceResponse;
        console.log('Successful validation response:', data);
        
        // Extract user ID from the token
        try {
          const tokenPayload = JSON.parse(atob(token.split('.')[1]));
          console.log('Token payload:', tokenPayload);
          
          return {
            valid: data.isValid,
            details: {
              userId: tokenPayload.sub,
              expiresAt: new Date(tokenPayload.exp * 1000).toISOString()
            }
          };
        } catch (error) {
          console.error('Error parsing token payload:', error);
          return {
            valid: false,
            error: {
              message: 'Token parsing error',
              details: 'Could not extract user information from token',
            },
          };
        }
      }

      case 400: {
        const error = await response.json();
        console.warn('Bad request error:', error);
        return {
          valid: false,
          error: {
            message: error.error || 'Invalid request',
            details: error.details || 'Access token is required.',
          },
        };
      }

      case 401: {
        const error = await response.json();
        console.warn('Unauthorized error:', error);
        return {
          valid: false,
          error: {
            message: error.error || 'Invalid access token',
            details: error.details || 'The provided access token is not valid or has expired.',
          },
        };
      }

      case 500: {
        const error = await response.json();
        console.error('Auth service internal error:', error);
        return {
          valid: false,
          error: {
            message: error.error || 'Internal server error',
            details: error.details || 'An unexpected error occurred.',
          },
        };
      }

      default: {
        // For unexpected status codes, try to get response body for debugging
        let responseText;
        try {
          responseText = await response.text();
        } catch (e) {
          responseText = 'Could not read response body';
        }

        console.error('Unexpected response:', {
          status: response.status,
          body: responseText,
        });

        return {
          valid: false,
          error: {
            message: 'Unexpected response from auth service',
            details: `Received status ${response.status} with content type ${response.headers.get('content-type')}`,
          },
        };
      }
    }
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