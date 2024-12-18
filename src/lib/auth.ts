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
        const data = await response.json();
        console.log('Successful validation response:', data);
        
        // Validate response structure
        if (typeof data.valid !== 'boolean' || (data.valid && (!data.details?.userId || !data.details?.expiresAt))) {
          console.error('Invalid response structure:', data);
          return {
            valid: false,
            error: {
              message: 'Invalid response format',
              details: 'Auth service response does not match expected format',
            },
          };
        }
        
        return data;
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