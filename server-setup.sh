#!/bin/bash

# 🚀 Quick Server Setup for Dashboard Deployment
# ==============================================

echo "🔧 Setting up server for Dashboard deployment..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}📍 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Update system
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
print_status "Installing Node.js 18.x..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
print_status "Installing PM2..."
sudo npm install -g pm2

# Install Nginx
print_status "Installing Nginx..."
sudo apt install -y nginx

# Install UFW firewall
print_status "Installing UFW firewall..."
sudo apt install -y ufw

# Configure firewall
print_status "Configuring firewall..."
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Install Certbot for SSL
print_status "Installing Certbot for SSL..."
sudo apt install -y certbot python3-certbot-nginx

# Create dashboard user
print_status "Creating dashboard user..."
sudo useradd -m -s /bin/bash dashboard || true
sudo usermod -aG sudo dashboard || true

# Install useful tools
print_status "Installing useful tools..."
sudo apt install -y htop curl wget git unzip jq

print_success "Server setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Copy your dashboard files to the server"
echo "2. Run the deploy.sh script"
echo "3. Configure your domain and SSL"
echo ""
echo "🔧 Useful commands:"
echo "• Check Node.js: node --version"
echo "• Check PM2: pm2 --version"
echo "• Check Nginx: nginx -v"
echo "• Check firewall: sudo ufw status"
