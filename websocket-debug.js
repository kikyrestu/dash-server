// Simple WebSocket test to debug connection status
const WebSocket = require('ws');

console.log('🔌 Starting WebSocket connection test...');

const ws = new WebSocket('ws://localhost:3001');

ws.on('open', () => {
  console.log('✅ WebSocket connected successfully!');
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    console.log('📨 Received message:', {
      type: message.type,
      timestamp: new Date().toLocaleTimeString(),
      hasData: !!message.data,
      cpu: message.data?.cpu
    });
  } catch (error) {
    console.error('❌ Error parsing message:', error);
  }
});

ws.on('close', (code, reason) => {
  console.log(`🔌 WebSocket disconnected. Code: ${code}, Reason: ${reason || 'None'}`);
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error);
});

// Keep process running for 30 seconds
setTimeout(() => {
  console.log('⏹️ Closing WebSocket connection...');
  ws.close();
  process.exit(0);
}, 30000);
