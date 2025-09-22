#!/bin/sh

echo "🚀 Starting Finanças do Lar System..."
echo "📊 Environment: $NODE_ENV"
echo "🔗 Port: $PORT"

# Wait for database to be ready
echo "⏳ Waiting for database..."
until pg_isready -h postgres -p 5432 -U "$POSTGRES_USER" -d "$POSTGRES_DB"; do
  echo "Database is unavailable - sleeping"
  sleep 2
done
echo "✅ Database is ready!"

# Run database migrations
echo "🔄 Running database migrations..."
npx prisma migrate deploy

# Seed database with initial data
echo "🌱 Seeding database..."
node src/seed.js || echo "⚠️ Seeding failed or already completed"

# Start the application
echo "🎯 Starting application..."
exec node src/server.js