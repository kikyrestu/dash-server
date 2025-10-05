#!/bin/bash

# Dashboard Project Cleanup Script
# Removes unused files and prepares for production deployment

echo "🧹 Cleaning up Dashboard project..."

# Remove unused component files
echo "Removing unused component files..."
cd frontend/src/components

# Files already removed in previous cleanup
echo "✅ Cleanup already completed in components directory"

# Remove development files
cd ../../..
echo "Removing development files..."

# Remove test files
rm -rf frontend/src/setupTests.ts
rm -rf frontend/src/App.test.tsx
rm -rf frontend/src/reportWebVitals.ts

# Remove README and MD files that are not needed in production
find . -name "*.md" -not -name "README.md" -type f -exec rm -f {} \;

# Clean node_modules and package-lock files
echo "Cleaning package files..."
find . -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true
find . -name "package-lock.json" -type f -exec rm -f {} + 2>/dev/null || true

# Remove build directories
rm -rf frontend/build 2>/dev/null || true

# Create production directory structure
echo "Creating production structure..."
mkdir -p production/{backend,frontend,agent}
mkdir -p production/config
mkdir -p production/scripts

# Copy essential files
echo "Copying production files..."

# Backend
cp -r backend/* production/backend/
cp package.json production/

# Frontend  
cp -r frontend/src production/frontend/
cp -r frontend/public production/frontend/
cp frontend/package.json production/frontend/
cp frontend/tsconfig.json production/frontend/
cp frontend/tailwind.config.js production/frontend/
cp frontend/postcss.config.js production/frontend/

# Agent
cp -r agent/* production/agent/

# Scripts
cp deploy.sh production/scripts/
cp server-setup.sh production/scripts/
cp .env.example production/config/

# Create production package.json
cat > production/package.json << 'EOF'
{
  "name": "server-dashboard",
  "version": "1.0.0",
  "description": "Server monitoring dashboard",
  "main": "backend/server.js",
  "scripts": {
    "start": "node backend/server.js",
    "dev": "nodemon backend/server.js",
    "build": "cd frontend && npm run build",
    "install-all": "npm install && cd backend && npm install && cd ../frontend && npm install && cd ../agent && npm install",
    "deploy": "chmod +x scripts/deploy.sh && ./scripts/deploy.sh"
  },
  "keywords": ["server", "monitoring", "dashboard"],
  "author": "Dashboard Team",
  "license": "MIT"
}
EOF

echo "✅ Cleanup completed!"
echo
echo "Production files are ready in ./production/ directory"
echo "📦 Ready for deployment:"
echo "  1. Copy production/ directory to your server"
echo "  2. Run: npm run install-all"
echo "  3. Configure .env files"
echo "  4. Run: sudo ./scripts/deploy.sh"
