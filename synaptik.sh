#!/bin/bash

# Synaptik Launcher Script
# Delegates to the main management script in dist/scripts/

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check if the main script exists
if [ ! -f "$SCRIPT_DIR/dist/scripts/synaptik.sh" ]; then
    echo "❌ Main script not found at dist/scripts/synaptik.sh"
    exit 1
fi

# Forward all arguments to the main script
exec "$SCRIPT_DIR/dist/scripts/synaptik.sh" "$@"