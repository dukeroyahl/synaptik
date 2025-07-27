#!/bin/bash

# Synaptik Docker Push Script
# Usage: ./scripts/push-docker.sh [version]
# Example: ./scripts/push-docker.sh 1.2.3

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

echo "📦 Pushing Synaptik Docker images to Docker Hub"
echo "   Version: $VERSION"
echo ""

# Check if images exist locally
TAGS=("$VERSION" "$MINOR" "$MAJOR" "latest")
for tag in "${TAGS[@]}"; do
    if ! docker image inspect roudranil/synaptik:$tag >/dev/null 2>&1; then
        echo "❌ Image roudranil/synaptik:$tag not found locally"
        echo "   Run ./scripts/build-docker.sh $VERSION first"
        exit 1
    fi
done

# Push all tags
echo "🚀 Pushing images..."
for tag in "${TAGS[@]}"; do
    echo "   Pushing roudranil/synaptik:$tag..."
    docker push roudranil/synaptik:$tag
done

echo ""
echo "✅ Successfully pushed all Docker images:"
echo "   • roudranil/synaptik:$VERSION"
echo "   • roudranil/synaptik:$MINOR"
echo "   • roudranil/synaptik:$MAJOR"
echo "   • roudranil/synaptik:latest"
echo ""
echo "🌐 Images available at: https://hub.docker.com/r/roudranil/synaptik"
