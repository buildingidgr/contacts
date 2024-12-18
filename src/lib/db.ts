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
    // Drop existing contacts table if it exists
    await client.query('DROP TABLE IF EXISTS contacts');

    // Create contacts table with all required columns
    await client.query(`
      CREATE TABLE contacts (
        id VARCHAR(50) PRIMARY KEY,
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        email_primary VARCHAR(100) NOT NULL,
        email_secondary VARCHAR(100),
        phones JSONB NOT NULL,
        address JSONB,
        company JSONB,
        project_ids TEXT[],
        opportunity_ids TEXT[],
        tags TEXT[],
        created_at TIMESTAMP WITH TIME ZONE NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_by VARCHAR(50) NOT NULL
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