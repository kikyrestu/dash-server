#!/bin/bash

# Dashboard Application Management Script
# Quick commands for managing the dashboard application

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if PM2 is available
if ! command -v pm2 &> /dev/null; then
    echo -e "${RED}❌ PM2 is not installed. Please install PM2 first:${NC}"
    echo "npm install -g pm2"
    exit 1
fi

show_usage() {
    echo -e "${BLUE}📋 Dashboard Management Commands:${NC}"
    echo
    echo "Usage: $0 [command]"
    echo
    echo "Commands:"
    echo "  start     - Start all services"
    echo "  stop      - Stop all services"
    echo "  restart   - Restart all services"
    echo "  status    - Show service status"
    echo "  logs      - Show application logs"
    echo "  monitor   - Open PM2 monitoring"
    echo "  build     - Rebuild frontend"
    echo "  install   - Install dependencies"
    echo "  backup    - Create application backup"
    echo
}

start_services() {
    echo -e "${BLUE}🚀 Starting Dashboard services...${NC}"
    
    # Start backend
    echo "Starting backend..."
    cd backend && pm2 start server.js --name "dashboard-backend" || echo "Backend already running"
    
    # Start agent
    echo "Starting agent..."
    cd ../agent && pm2 start collect.js --name "dashboard-agent" || echo "Agent already running"
    
    # Save PM2 configuration
    pm2 save
    
    echo -e "${GREEN}✅ Services started${NC}"
    pm2 status
}

stop_services() {
    echo -e "${YELLOW}⏹️  Stopping Dashboard services...${NC}"
    
    pm2 stop dashboard-backend dashboard-agent 2>/dev/null || echo "Services not running"
    
    echo -e "${GREEN}✅ Services stopped${NC}"
}

restart_services() {
    echo -e "${BLUE}🔄 Restarting Dashboard services...${NC}"
    
    pm2 restart dashboard-backend dashboard-agent 2>/dev/null || echo "Starting services..."
    start_services
    
    echo -e "${GREEN}✅ Services restarted${NC}"
}

show_status() {
    echo -e "${BLUE}📊 Dashboard Status:${NC}"
    echo
    
    # PM2 status
    echo "=== PM2 Services ==="
    pm2 status
    
    echo
    echo "=== System Resources ==="
    echo "Memory usage:"
    free -h
    
    echo
    echo "Disk usage:"
    df -h
    
    echo
    echo "=== Recent Logs ==="
    echo "Backend (last 5 lines):"
    pm2 logs dashboard-backend --lines 5 --nostream 2>/dev/null || echo "No backend logs"
    
    echo
    echo "Agent (last 5 lines):"
    pm2 logs dashboard-agent --lines 5 --nostream 2>/dev/null || echo "No agent logs"
}

show_logs() {
    echo -e "${BLUE}📝 Application Logs:${NC}"
    echo "Press Ctrl+C to exit log view"
    echo
    
    pm2 logs
}

monitor_services() {
    echo -e "${BLUE}📱 Opening PM2 Monitor...${NC}"
    pm2 monit
}

build_frontend() {
    echo -e "${BLUE}🔨 Building frontend...${NC}"
    
    if [[ -d "frontend" ]]; then
        cd frontend
        npm install
        npm run build
        echo -e "${GREEN}✅ Frontend built successfully${NC}"
        cd ..
    else
        echo -e "${RED}❌ Frontend directory not found${NC}"
        exit 1
    fi
}

install_dependencies() {
    echo -e "${BLUE}📦 Installing dependencies...${NC}"
    
    # Backend dependencies
    if [[ -d "backend" ]]; then
        echo "Installing backend dependencies..."
        cd backend && npm install && cd ..
    fi
    
    # Frontend dependencies
    if [[ -d "frontend" ]]; then
        echo "Installing frontend dependencies..."
        cd frontend && npm install && cd ..
    fi
    
    # Agent dependencies
    if [[ -d "agent" ]]; then
        echo "Installing agent dependencies..."
        cd agent && npm install && cd ..
    fi
    
    echo -e "${GREEN}✅ Dependencies installed${NC}"
}

create_backup() {
    echo -e "${BLUE}💾 Creating backup...${NC}"
    
    BACKUP_NAME="dashboard-backup-$(date +%Y%m%d_%H%M%S)"
    
    # Create backup directory
    mkdir -p ../backups
    
    # Create backup archive
    tar -czf "../backups/${BACKUP_NAME}.tar.gz" \
        --exclude=node_modules \
        --exclude=build \
        --exclude=logs \
        .
    
    echo -e "${GREEN}✅ Backup created: ../backups/${BACKUP_NAME}.tar.gz${NC}"
}

# Main script logic
case "${1:-help}" in
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    monitor)
        monitor_services
        ;;
    build)
        build_frontend
        ;;
    install)
        install_dependencies
        ;;
    backup)
        create_backup
        ;;
    help|--help|-h)
        show_usage
        ;;
    *)
        echo -e "${RED}❌ Unknown command: $1${NC}"
        echo
        show_usage
        exit 1
        ;;
esac
