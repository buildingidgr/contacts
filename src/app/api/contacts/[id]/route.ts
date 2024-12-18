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

const UpdateContactSchema = z.object({
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

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const headersList = headers();
    const userId = headersList.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    
    const result = await pool.query(
      'SELECT * FROM contacts WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    // Add user information to the response
    const contact = {
      ...result.rows[0],
      _metadata: {
        requestedBy: userId,
        requestTime: new Date().toISOString()
      }
    };

    return NextResponse.json(contact);
  } catch (error) {
    console.error('Error fetching contact:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const headersList = headers();
    const userId = headersList.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    
    // First check if the contact exists and belongs to this user
    const contact = await pool.query(
      'SELECT created_by FROM contacts WHERE id = $1',
      [id]
    );

    if (contact.rows.length === 0) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (contact.rows[0].created_by !== userId) {
      return NextResponse.json(
        { error: 'Forbidden', details: 'You do not have permission to delete this contact' },
        { status: 403 }
      );
    }

    // Delete the contact
    await pool.query(
      'DELETE FROM contacts WHERE id = $1',
      [id]
    );

    return NextResponse.json(
      { message: 'Contact deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting contact:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const headersList = headers();
    const userId = headersList.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await request.json();
    
    // Validate request body
    const validatedData = UpdateContactSchema.parse(body);

    // Ensure only one phone is primary
    const primaryPhones = validatedData.phones.filter(phone => phone.primary);
    if (primaryPhones.length !== 1) {
      return NextResponse.json(
        { error: 'Exactly one phone number must be marked as primary' },
        { status: 400 }
      );
    }

    // First check if the contact exists and belongs to this user
    const existingContact = await pool.query(
      'SELECT created_by FROM contacts WHERE id = $1',
      [id]
    );

    if (existingContact.rows.length === 0) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (existingContact.rows[0].created_by !== userId) {
      return NextResponse.json(
        { error: 'Forbidden', details: 'You do not have permission to update this contact' },
        { status: 403 }
      );
    }

    // Check if the new email conflicts with any other contact for this user
    const emailConflict = await pool.query(
      `SELECT id FROM contacts 
       WHERE created_by = $1 
       AND email_primary = $2 
       AND id != $3`,
      [userId, validatedData.email, id]
    );

    if (emailConflict.rows.length > 0) {
      return NextResponse.json(
        { 
          error: 'Email conflict', 
          details: 'This email address is already used by another contact',
          conflictingContactId: emailConflict.rows[0].id
        },
        { status: 409 }
      );
    }

    // Update the contact
    const now = new Date().toISOString();
    const result = await pool.query(
      `UPDATE contacts SET 
        first_name = $1,
        last_name = $2,
        email_primary = $3,
        phones = $4,
        address = $5,
        company = $6,
        project_ids = $7,
        opportunity_ids = $8,
        tags = $9,
        updated_at = $10,
        updated_by = $11
       WHERE id = $12
       RETURNING *`,
      [
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
        userId,
        id
      ]
    );

    // Add metadata to response
    const contact = {
      ...result.rows[0],
      _metadata: {
        updatedBy: userId,
        updatedAt: now
      }
    };

    return NextResponse.json(contact);
  } catch (error) {
    console.error('Error updating contact:', error);
    
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