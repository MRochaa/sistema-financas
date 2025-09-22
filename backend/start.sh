#!/bin/sh

echo "🚀 Starting Finanças do Lar System..."
echo "📊 Environment: $NODE_ENV"
echo "🔗 Port: $PORT"
echo "🗄️ Database: $POSTGRES_DB"
echo "👤 User: $POSTGRES_USER"

# Wait for database to be ready with proper credentials
echo "⏳ Waiting for database connection..."
until pg_isready -h postgres -p 5432 -U "$POSTGRES_USER" -d "$POSTGRES_DB"; do
  echo "Database is unavailable - sleeping for 3 seconds..."
  sleep 3
done
echo "✅ Database is ready!"

# Test database connection with credentials
echo "🔐 Testing database authentication..."
until PGPASSWORD="$POSTGRES_PASSWORD" psql -h postgres -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT 1;" > /dev/null 2>&1; do
  echo "Database authentication failed - retrying in 3 seconds..."
  sleep 3
done
echo "✅ Database authentication successful!"

# Run database migrations
echo "🔄 Running database migrations..."
npx prisma migrate deploy || {
  echo "❌ Migration failed, but continuing..."
}

# Seed database with initial data
echo "🌱 Seeding database..."
node src/seed.js || {
  echo "⚠️ Seeding failed or already completed"
}

# Start the application
echo "🎯 Starting application..."
exec node src/server.js