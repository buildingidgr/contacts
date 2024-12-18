This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# Contacts API Documentation

## Authentication

All endpoints require authentication using a Bearer token in the Authorization header:
```
Authorization: Bearer <your_token>
```

## Endpoints

### List Contacts
```http
GET /api/contacts
```

Retrieves a paginated list of contacts with optional filtering and sorting.

#### Query Parameters
| Parameter     | Type     | Default    | Description                                           |
|--------------|----------|------------|-------------------------------------------------------|
| page         | number   | 1          | Page number                                           |
| pageSize     | number   | 20         | Items per page (max: 100)                            |
| sortBy       | string   | created_at | Field to sort by                                     |
| sortOrder    | string   | desc       | Sort direction (asc or desc)                         |
| firstName    | string   | -          | Filter by first name (partial match)                 |
| lastName     | string   | -          | Filter by last name (partial match)                  |
| email        | string   | -          | Filter by email (partial match)                      |
| company      | string   | -          | Filter by company name (partial match)               |
| tags         | string   | -          | Comma-separated list of tags to filter by            |

#### Allowed Sort Fields
- first_name
- last_name
- email_primary
- created_at
- updated_at

#### Response
```json
{
  "data": [
    {
      "id": "string",
      "firstName": "string",
      "lastName": "string",
      "email": "string",
      "phones": [
        {
          "type": "work|mobile|home",
          "number": "string",
          "primary": "boolean"
        }
      ],
      "address": {
        "street": "string",
        "unit": "string",
        "city": "string",
        "state": "string",
        "country": "string",
        "postalCode": "string"
      },
      "company": {
        "name": "string",
        "title": "string",
        "type": "string"
      },
      "projectIds": ["string"],
      "opportunityIds": ["string"],
      "tags": ["string"],
      "createdAt": "string",
      "updatedAt": "string",
      "createdBy": "string"
    }
  ],
  "pagination": {
    "currentPage": "number",
    "pageSize": "number",
    "totalPages": "number",
    "totalCount": "number",
    "hasNextPage": "boolean",
    "hasPreviousPage": "boolean"
  },
  "sorting": {
    "sortBy": "string",
    "sortOrder": "string"
  }
}
```

### Get Contact
```http
GET /api/contacts/{id}
```

Retrieves a specific contact by ID.

#### Response
```json
{
  "id": "string",
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "phones": [
    {
      "type": "work|mobile|home",
      "number": "string",
      "primary": "boolean"
    }
  ],
  "address": {
    "street": "string",
    "unit": "string",
    "city": "string",
    "state": "string",
    "country": "string",
    "postalCode": "string"
  },
  "company": {
    "name": "string",
    "title": "string",
    "type": "string"
  },
  "projectIds": ["string"],
  "opportunityIds": ["string"],
  "tags": ["string"],
  "createdAt": "string",
  "updatedAt": "string",
  "createdBy": "string"
}
```

### Create Contact
```http
POST /api/contacts
```

Creates a new contact.

#### Request Body
```json
{
  "firstName": "string",     // Required: 2-50 chars, letters only
  "lastName": "string",      // Required: 2-50 chars, letters only
  "email": "string",        // Required: valid email, max 100 chars
  "phones": [               // Required: at least one phone
    {
      "type": "work|mobile|home",
      "number": "+X-XXX-XXX-XXXX",
      "primary": true      // Exactly one phone must be primary
    }
  ],
  "address": {             // Optional
    "street": "string",    // Required if address present: 5-100 chars
    "unit": "string",      // Optional: max 20 chars
    "city": "string",      // Required if address present: 2-50 chars, letters and spaces
    "state": "string",     // Required if address present: 2-50 chars
    "country": "string",   // Required if address present: exactly 2 chars
    "postalCode": "string" // Optional: XXXXX or XXXXX-XXXX format
  },
  "company": {             // Optional
    "name": "string",      // Required if company present: 2-100 chars
    "title": "string",     // Optional: 2-50 chars
    "type": "string"       // Optional: 2-50 chars
  },
  "projectIds": ["string"],     // Optional
  "opportunityIds": ["string"], // Optional
  "tags": ["string"]           // Optional: max 10 tags, each 2-20 chars
}
```

### Update Contact
```http
PATCH /api/contacts/{id}
```

Updates specific fields of a contact. All fields are optional.

#### Request Body
```json
{
  "firstName": "string",     // Optional: 2-50 chars, letters only
  "lastName": "string",      // Optional: 2-50 chars, letters only
  "email": "string",        // Optional: valid email, max 100 chars
  "phones": [               // Optional: if provided, at least one phone
    {
      "type": "work|mobile|home",
      "number": "+X-XXX-XXX-XXXX",
      "primary": true      // If phones provided, exactly one must be primary
    }
  ],
  "address": {             // Optional
    "street": "string",    // Required if address present: 5-100 chars
    "unit": "string",      // Optional: max 20 chars
    "city": "string",      // Required if address present: 2-50 chars, letters and spaces
    "state": "string",     // Required if address present: 2-50 chars
    "country": "string",   // Required if address present: exactly 2 chars
    "postalCode": "string" // Optional: XXXXX or XXXXX-XXXX format
  },
  "company": {             // Optional
    "name": "string",      // Required if company present: 2-100 chars
    "title": "string",     // Optional: 2-50 chars
    "type": "string"       // Optional: 2-50 chars
  },
  "projectIds": ["string"],     // Optional
  "opportunityIds": ["string"], // Optional
  "tags": ["string"]           // Optional: max 10 tags, each 2-20 chars
}
```

### Delete Contact
```http
DELETE /api/contacts/{id}
```

Deletes a specific contact.

#### Response
```json
{
  "message": "Contact deleted successfully"
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Validation error",
  "details": [
    {
      "code": "string",
      "message": "string",
      "path": ["string"]
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "details": "You do not have permission to access this resource"
}
```

### 404 Not Found
```json
{
  "error": "Contact not found"
}
```

### 409 Conflict (Email)
```json
{
  "error": "Email conflict",
  "details": "This email address is already used by another contact",
  "conflictingContactId": "string"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

## Phone Number Format
Phone numbers should follow the E.164 international format:
- Optional '+' prefix
- Country code
- National number
- No spaces or special characters
- Minimum 8 digits, maximum 20 digits

Examples:
- +306973359331
- +14155552671
- 306973359331

## Validation Rules
1. Names: Letters only (no spaces or special characters), 2-50 characters
2. Email: Valid email format, max 100 characters
3. City: Letters and spaces only, 2-50 characters
4. Country: Exactly 2 characters
5. Postal Code: US format (XXXXX or XXXXX-XXXX)
6. Tags: Maximum 10 tags, each 2-20 characters
7. Phones: At least one phone number, exactly one marked as primary
