import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import pool from '@/lib/db';
import { z } from 'zod';

// Validation schemas
const EmailSchema = z.string().email().max(100);

const PhoneSchema = z.object({
  type: z.enum(['work', 'mobile', 'home']),
  number: z.string()
    .min(8)
    .max(20)
    .regex(/^\+?[1-9]\d{1,19}$/, "Must be a valid international phone number (E.164 format)"),
  primary: z.boolean()
});

const AddressSchema = z.object({
  street: z.string().min(5).max(100),
  unit: z.string().max(20).optional(),
  city: z.string().min(2).max(50),
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
  firstName: z.string().min(2).max(50).regex(/^[\p{L}]+$/u, "Only letters allowed"),
  lastName: z.string().min(2).max(50).regex(/^[\p{L}]+$/u, "Only letters allowed"),
  email: EmailSchema,
  phones: z.array(PhoneSchema).min(1),
  address: AddressSchema,
  company: CompanySchema,
  projectIds: z.array(z.string()).optional(),
  opportunityIds: z.array(z.string()).optional(),
  tags: z.array(z.string().min(2).max(20)).max(10).optional()
});

// Helper function to convert snake_case DB record to camelCase API response
function formatContactResponse(dbContact: any) {
  const {
    first_name,
    last_name,
    email_primary,
    phones,
    address,
    company,
    project_ids,
    opportunity_ids,
    tags,
    created_at,
    updated_at,
    created_by,
    ...rest
  } = dbContact;

  return {
    id: rest.id,
    firstName: first_name,
    lastName: last_name,
    email: email_primary,
    phones: typeof phones === 'string' ? JSON.parse(phones) : phones,
    address: address ? (typeof address === 'string' ? JSON.parse(address) : address) : null,
    company: company ? (typeof company === 'string' ? JSON.parse(company) : company) : null,
    projectIds: project_ids || [],
    opportunityIds: opportunity_ids || [],
    tags: tags || [],
    createdAt: created_at,
    updatedAt: updated_at,
    createdBy: created_by
  };
}

// Helper function to build WHERE clause and values for filters
function buildFilterQuery(userId: string, filters: any) {
  const conditions = ['created_by = $1'];
  const values = [userId];
  let paramCount = 2;

  if (filters.firstName) {
    conditions.push(`first_name ILIKE $${paramCount}`);
    values.push(`%${filters.firstName}%`);
    paramCount++;
  }

  if (filters.lastName) {
    conditions.push(`last_name ILIKE $${paramCount}`);
    values.push(`%${filters.lastName}%`);
    paramCount++;
  }

  if (filters.email) {
    conditions.push(`email_primary ILIKE $${paramCount}`);
    values.push(`%${filters.email}%`);
    paramCount++;
  }

  if (filters.tags && filters.tags.length > 0) {
    conditions.push(`tags && $${paramCount}`);
    values.push(filters.tags);
    paramCount++;
  }

  if (filters.company) {
    conditions.push(`company->>'name' ILIKE $${paramCount}`);
    values.push(`%${filters.company}%`);
    paramCount++;
  }

  return {
    whereClause: conditions.join(' AND '),
    values
  };
}

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

    // Format response
    const contact = formatContactResponse(result.rows[0]);

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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20')));
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // Validate sort parameters
    const allowedSortFields = ['first_name', 'last_name', 'email_primary', 'created_at', 'updated_at'];
    if (!allowedSortFields.includes(sortBy)) {
      return NextResponse.json(
        { error: 'Invalid sort field' },
        { status: 400 }
      );
    }

    if (!['asc', 'desc'].includes(sortOrder.toLowerCase())) {
      return NextResponse.json(
        { error: 'Invalid sort order' },
        { status: 400 }
      );
    }

    // Build filters
    const filters = {
      firstName: searchParams.get('firstName'),
      lastName: searchParams.get('lastName'),
      email: searchParams.get('email'),
      company: searchParams.get('company'),
      tags: searchParams.get('tags')?.split(',').filter(Boolean)
    };

    // Build query with filters
    const { whereClause, values } = buildFilterQuery(userId, filters);

    // Get total count for pagination
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM contacts WHERE ${whereClause}`,
      values
    );
    const totalCount = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalCount / pageSize);

    // Get paginated results
    const offset = (page - 1) * pageSize;
    const result = await pool.query(
      `SELECT * FROM contacts 
       WHERE ${whereClause}
       ORDER BY ${sortBy} ${sortOrder}
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, pageSize, offset]
    );

    // Format all contacts in the response
    const contacts = result.rows.map(contact => formatContactResponse(contact));

    // Return paginated response
    return NextResponse.json({
      data: contacts,
      pagination: {
        currentPage: page,
        pageSize,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      },
      sorting: {
        sortBy,
        sortOrder
      }
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 