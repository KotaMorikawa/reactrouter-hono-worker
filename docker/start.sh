#!/bin/bash

echo "🚀 Starting development environment with Docker..."

# Docker Composeでサービスを起動
echo "📦 Building and starting services..."
docker-compose up --build

echo "✅ Development environment started!"
echo "🌐 Frontend: http://localhost:5173"
echo "⚡ Backend API: http://localhost:8787"
echo "🗄️ PostgreSQL: localhost:5432"
echo "📦 Redis: localhost:6379"