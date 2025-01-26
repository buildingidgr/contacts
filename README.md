# Contacts API Documentation

## Authentication

All endpoints require authentication using a Bearer token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

Example:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzJwV0dCZTJvRGtWZGZhYjFUQWZ2UjA1YVgwNiIsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE3MzUwNjI4MzksImV4cCI6MTczNTA2NjQzOX0.J_KrudX2d4yoC1Pnw6uO1x2kHghBpf_lV2W1WUgBKZE
```

The JWT token contains the user's identity and access permissions. Tokens are valid for a limited time and must be renewed when expired.

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
        "streetNumber": "string",
        "street": "string",
        "city": "string",
        "area": "string",
        "country": "string",
        "countryCode": "string",
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
    "streetNumber": "string",
    "street": "string",
    "city": "string",
    "area": "string",
    "country": "string",
    "countryCode": "string",
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
  "firstName": "string",     // Required: 2-50 chars, letters only (including Greek)
  "lastName": "string",      // Required: 2-50 chars, letters only (including Greek)
  "email": "string",        // Required: valid email, max 100 chars
  "phones": [               // Required: at least one phone
    {
      "type": "work|mobile|home",
      "number": "string",   // E.164 format
      "primary": true      // Exactly one phone must be primary
    }
  ],
  "address": {             // Optional
    "streetNumber": "string",
    "street": "string",
    "city": "string",
    "area": "string",
    "country": "string",
    "countryCode": "string", // Exactly 2 characters
    "postalCode": "string"
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
  "firstName": "string",     // Optional: 2-50 chars, letters only (including Greek)
  "lastName": "string",      // Optional: 2-50 chars, letters only (including Greek)
  "email": "string",        // Optional: valid email, max 100 chars
  "phones": [               // Optional: if provided, at least one phone
    {
      "type": "work|mobile|home",
      "number": "string",   // E.164 format
      "primary": true      // If phones provided, exactly one must be primary
    }
  ],
  "address": {             // Optional (can be null to remove)
    "streetNumber": "string",
    "street": "string",
    "city": "string",
    "area": "string",
    "country": "string",
    "countryCode": "string", // Exactly 2 characters
    "postalCode": "string"
  },
  "company": {             // Optional (can be null to remove)
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

### API Information
```http
GET /api
```

Returns information about the API and available endpoints.

#### Response
```json
{
  "name": "Contacts API",
  "version": "1.0.0",
  "endpoints": {
    "GET /api/contacts": "Get all contacts with pagination and filters",
    "GET /api/contacts/:id": "Get contact by ID",
    "POST /api/contacts": "Create a new contact",
    "PATCH /api/contacts/:id": "Update contact fields by ID",
    "DELETE /api/contacts/:id": "Delete contact by ID",
    "GET /api/health": "Health check endpoint"
  }
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

## Validation Rules

### General Rules
1. Names (firstName, lastName):
   - 2-50 characters
   - Letters only (including Greek characters)
   - No spaces or special characters

2. Email:
   - Valid email format
   - Maximum 100 characters
   - Must be unique per user

3. Phone Numbers:
   - E.164 international format
   - Optional '+' prefix
   - Country code + national number
   - No spaces or special characters
   - 8-20 digits total
   - Examples:
     - +306973359331
     - +14155552671
     - 306973359331

4. Address:
   - Optional object
   - When provided:
     - streetNumber: Street number
     - street: Street name
     - city: City name
     - area: Area/Region/State
     - country: Full country name
     - countryCode: Exactly 2 characters (ISO country code)
     - postalCode: Postal/ZIP code in local format

5. Company:
   - Optional object
   - When provided:
     - name: 2-100 characters
     - title: Optional, 2-50 characters
     - type: Optional, 2-50 characters

6. Tags:
   - Optional array
   - Maximum 10 tags
   - Each tag: 2-20 characters

7. Arrays:
   - projectIds: Optional array of strings
   - opportunityIds: Optional array of strings
   - phones: At least one phone number required
   - Exactly one phone must be marked as primary

### Character Support
- All text fields support Greek characters (Unicode property \p{L})
- Special characters are allowed in appropriate fields (e.g., email addresses)
- Postal codes and phone numbers follow strict formats

## Rate Limiting
The API currently does not implement rate limiting, but it's recommended to:
- Limit requests to 100 per minute per user
- Implement exponential backoff for retry attempts

## Pagination
- Default page size: 20 items
- Maximum page size: 100 items
- Page numbers start at 1
- Sort order defaults to descending by creation date

## Data Ownership
- Each contact is associated with a user (createdBy)
- Users can only access their own contacts
- Duplicate email addresses are not allowed within a user's contacts
- Contacts cannot be transferred between users
