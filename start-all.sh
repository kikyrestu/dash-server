#!/bin/bash

# Get the absolute path of the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Starting Server Dashboard..."
echo "================================"
echo "📍 Working in: $SCRIPT_DIR"

# Function to cleanup background processes on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down all services..."
    kill $BACKEND_PID $AGENT_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set up trap to cleanup on Ctrl+C
trap cleanup SIGINT

echo "📦 Installing dependencies if needed..."
cd "$SCRIPT_DIR"
if [ ! -d "node_modules" ]; then
    npm install
fi

# Install backend dependencies
cd "$SCRIPT_DIR/backend"
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi

# Install agent dependencies
cd "$SCRIPT_DIR/agent"
if [ ! -d "node_modules" ]; then
    echo "📦 Installing agent dependencies..."
    npm install
fi

# Install frontend dependencies
cd "$SCRIPT_DIR/frontend"
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

echo ""
echo "🔧 Starting Backend Server..."
cd "$SCRIPT_DIR/backend" && npm start &
BACKEND_PID=$!

sleep 3

echo "📊 Starting Data Collection Agent..."
cd "$SCRIPT_DIR/agent" && npm start &
AGENT_PID=$!

sleep 2

echo "🖥️  Starting Frontend Dashboard..."
cd "$SCRIPT_DIR/frontend" && npm start &
FRONTEND_PID=$!

echo ""
echo "✅ All services started!"
echo "================================"
echo "🌐 Dashboard: http://localhost:3000"
echo "🔗 Backend API: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop all services"
echo "================================"

# Wait for all background processes
wait
