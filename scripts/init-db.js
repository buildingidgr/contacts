const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function waitForDatabase(pool, maxAttempts = 5) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await pool.query('SELECT 1');
      console.log('Database connection established');
      return true;
    } catch (error) {
      console.log(`Database connection attempt ${attempt}/${maxAttempts} failed:`, error.message);
      if (attempt === maxAttempts) {
        throw new Error('Could not connect to database after multiple attempts');
      }
      // Wait for 5 seconds before next attempt
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  return false;
}

async function checkTableExists(pool) {
  const result = await pool.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_name = 'contacts'
    );
  `);
  return result.rows[0].exists;
}

async function initializeDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : undefined
  });

  try {
    // Wait for database to be ready
    await waitForDatabase(pool);

    // Check if table exists
    const tableExists = await checkTableExists(pool);
    if (tableExists) {
      console.log('Contacts table already exists, skipping initialization');
      await pool.end();
      return;
    }

    // Read and log the schema
    const schemaPath = path.join(__dirname, '../schema.sql');
    console.log('Reading schema from:', schemaPath);
    const schema = fs.readFileSync(schemaPath, 'utf8');
    console.log('Executing schema:', schema);
    
    // Execute the schema
    await pool.query(schema);
    
    // Verify table creation
    const verifyTable = await checkTableExists(pool);
    if (!verifyTable) {
      throw new Error('Table was not created successfully');
    }
    
    console.log('Database schema created successfully');
    await pool.end();
  } catch (error) {
    console.error('Error initializing database:', error);
    if (error.position) {
      const schema = fs.readFileSync(path.join(__dirname, '../schema.sql'), 'utf8');
      console.error('Error at position:', error.position);
      console.error('Schema snippet:', schema.substring(Math.max(0, error.position - 50), error.position + 50));
    }
    process.exit(1);
  }
}

// Run the initialization
initializeDatabase(); 