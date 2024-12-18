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
        const result = await pool.query('SELECT column_name FROM information_schema.columns WHERE table_name = $1', ['contacts']);
        console.log('Table columns:', result.rows.map(r => r.column_name).join(', '));
        await pool.end();
    } catch (error) {
        console.error('Verification failed:', error);
        process.exit(1);
    }
}

verify();
"; then
    echo "Schema verification failed"
    exit 1
fi

echo "Starting Next.js application..."
exec node server.js 