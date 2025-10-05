#!/bin/bash

echo "🚀 Installing ALL dependencies for Server Dashboard..."
echo "=================================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "📍 Working in: $SCRIPT_DIR"
echo ""

# Install root dependencies
echo "📦 Installing root dependencies..."
cd "$SCRIPT_DIR"
npm install

echo ""

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd "$SCRIPT_DIR/backend"
npm install

echo ""

# Install agent dependencies
echo "📦 Installing agent dependencies..."
cd "$SCRIPT_DIR/agent"
npm install

echo ""

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd "$SCRIPT_DIR/frontend"
npm install

echo ""
echo "✅ All dependencies installed successfully!"
echo "=================================================="
echo "Now you can run: ./start-all.sh"