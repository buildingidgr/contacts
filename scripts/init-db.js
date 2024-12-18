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

async function checkTableStructure(pool) {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'contacts'
      ORDER BY ordinal_position;
    `);
    
    const requiredColumns = [
      'id', 'first_name', 'last_name', 'email_primary', 'email_secondary',
      'phones', 'address', 'company', 'project_ids', 'opportunity_ids',
      'tags', 'created_at', 'updated_at'
    ];
    
    const existingColumns = result.rows.map(row => row.column_name);
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
    
    if (missingColumns.length > 0) {
      console.log('Missing columns:', missingColumns.join(', '));
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking table structure:', error);
    return false;
  }
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

    // Check table structure
    const hasValidStructure = await checkTableStructure(pool);
    if (hasValidStructure) {
      console.log('Contacts table exists with correct structure');
      await pool.end();
      return;
    }

    console.log('Table needs to be recreated');

    // Read and log the schema
    const schemaPath = path.join(__dirname, '../schema.sql');
    console.log('Reading schema from:', schemaPath);
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute the schema
    await pool.query(schema);
    console.log('Schema executed successfully');
    
    // Verify the new structure
    const isValid = await checkTableStructure(pool);
    if (!isValid) {
      throw new Error('Table structure is still invalid after recreation');
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