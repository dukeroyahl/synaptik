#!/bin/bash

# 🧠 Synaptik - Development Setup Script
# Where Ideas Connect

echo "🧠 Setting up Synaptik..."

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install client dependencies
echo "📦 Installing client dependencies..."
cd client && npm install
cd ..

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server && npm install
cd ..

# Create data directory for database
echo "📁 Creating data directory..."
mkdir -p server/data

echo "✅ Setup complete!"
echo ""
echo "🎯 To start development:"
echo "   npm run dev"
echo ""
echo "🌐 Application will be available at:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3001"
echo ""
echo "📚 Available commands:"
echo "   npm run dev        - Start both client and server"
echo "   npm run client:dev - Start only client"
echo "   npm run server:dev - Start only server"
echo "   npm run build      - Build for production"
