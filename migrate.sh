#!/bin/bash

# Easy Migration Script for Dashboard
# This script helps migrate the dashboard to a new server

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 Dashboard Migration Helper${NC}"
echo "================================="

# Function to display options
show_menu() {
    echo
    echo "Choose migration option:"
    echo "1) 📦 Package for deployment (create deployment archive)"
    echo "2) 🖥️  Setup new server (prepare server for dashboard)"
    echo "3) 🚀 Deploy to server (full deployment)"
    echo "4) ⚙️  Build only (build frontend for production)"
    echo "5) 🧹 Cleanup project (remove unused files)"
    echo "6) ❌ Exit"
    echo
}

# Package for deployment
package_deployment() {
    echo -e "${BLUE}📦 Creating deployment package...${NC}"
    
    # Build frontend
    echo "Building frontend..."
    cd frontend
    npm install
    npm run build
    cd ..
    
    # Create deployment archive
    echo "Creating archive..."
    tar -czf dashboard-deployment.tar.gz \
        --exclude=node_modules \
        --exclude=.git \
        --exclude='*.md' \
        --exclude=cleanup.sh \
        backend/ \
        frontend/build/ \
        frontend/package.json \
        agent/ \
        deploy.sh \
        server-setup.sh \
        .env.example \
        package.json
    
    echo -e "${GREEN}✅ Deployment package created: dashboard-deployment.tar.gz${NC}"
    echo "📤 Upload this file to your server and extract it"
}

# Setup server
setup_server() {
    echo -e "${BLUE}🖥️  Server setup instructions:${NC}"
    echo
    echo "Run these commands on your target server:"
    echo
    echo -e "${YELLOW}# 1. Update system and install dependencies${NC}"
    echo "sudo apt update && sudo apt upgrade -y"
    echo "curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -"
    echo "sudo apt-get install -y nodejs nginx pm2 git ufw"
    echo
    echo -e "${YELLOW}# 2. Create application user${NC}"
    echo "sudo useradd -r -s /bin/bash -m dashboard"
    echo "sudo mkdir -p /opt/server-dashboard"
    echo "sudo chown dashboard:dashboard /opt/server-dashboard"
    echo
    echo -e "${YELLOW}# 3. Upload and extract dashboard files${NC}"
    echo "scp dashboard-deployment.tar.gz user@server:/tmp/"
    echo "sudo su - dashboard"
    echo "cd /opt/server-dashboard"
    echo "tar -xzf /tmp/dashboard-deployment.tar.gz"
    echo
    echo -e "${YELLOW}# 4. Run deployment script${NC}"
    echo "sudo ./deploy.sh"
}

# Deploy to server
deploy_server() {
    echo -e "${BLUE}🚀 Starting deployment...${NC}"
    
    # Check if deploy.sh exists and is executable
    if [[ ! -x "./deploy.sh" ]]; then
        echo -e "${RED}❌ deploy.sh not found or not executable${NC}"
        echo "Make sure you're in the project directory"
        exit 1
    fi
    
    echo "Running deployment script..."
    sudo ./deploy.sh
}

# Build frontend only
build_frontend() {
    echo -e "${BLUE}⚙️  Building frontend...${NC}"
    
    cd frontend
    echo "Installing dependencies..."
    npm install
    
    echo "Building for production..."
    npm run build
    
    echo -e "${GREEN}✅ Frontend built successfully${NC}"
    echo "Build files are in: frontend/build/"
    cd ..
}

# Cleanup project
cleanup_project() {
    echo -e "${BLUE}🧹 Cleaning up project...${NC}"
    
    if [[ -x "./cleanup.sh" ]]; then
        ./cleanup.sh
    else
        echo "Running basic cleanup..."
        find . -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true
        find . -name "*.log" -type f -exec rm -f {} + 2>/dev/null || true
        rm -rf frontend/build 2>/dev/null || true
        echo -e "${GREEN}✅ Basic cleanup completed${NC}"
    fi
}

# Main menu loop
while true; do
    show_menu
    read -p "Enter your choice (1-6): " choice
    
    case $choice in
        1)
            package_deployment
            ;;
        2)
            setup_server
            ;;
        3)
            deploy_server
            ;;
        4)
            build_frontend
            ;;
        5)
            cleanup_project
            ;;
        6)
            echo "👋 Goodbye!"
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Invalid option. Please choose 1-6.${NC}"
            ;;
    esac
    
    echo
    read -p "Press Enter to continue..."
done
