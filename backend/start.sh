#!/bin/bash

echo "🚀 Starting Finanças do Lar System..."
echo "📊 Environment: $NODE_ENV"
echo "🔗 Port: $PORT"
echo "🗄️ Database: $POSTGRES_DB"
echo "👤 User: $POSTGRES_USER"
echo "🏠 Host: ${POSTGRES_HOST:-financas-postgres}"

# Wait for database to be ready with proper credentials
echo "⏳ Waiting for database connection..."
POSTGRES_HOST=${POSTGRES_HOST:-financas-postgres}
POSTGRES_PORT=${POSTGRES_PORT:-5432}

# Wait for PostgreSQL to be ready
until pg_isready -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" 2>/dev/null; do
  echo "Database is unavailable - sleeping for 5 seconds..."
  sleep 5
done
echo "✅ Database is ready!"

# Test database connection with credentials - with timeout
echo "🔐 Testing database authentication..."
RETRY_COUNT=0
MAX_RETRIES=20

until PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT 1;" > /dev/null 2>&1; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
    echo "❌ Database authentication failed after $MAX_RETRIES attempts"
    echo "🔍 Debug info:"
    echo "  - Host: $POSTGRES_HOST"
    echo "  - Port: $POSTGRES_PORT"
    echo "  - User: $POSTGRES_USER"
    echo "  - Database: $POSTGRES_DB"
    echo "  - Password length: ${#POSTGRES_PASSWORD}"
    
    # Try to connect to default postgres database first
    echo "🔄 Trying to connect to default postgres database..."
    if PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d postgres -c "SELECT 1;" > /dev/null 2>&1; then
      echo "✅ Can connect to default database, creating target database if needed..."
      PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d postgres -c "CREATE DATABASE $POSTGRES_DB;" 2>/dev/null || echo "Database may already exist"
      
      # Try again with the created database
      if PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT 1;" > /dev/null 2>&1; then
        echo "✅ Successfully connected to created database!"
        break
      fi
    else
      echo "❌ Cannot connect to PostgreSQL at all"
      exit 1
    fi
  else
    echo "Database authentication failed - retrying in 5 seconds... (attempt $RETRY_COUNT/$MAX_RETRIES)"
    sleep 5
  fi
done

if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
  echo "✅ Database authentication successful!"
fi

# Run database migrations
echo "🔄 Running database migrations..."
npx prisma migrate deploy || {
  echo "❌ Migration failed, but continuing..."
}

# Generate Prisma client (in case it's needed)
echo "🔧 Generating Prisma client..."
npx prisma generate || {
  echo "⚠️ Prisma generate failed, but continuing..."
}

# Seed database with initial data
echo "🌱 Seeding database..."
node src/seed.js || {
  echo "⚠️ Seeding failed or already completed"
}

# Start the application
echo "🎯 Starting application..."
exec node src/server.js