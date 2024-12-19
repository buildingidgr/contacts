import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
});

// Initialize database
async function initializeDatabase() {
  const client = await pool.connect();
  try {
    // Create contacts table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id VARCHAR(50) PRIMARY KEY,
        first_name VARCHAR(50) NOT NULL CHECK (first_name ~ '^[\p{L}]{2,50}$'),
        last_name VARCHAR(50) NOT NULL CHECK (last_name ~ '^[\p{L}]{2,50}$'),
        email_primary VARCHAR(100) NOT NULL CHECK (email_primary ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
        phones JSONB NOT NULL,
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
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Initialize database on module load
initializeDatabase().catch(console.error);

export default pool; 