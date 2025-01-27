import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import pool from '@/lib/db';
import { z } from 'zod';

// Validation schema for email
const EmailSchema = z.string().email().max(100);

export async function GET(request: Request) {
  console.log('🔍 [find-by-email] Starting email search request');
  console.log('🌐 [find-by-email] Full request URL:', request.url);
  
  try {
    const headersList = headers();
    const userId = headersList.get('x-user-id');
    console.log('👤 [find-by-email] User ID from headers:', userId);
    
    if (!userId) {
      console.log('❌ [find-by-email] No user ID provided in headers');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get email from query params
    const url = new URL(request.url);
    console.log('🔍 [find-by-email] Search parameters:', Object.fromEntries(url.searchParams));
    
    const email = url.searchParams.get('email');
    console.log('📧 [find-by-email] Raw email parameter:', email);
    
    // Try decoding the email if it's encoded
    const decodedEmail = email ? decodeURIComponent(email) : null;
    console.log('📧 [find-by-email] Decoded email:', decodedEmail);

    if (!decodedEmail) {
      console.log('❌ [find-by-email] No email parameter provided');
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    // Validate email format
    try {
      EmailSchema.parse(decodedEmail);
      console.log('✅ [find-by-email] Email format validation passed');
    } catch (error) {
      console.log('❌ [find-by-email] Email validation failed:', error);
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Query for exact email match
    console.log('🔍 [find-by-email] Executing database query');
    const result = await pool.query(
      `SELECT id FROM contacts 
       WHERE created_by = $1 
       AND email_primary = $2`,
      [userId, decodedEmail]
    );
    console.log('📊 [find-by-email] Query results:', {
      rowCount: result.rows.length,
      contactId: result.rows.length > 0 ? result.rows[0].id : null
    });

    const response = {
      exists: result.rows.length > 0,
      contactId: result.rows.length > 0 ? result.rows[0].id : null
    };
    console.log('✅ [find-by-email] Returning response:', response);
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ [find-by-email] Error in request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 