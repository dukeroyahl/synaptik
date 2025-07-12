#!/bin/bash

echo "Setting up Synaptik MCP Server..."

# Navigate to MCP server directory
cd "$(dirname "$0")"

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the project
echo "Building the project..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
else
    echo "❌ Build failed!"
    exit 1
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the server:"
echo "  npm start"
echo ""
echo "To run in development mode:"
echo "  npm run dev"
echo ""
echo "To test the server:"
echo "  node test-tools.mjs"
echo ""
echo "To configure the API URL, set the environment variable:"
echo "  export SYNAPTIK_API_URL=http://localhost:3001/api"
