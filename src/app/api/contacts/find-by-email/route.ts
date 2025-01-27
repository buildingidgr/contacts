import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import pool from '@/lib/db';
import { z } from 'zod';

// Validation schema for email
const EmailSchema = z.string().email().max(100);

export async function GET(request: Request) {
  try {
    const headersList = headers();
    const userId = headersList.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get email from query params
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    // Validate email format
    try {
      EmailSchema.parse(email);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Query for exact email match
    const result = await pool.query(
      `SELECT id FROM contacts 
       WHERE created_by = $1 
       AND email_primary = $2`,
      [userId, email]
    );

    return NextResponse.json({
      exists: result.rows.length > 0,
      contactId: result.rows.length > 0 ? result.rows[0].id : null
    });
  } catch (error) {
    console.error('Error finding contact by email:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 