-- Create contacts table if it doesn't exist
CREATE TABLE IF NOT EXISTS contacts (
    id VARCHAR(50) PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL CHECK (first_name ~ '^[\p{L}]{2,50}$'),
    last_name VARCHAR(50) NOT NULL CHECK (last_name ~ '^[\p{L}]{2,50}$'),
    email_primary VARCHAR(100) NOT NULL CHECK (email_primary ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    phones JSONB NOT NULL,
    -- Address is a JSONB object with the following structure:
    -- {
    --   "streetNumber": string,
    --   "street": string,
    --   "city": string,
    --   "area": string,
    --   "country": string,
    --   "countryCode": string (2 chars),
    --   "postalCode": string
    -- }
    address JSONB,
    company JSONB,
    project_ids TEXT[],
    opportunity_ids TEXT[],
    tags VARCHAR(20)[] CHECK (array_length(tags, 1) <= 10),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) NOT NULL,
    UNIQUE (email_primary, created_by)
); 