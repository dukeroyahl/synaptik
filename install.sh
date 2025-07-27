#!/bin/bash

# Synaptik Installation Script
# This script sets up Synaptik with minimal user intervention

set -e

echo "🚀 Welcome to Synaptik Installation"
echo "===================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first:"
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first:"
    echo "   Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

# Use docker compose if available, otherwise fall back to docker-compose
DOCKER_COMPOSE_CMD="docker compose"
if ! docker compose version &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
fi

echo "✅ Docker and Docker Compose are installed"

# Create data directories only if they don't exist
echo "📁 Checking data directories..."
if [ ! -d "$HOME/.synaptik/data" ]; then
    mkdir -p "$HOME/.synaptik/data"
    echo "✅ Created data directory: $HOME/.synaptik/data"
else
    echo "✅ Data directory already exists: $HOME/.synaptik/data"
fi

if [ ! -d "$HOME/.synaptik/logs" ]; then
    mkdir -p "$HOME/.synaptik/logs"
    echo "✅ Created logs directory: $HOME/.synaptik/logs"
else
    echo "✅ Logs directory already exists: $HOME/.synaptik/logs"
fi

# Download docker-compose.yml if it doesn't exist
if [ ! -f "docker-compose.yml" ]; then
    echo "📥 Downloading docker-compose.yml..."
    curl -sSL https://raw.githubusercontent.com/roudranil/synaptik/main/dist/docker-compose.yml -o docker-compose.yml
    echo "✅ docker-compose.yml downloaded"
fi

# Download .env.example and create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo "⚙️  Setting up environment configuration..."
    if [ ! -f ".env.example" ]; then
        curl -sSL https://raw.githubusercontent.com/roudranil/synaptik/main/dist/docker/.env.example -o .env.example
    fi
    cp .env.example .env
    echo "✅ Environment configuration created (.env)"
fi

# Start the application
echo "🚀 Starting Synaptik..."
$DOCKER_COMPOSE_CMD up -d

echo ""
echo "🎉 Synaptik installation completed!"
echo "=================================="
echo ""
echo "🌐 Access your application at:"
echo "   Frontend: http://localhost"
echo "   API:      http://localhost:8080"
echo ""
echo "📊 To check status: $DOCKER_COMPOSE_CMD ps"
echo "📜 To view logs:    $DOCKER_COMPOSE_CMD logs -f"
echo "🛑 To stop:         $DOCKER_COMPOSE_CMD down"
echo ""
echo "💾 Your data is stored in: $HOME/.synaptik/"
echo "   This ensures data persistence across updates!"
echo ""
echo "📖 For more information, visit the documentation:"
echo "   https://github.com/roudranil/synaptik/wiki"