#!/bin/sh
set -e

echo "Starting database initialization..."
if ! node scripts/init-db.js; then
    echo "Database initialization failed"
    exit 1
fi

echo "Verifying database schema..."
if ! node -e "
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : undefined
});

async function verify() {
    try {
        const result = await pool.query(\`
            SELECT column_name, data_type, character_maximum_length
            FROM information_schema.columns 
            WHERE table_name = 'contacts'
            ORDER BY ordinal_position;\`
        );
        
        if (result.rows.length === 0) {
            console.error('No columns found in contacts table');
            process.exit(1);
        }
        
        console.log('Table structure:');
        result.rows.forEach(col => {
            console.log(\`- \${col.column_name}: \${col.data_type}\${
                col.character_maximum_length ? \`(\${col.character_maximum_length})\` : ''
            }\`);
        });
        
        await pool.end();
    } catch (error) {
        console.error('Verification failed:', error);
        process.exit(1);
    }
}

verify().catch(error => {
    console.error('Verification error:', error);
    process.exit(1);
});
"; then
    echo "Schema verification failed"
    exit 1
fi

echo "Starting Next.js application..."
exec node server.js 