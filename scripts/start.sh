#!/bin/sh

# Run database initialization
node scripts/init-db.js

# Start the application
node server.js 