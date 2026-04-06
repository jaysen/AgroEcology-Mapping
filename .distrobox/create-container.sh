#!/bin/bash
# Create generic development distrobox container

set -e

echo "🚀 Creating generic development container..."
echo ""


# Create the container using Universal Blue Fedora toolbox image
distrobox create \
  --name devbox \
  --image ghcr.io/ublue-os/fedora-toolbox:latest \
  --yes

echo ""
echo "✅ Container 'devbox' created successfully!"
echo ""
echo "Next steps:"
echo "  1. Enter the container: distrobox enter devbox"
echo "  2. Run setup script: ./.distrobox/setup.sh"
echo ""
