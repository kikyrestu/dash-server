#!/bin/bash

# 🚀 Server Dashboard - Production Deployment Script
# ================================================

echo "🚀 Starting Server Dashboard Deployment..."
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEPLOY_DIR="/opt/server-dashboard"
SERVICE_USER="dashboard"
DOMAIN="your-domain.com"  # Change this
NODE_ENV="production"

# Functions
print_status() {
    echo -e "${BLUE}📍 $1${NC}"
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

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons!"
   print_warning "Please run as a regular user with sudo privileges"
   exit 1
fi

print_status "Checking system requirements..."

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed!"
    echo "Please install Node.js 18+ first:"
    echo "curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -"
    echo "sudo apt-get install -y nodejs"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ required. Current: $(node --version)"
    exit 1
fi

print_success "Node.js $(node --version) found"

# Check PM2
if ! command -v pm2 &> /dev/null; then
    print_warning "PM2 not found. Installing PM2..."
    sudo npm install -g pm2
fi

print_success "PM2 found"

print_status "Creating deployment directory..."
sudo mkdir -p $DEPLOY_DIR
sudo chown $USER:$USER $DEPLOY_DIR

print_status "Building frontend..."
cd frontend
npm ci --production=false
npm run build
print_success "Frontend built successfully"

print_status "Installing backend dependencies..."
cd ../backend
npm ci --production
print_success "Backend dependencies installed"

print_status "Installing agent dependencies..."
cd ../agent
npm ci --production
print_success "Agent dependencies installed"

cd ..

print_status "Copying files to deployment directory..."
# Copy backend
sudo cp -r backend/* $DEPLOY_DIR/
sudo cp -r agent $DEPLOY_DIR/

# Copy frontend build
sudo mkdir -p $DEPLOY_DIR/public
sudo cp -r frontend/build/* $DEPLOY_DIR/public/

# Copy scripts
sudo cp start-*.sh stop-all.sh $DEPLOY_DIR/

# Set permissions
sudo chown -R $USER:$USER $DEPLOY_DIR
sudo chmod +x $DEPLOY_DIR/*.sh

print_success "Files copied to $DEPLOY_DIR"

print_status "Creating systemd service..."

# Create systemd service file
sudo tee /etc/systemd/system/server-dashboard.service > /dev/null <<EOF
[Unit]
Description=Server Dashboard
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$DEPLOY_DIR
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3001

[Install]
WantedBy=multi-user.target
EOF

# Create agent service
sudo tee /etc/systemd/system/dashboard-agent.service > /dev/null <<EOF
[Unit]
Description=Dashboard Monitoring Agent
After=network.target server-dashboard.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$DEPLOY_DIR/agent
ExecStart=/usr/bin/node collect.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and enable services
sudo systemctl daemon-reload
sudo systemctl enable server-dashboard
sudo systemctl enable dashboard-agent

print_success "Systemd services created"

print_status "Creating Nginx configuration..."

# Create Nginx config
sudo tee /etc/nginx/sites-available/server-dashboard > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN;

    # SSL Configuration (you need to add your certificates)
    # ssl_certificate /path/to/your/certificate.crt;
    # ssl_certificate_key /path/to/your/private.key;

    # Frontend (React app)
    location / {
        root $DEPLOY_DIR/public;
        index index.html;
        try_files \$uri \$uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # WebSocket support
    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host \$host;
    }
}
EOF

# Enable site (if Nginx is installed)
if command -v nginx &> /dev/null; then
    sudo ln -sf /etc/nginx/sites-available/server-dashboard /etc/nginx/sites-enabled/
    sudo nginx -t && sudo systemctl reload nginx
    print_success "Nginx configuration created"
else
    print_warning "Nginx not installed. Configuration saved to /etc/nginx/sites-available/server-dashboard"
fi

print_status "Creating environment configuration..."

# Create production environment file
cat > $DEPLOY_DIR/.env <<EOF
# Production Environment Configuration
NODE_ENV=production
PORT=3001

# JWT Configuration (CHANGE THIS IN PRODUCTION!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Database Configuration (if using external DB)
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=dashboard
# DB_USER=dashboard
# DB_PASS=your-password

# Admin Configuration
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# Monitoring Configuration
MONITOR_INTERVAL=2000
MAX_HISTORY=100

# Security Configuration
CORS_ORIGIN=https://$DOMAIN
EOF

print_success "Environment configuration created"

print_status "Starting services..."

# Start services
sudo systemctl start server-dashboard
sudo systemctl start dashboard-agent

sleep 3

# Check service status
if sudo systemctl is-active --quiet server-dashboard; then
    print_success "Backend service is running"
else
    print_error "Backend service failed to start"
    sudo systemctl status server-dashboard
fi

if sudo systemctl is-active --quiet dashboard-agent; then
    print_success "Agent service is running"
else
    print_error "Agent service failed to start"
    sudo systemctl status dashboard-agent
fi

echo ""
echo "================================================"
print_success "🎉 Deployment completed successfully!"
echo "================================================"
echo ""
echo "📋 Next Steps:"
echo "1. Configure your domain DNS to point to this server"
echo "2. Install SSL certificates (Let's Encrypt recommended)"
echo "3. Update JWT_SECRET in $DEPLOY_DIR/.env"
echo "4. Configure firewall to allow ports 80, 443"
echo ""
echo "📊 Service Management:"
echo "• Start: sudo systemctl start server-dashboard"
echo "• Stop: sudo systemctl stop server-dashboard"
echo "• Status: sudo systemctl status server-dashboard"
echo "• Logs: sudo journalctl -u server-dashboard -f"
echo ""
echo "🌐 Access your dashboard:"
echo "• Local: http://localhost"
echo "• Domain: https://$DOMAIN (after DNS/SSL setup)"
echo ""
echo "🔐 Default Login:"
echo "• Username: admin"
echo "• Password: admin123"
echo ""
print_warning "Remember to change default credentials in production!"
