#!/bin/bash

# Safe Tag Recreation Script
# Recreates a Git tag while minimizing GitHub Actions workflow conflicts

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if tag name is provided
if [ $# -eq 0 ]; then
    print_error "Usage: $0 <tag-name> [commit-hash]"
    echo ""
    echo "Examples:"
    echo "  $0 v0.0.3                    # Recreate tag v0.0.3 at current HEAD"
    echo "  $0 v0.0.3 abc123             # Recreate tag v0.0.3 at specific commit"
    echo "  $0 v0.0.3 HEAD~1             # Recreate tag v0.0.3 at previous commit"
    exit 1
fi

TAG_NAME="$1"
COMMIT_HASH="${2:-HEAD}"

print_status "Safe Tag Recreation for: $TAG_NAME"
echo "========================================"
echo ""

# Validate we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "Not in a Git repository"
    exit 1
fi

# Resolve commit hash
RESOLVED_COMMIT=$(git rev-parse "$COMMIT_HASH")
print_status "Target commit: $RESOLVED_COMMIT"

# Check if tag exists locally
if git tag -l | grep -q "^$TAG_NAME$"; then
    print_warning "Tag $TAG_NAME exists locally"
    
    # Check if it points to the same commit
    CURRENT_COMMIT=$(git rev-list -n 1 "$TAG_NAME" 2>/dev/null || echo "")
    if [ "$CURRENT_COMMIT" = "$RESOLVED_COMMIT" ]; then
        print_success "Tag $TAG_NAME already points to $RESOLVED_COMMIT"
        echo ""
        print_status "Checking remote status..."
        
        # Force push to ensure remote is updated
        if git push origin "$TAG_NAME" --force; then
            print_success "Remote tag is up to date"
        else
            print_warning "Failed to update remote tag"
        fi
        exit 0
    fi
    
    print_status "Current tag points to: $CURRENT_COMMIT"
    print_status "Will update to point to: $RESOLVED_COMMIT"
    echo ""
fi

# Check if tag exists on remote
print_status "Checking remote tag status..."
if git ls-remote --tags origin | grep -q "refs/tags/$TAG_NAME$"; then
    print_warning "Tag $TAG_NAME exists on remote"
    REMOTE_EXISTS=true
else
    print_status "Tag $TAG_NAME does not exist on remote"
    REMOTE_EXISTS=false
fi

echo ""
print_status "Recreation plan:"
echo "1. Delete local tag (if exists)"
echo "2. Create new local tag at $RESOLVED_COMMIT"
if [ "$REMOTE_EXISTS" = true ]; then
    echo "3. Delete remote tag"
    echo "4. Wait for cleanup workflow to complete"
    echo "5. Push new tag to remote"
else
    echo "3. Push new tag to remote"
fi

echo ""
read -p "Continue? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_status "Operation cancelled"
    exit 0
fi

echo ""
print_status "Starting tag recreation..."

# Step 1: Delete local tag if it exists
if git tag -l | grep -q "^$TAG_NAME$"; then
    print_status "Deleting local tag..."
    git tag -d "$TAG_NAME"
    print_success "Local tag deleted"
fi

# Step 2: Create new local tag
print_status "Creating new local tag at $RESOLVED_COMMIT..."
git tag "$TAG_NAME" "$RESOLVED_COMMIT"
print_success "Local tag created"

# Step 3 & 4: Handle remote tag
if [ "$REMOTE_EXISTS" = true ]; then
    print_status "Deleting remote tag..."
    git push origin ":refs/tags/$TAG_NAME"
    print_success "Remote tag deleted"
    
    print_status "Waiting for cleanup workflow to complete..."
    print_warning "This prevents race conditions between delete and push workflows"
    
    # Wait for GitHub Actions to process the delete event
    for i in {10..1}; do
        echo -ne "\rWaiting ${i}s for cleanup workflow... "
        sleep 1
    done
    echo ""
    print_success "Wait complete"
fi

# Step 5: Push new tag
print_status "Pushing new tag to remote..."
if git push origin "$TAG_NAME"; then
    print_success "Tag $TAG_NAME successfully recreated!"
    echo ""
    print_status "Summary:"
    echo "  Tag: $TAG_NAME"
    echo "  Commit: $RESOLVED_COMMIT"
    echo "  Message: $(git log -1 --pretty=format:'%s' "$RESOLVED_COMMIT")"
    echo ""
    print_success "GitHub Actions workflows will now run for the new tag"
else
    print_error "Failed to push tag to remote"
    exit 1
fi
