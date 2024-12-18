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

    // Read the schema file
    const schema = fs.readFileSync(path.join(__dirname, '../schema.sql'), 'utf8');
    
    // Execute the schema
    await pool.query(schema);
    console.log('Database schema created successfully');

    // Close the pool
    await pool.end();
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

// Run the initialization
initializeDatabase(); 