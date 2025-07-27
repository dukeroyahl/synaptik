#!/bin/bash

# Synaptik Docker Build Script with Semantic Versioning
# Usage: ./scripts/build-docker.sh [version]
# Example: ./scripts/build-docker.sh 1.2.3

set -e

# Get version from argument, git tag, or default
VERSION=${1:-$(git describe --tags --abbrev=0 2>/dev/null | sed 's/^v//' || echo "0.1.0")}

# Validate semantic version format
if ! [[ $VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "❌ Invalid version format: $VERSION"
    echo "   Expected format: X.Y.Z (e.g., 1.2.3)"
    exit 1
fi

# Extract major and minor versions
MAJOR=$(echo $VERSION | cut -d. -f1)
MINOR=$(echo $VERSION | cut -d. -f1-2)

echo "🚀 Building Synaptik Docker image"
echo "   Version: $VERSION"
echo "   Tags: $VERSION, $MINOR, $MAJOR, latest"
echo ""

# Build with multiple tags
echo "🔨 Building Docker image..."
docker build \
  -t roudranil/synaptik:$VERSION \
  -t roudranil/synaptik:$MINOR \
  -t roudranil/synaptik:$MAJOR \
  -t roudranil/synaptik:latest \
  .

echo ""
echo "✅ Successfully built Docker image with tags:"
echo "   • roudranil/synaptik:$VERSION"
echo "   • roudranil/synaptik:$MINOR"
echo "   • roudranil/synaptik:$MAJOR"
echo "   • roudranil/synaptik:latest"
echo ""
echo "📦 To push to Docker Hub, run:"
echo "   docker push roudranil/synaptik:$VERSION"
echo "   docker push roudranil/synaptik:$MINOR"
echo "   docker push roudranil/synaptik:$MAJOR"
echo "   docker push roudranil/synaptik:latest"
echo ""
echo "🏷️  To create a git tag for this version:"
echo "   git tag v$VERSION"
echo "   git push origin v$VERSION"
