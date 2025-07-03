import { useState, useEffect, useRef } from 'react';

const useWebSocketSimple = (url) => {
  const [data, setData] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('Connecting');
  const ws = useRef(null);

  useEffect(() => {
    console.log('🔌 Attempting WebSocket connection to:', url);
    
    ws.current = new WebSocket(url);
    
    ws.current.onopen = () => {
      console.log('✅ WebSocket connected successfully');
      setConnectionStatus('Connected');
    };

    ws.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('📨 Received message type:', message.type, 'at', new Date().toLocaleTimeString());
        
        if (message.type === 'metrics' && message.data) {
          setData(message.data);
          setConnectionStatus('Connected');
          console.log('📊 Updated metrics data - CPU:', message.data.cpu + '%');
        }
      } catch (error) {
        console.error('❌ Error parsing WebSocket message:', error);
      }
    };

    ws.current.onclose = (event) => {
      console.log('🔌 WebSocket disconnected. Code:', event.code, 'Reason:', event.reason);
      setConnectionStatus('Disconnected');
    };

    ws.current.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      setConnectionStatus('Error');
    };

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up WebSocket connection...');
      if (ws.current) {
        ws.current.close(1000, 'Component unmounting');
      }
    };
  }, [url]);

  return { data, connectionStatus };
};

export default useWebSocketSimple;
