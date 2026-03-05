#!/bin/bash

# Course Service Setup Script
echo "🚀 Setting up Course Service..."

# Check if .env exists, if not create it from env.example
if [ ! -f .env ]; then
    echo "📝 Creating .env file from env.example..."
    cp env.example .env
    echo "✅ .env file created. Please review the environment variables."
else
    echo "✅ .env file already exists."
fi

echo ""
echo "📋 Next steps:"
echo "1. Start infrastructure: docker compose -f ../../infra/docker-compose.yml up -d"
echo "2. Run migrations: npx prisma migrate dev --name init"
echo "3. Start service: npm run start:dev"
echo ""
echo "🌐 Service will be available at: http://localhost:3002"
echo "❤️  Health check: curl http://localhost:3002/health"
