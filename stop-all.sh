#!/bin/bash

echo "🛑 Stopping Server Dashboard..."
echo "================================"

# Stop all processes related to the dashboard
echo "📊 Stopping backend server..."
pkill -f "node server.js"

echo "🔍 Stopping monitoring agent..."
pkill -f "node collect.js"

echo "🖥️ Stopping frontend..."
pkill -f "react-scripts start"

echo "🧹 Cleaning up npm processes..."
pkill -f "npm start"

echo ""
echo "✅ All services stopped!"
echo "Dashboard shutdown complete."
