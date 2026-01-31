#!/bin/sh
set -e

echo "🚀 Starting application..."

# Run database migrations
if [ "$NODE_ENV" = "production" ]; then
  echo "📦 Running database migrations..."
  node dist/database/data-source.js || echo "⚠️  Migration failed or no migrations to run"
fi

# Start the application
echo "✅ Starting NestJS application..."
exec "$@"
