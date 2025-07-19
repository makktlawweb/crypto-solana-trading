#!/bin/sh

# Wait for database to be ready
echo "Checking database connection..."

# Run database migration if DATABASE_URL is available
if [ -n "$DATABASE_URL" ]; then
  echo "Running database migration..."
  npx drizzle-kit push
  echo "Database migration completed"
else
  echo "No DATABASE_URL found, skipping migration"
fi

# Start the application
echo "Starting application..."
npm start