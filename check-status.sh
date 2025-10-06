#!/bin/bash

echo "🔍 Checking Server Dashboard Status..."
echo ""

# Check backend server
echo "📡 Backend Server (Port 3001):"
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ Backend server is running"
    # Check if metrics are being received
    METRICS=$(curl -s http://localhost:3001/api/metrics | jq -r '.cpu // "no data"')
    if [ "$METRICS" != "no data" ]; then
        echo "✅ Metrics data is available (CPU: ${METRICS}%)"
    else
        echo "⚠️  No metrics data available"
    fi
else
    echo "❌ Backend server is not responding"
fi

echo ""

# Check frontend server
echo "🌐 Frontend Server (Port 3000):"
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend server is running"
else
    echo "❌ Frontend server is not responding"
fi

echo ""

# Check WebSocket connection
echo "🔌 WebSocket Connection:"
if netstat -tln | grep -q ":3001.*LISTEN"; then
    echo "✅ WebSocket server is listening on port 3001"
else
    echo "❌ WebSocket server is not listening"
fi

echo ""

# Check agent process
echo "🤖 Data Collection Agent:"
if pgrep -f "node collect.js" > /dev/null; then
    echo "✅ Agent is running"
else
    echo "❌ Agent is not running"
fi

echo ""

# Check data collection
echo "📊 Data Collection Test:"
BACKEND_CPU=$(curl -s http://localhost:3001/api/metrics | jq -r '.cpu // "null"')
if [ "$BACKEND_CPU" != "null" ] && [ "$BACKEND_CPU" != "" ]; then
    echo "✅ Backend has metrics data: CPU=${BACKEND_CPU}%"
else
    echo "⚠️  Backend has no metrics data"
fi

echo ""
echo "🎯 Dashboard Status Summary:"
echo "   Backend:  $(curl -s http://localhost:3001/health > /dev/null && echo '✅ Running' || echo '❌ Down')"
echo "   Frontend: $(curl -s http://localhost:3000 > /dev/null && echo '✅ Running' || echo '❌ Down')"  
echo "   Agent:    $(pgrep -f 'node collect.js' > /dev/null && echo '✅ Running' || echo '❌ Down')"
echo "   Data:     $([ "$(curl -s http://localhost:3001/api/metrics | jq -r '.cpu // "null"')" != "null" ] && echo '✅ Flowing' || echo '❌ No Data')"
echo ""
echo "🌐 Access Dashboard: http://localhost:3000"
echo "🔧 Admin Login: admin / admin123"
