import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { z } from 'zod';

// Validation schemas
const EmailSchema = z.object({
  primary: z.string().email().max(100),
  secondary: z.string().email().max(100).optional()
});

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

    // Generate a unique ID (you might want to use UUID or another ID generation method)
    const id = 'c' + Date.now().toString();

    // Prepare data for insertion
    const now = new Date().toISOString();
    const result = await pool.query(
      `INSERT INTO contacts (
        id, first_name, last_name, 
        email_primary, email_secondary,
        phones, address, company,
        project_ids, opportunity_ids, tags,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        id,
        validatedData.firstName,
        validatedData.lastName,
        validatedData.email.primary,
        validatedData.email.secondary,
        JSON.stringify(validatedData.phones),
        validatedData.address ? JSON.stringify(validatedData.address) : null,
        validatedData.company ? JSON.stringify(validatedData.company) : null,
        validatedData.projectIds || null,
        validatedData.opportunityIds || null,
        validatedData.tags || null,
        now,
        now
      ]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
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