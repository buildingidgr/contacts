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

// Validation schemas for PATCH - all fields are optional
const PatchContactSchema = z.object({
  firstName: z.string().min(2).max(50).regex(/^[A-Za-z]+$/).optional(),
  lastName: z.string().min(2).max(50).regex(/^[A-Za-z]+$/).optional(),
  email: EmailSchema.optional(),
  phones: z.array(PhoneSchema).min(1).optional(),
  address: AddressSchema.optional(),
  company: CompanySchema.optional(),
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

export async function PATCH(
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
    const validatedData = PatchContactSchema.parse(body);

    // If no fields to update were provided
    if (Object.keys(validatedData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update provided' },
        { status: 400 }
      );
    }

    // First check if the contact exists and get current data
    const existingContact = await pool.query(
      'SELECT * FROM contacts WHERE id = $1',
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

    const currentContact = existingContact.rows[0];

    // If updating phones, validate that exactly one is primary
    if (validatedData.phones) {
      const primaryPhones = validatedData.phones.filter(phone => phone.primary);
      if (primaryPhones.length !== 1) {
        return NextResponse.json(
          { error: 'Exactly one phone number must be marked as primary' },
          { status: 400 }
        );
      }
    }

    // If updating email, check for conflicts
    if (validatedData.email) {
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
    }

    // Build the update query dynamically based on provided fields
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (validatedData.firstName) {
      updates.push(`first_name = $${paramCount}`);
      values.push(validatedData.firstName);
      paramCount++;
    }

    if (validatedData.lastName) {
      updates.push(`last_name = $${paramCount}`);
      values.push(validatedData.lastName);
      paramCount++;
    }

    if (validatedData.email) {
      updates.push(`email_primary = $${paramCount}`);
      values.push(validatedData.email);
      paramCount++;
    }

    if (validatedData.phones) {
      updates.push(`phones = $${paramCount}`);
      values.push(JSON.stringify(validatedData.phones));
      paramCount++;
    }

    if ('address' in validatedData) {
      updates.push(`address = $${paramCount}`);
      values.push(validatedData.address ? JSON.stringify(validatedData.address) : null);
      paramCount++;
    }

    if ('company' in validatedData) {
      updates.push(`company = $${paramCount}`);
      values.push(validatedData.company ? JSON.stringify(validatedData.company) : null);
      paramCount++;
    }

    if ('projectIds' in validatedData) {
      updates.push(`project_ids = $${paramCount}`);
      values.push(validatedData.projectIds || null);
      paramCount++;
    }

    if ('opportunityIds' in validatedData) {
      updates.push(`opportunity_ids = $${paramCount}`);
      values.push(validatedData.opportunityIds || null);
      paramCount++;
    }

    if ('tags' in validatedData) {
      updates.push(`tags = $${paramCount}`);
      values.push(validatedData.tags || null);
      paramCount++;
    }

    // Add the standard update fields
    const now = new Date().toISOString();
    updates.push(`updated_at = $${paramCount}`);
    values.push(now);
    paramCount++;

    updates.push(`updated_by = $${paramCount}`);
    values.push(userId);
    paramCount++;

    // Add the WHERE clause parameter
    values.push(id);

    // Perform the update
    const result = await pool.query(
      `UPDATE contacts SET 
        ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
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