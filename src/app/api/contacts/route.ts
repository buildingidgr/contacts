import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import pool from '@/lib/db';
import { z } from 'zod';

// Validation schemas
const EmailSchema = z.string().email().max(100);

const PhoneSchema = z.object({
  type: z.enum(['work', 'mobile', 'home']),
  number: z.string().regex(/^\+\d-\d{3}-\d{3}-\d{4}$/),
  primary: z.boolean()
});

const AddressSchema = z.object({
  street: z.string().min(5).max(100),
  unit: z.string().max(20).optional(),
  city: z.string().min(2).max(50).regex(/^[A-Za-z\s]+$/),
  state: z.string().min(2).max(50),
  country: z.string().length(2),
  postalCode: z.string().regex(/^\d{5}(-\d{4})?$/).optional()
}).optional();

const CompanySchema = z.object({
  name: z.string().min(2).max(100),
  title: z.string().min(2).max(50).optional(),
  type: z.string().min(2).max(50).optional()
}).optional();

const ContactSchema = z.object({
  firstName: z.string().min(2).max(50).regex(/^[A-Za-z]+$/),
  lastName: z.string().min(2).max(50).regex(/^[A-Za-z]+$/),
  email: EmailSchema,
  phones: z.array(PhoneSchema).min(1),
  address: AddressSchema,
  company: CompanySchema,
  projectIds: z.array(z.string()).optional(),
  opportunityIds: z.array(z.string()).optional(),
  tags: z.array(z.string().min(2).max(20)).max(10).optional()
});

export async function POST(request: Request) {
  try {
    const headersList = headers();
    const userId = headersList.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate request body
    const validatedData = ContactSchema.parse(body);

    // Ensure only one phone is primary
    const primaryPhones = validatedData.phones.filter(phone => phone.primary);
    if (primaryPhones.length !== 1) {
      return NextResponse.json(
        { error: 'Exactly one phone number must be marked as primary' },
        { status: 400 }
      );
    }

    // Check if this user already has a contact with this email
    const existingContact = await pool.query(
      `SELECT id FROM contacts 
       WHERE created_by = $1 
       AND email_primary = $2`,
      [userId, validatedData.email]
    );

    if (existingContact.rows.length > 0) {
      return NextResponse.json(
        { 
          error: 'Duplicate contact', 
          details: 'You already have a contact with this email address' 
        },
        { status: 409 }
      );
    }

    // Generate a unique ID
    const id = 'c' + Date.now().toString();

    // Prepare data for insertion
    const now = new Date().toISOString();
    const result = await pool.query(
      `INSERT INTO contacts (
        id, first_name, last_name, 
        email_primary, phones, address, company,
        project_ids, opportunity_ids, tags,
        created_at, updated_at,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        id,
        validatedData.firstName,
        validatedData.lastName,
        validatedData.email,
        JSON.stringify(validatedData.phones),
        validatedData.address ? JSON.stringify(validatedData.address) : null,
        validatedData.company ? JSON.stringify(validatedData.company) : null,
        validatedData.projectIds || null,
        validatedData.opportunityIds || null,
        validatedData.tags || null,
        now,
        now,
        userId
      ]
    );

    // Add metadata to response
    const contact = {
      ...result.rows[0],
      _metadata: {
        createdBy: userId,
        createdAt: now
      }
    };

    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    console.error('Error creating contact:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    // Get only contacts created by this user
    const result = await pool.query(
      `SELECT * FROM contacts WHERE created_by = $1 ORDER BY created_at DESC`,
      [userId]
    );

    const contacts = result.rows.map(contact => ({
      ...contact,
      _metadata: {
        createdBy: contact.created_by,
        createdAt: contact.created_at
      }
    }));

    return NextResponse.json(contacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 