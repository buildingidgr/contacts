#!/bin/sh
set -e

echo "Starting database initialization..."
node scripts/init-db.js
if [ $? -eq 0 ]; then
    echo "Database initialization completed successfully"
else
    echo "Database initialization failed"
    exit 1
fi

echo "Starting Next.js application..."
exec node server.js 