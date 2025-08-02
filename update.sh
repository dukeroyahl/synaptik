#!/bin/bash

# Synaptik Quick Update Script
# Downloads and runs the latest installation script

set -e

echo "🔄 Synaptik Quick Update"
echo "========================"
echo "Downloading and running the latest installation script..."
echo ""

# Download and execute the latest install script
curl -sSL https://raw.githubusercontent.com/Dukeroyahl/synaptik/main/install.sh | bash

echo ""
echo "✅ Update complete!"
