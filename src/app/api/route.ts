import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    name: 'Contacts API',
    version: '1.0.0',
    endpoints: {
      'GET /api/contacts/:id': 'Get contact by ID',
      'POST /api/contacts': 'Create a new contact',
      'GET /api/health': 'Health check endpoint'
    }
  });
} 