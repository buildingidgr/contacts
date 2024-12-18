import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    name: 'Contacts API',
    version: '1.0.0',
    endpoints: {
      'GET /api/contacts/:id': 'Get contact by ID',
      'POST /api/contacts': 'Create a new contact',
      'PUT /api/contacts/:id': 'Update contact by ID',
      'DELETE /api/contacts/:id': 'Delete contact by ID',
      'GET /api/health': 'Health check endpoint'
    }
  });
} 