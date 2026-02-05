# Create reusable devbox
distrobox create --name devbox --image fedora:latest

# Enter it
distrobox enter devbox

# Install dev tools (inside devbox)
sudo dnf install -y nodejs npm git