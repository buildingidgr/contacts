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
  try {
    const response = await fetch(process.env.AUTH_SERVICE_URL + '/v1/token/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ accessToken: token }),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        valid: false,
        error: {
          message: error.error || 'Token validation failed',
          details: error.details || 'An unexpected error occurred',
        },
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      valid: false,
      error: {
        message: 'Token validation failed',
        details: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
    };
  }
} 