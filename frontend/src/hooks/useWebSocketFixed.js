import { useState, useEffect, useRef } from 'react';

const useWebSocket = (url) => {
  const [data, setData] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('Connecting');
  const ws = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const lastDataTime = useRef(null);
  const isReconnecting = useRef(false);

  useEffect(() => {
    const connectWebSocket = () => {
      try {
        // Clear any existing timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }

        // Close existing connection if any
        if (ws.current && ws.current.readyState !== WebSocket.CLOSED) {
          ws.current.close();
        }

        console.log('🔌 Attempting to connect to WebSocket:', url);
        setConnectionStatus('Connecting');
        ws.current = new WebSocket(url);
        
        ws.current.onopen = () => {
          console.log('✅ WebSocket connected successfully');
          setConnectionStatus('Connected');
          isReconnecting.current = false;
        };

        ws.current.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log('📨 Received message type:', message.type, 'at', new Date().toLocaleTimeString());
            
            if (message.type === 'metrics' && message.data) {
              setData(message.data);
              lastDataTime.current = Date.now();
              // Ensure we stay connected when receiving data
              if (connectionStatus !== 'Connected') {
                console.log('🔄 Setting status to Connected (received metrics)');
                setConnectionStatus('Connected');
              }
            } else if (message.type === 'history') {
              // History data received, connection is working
              lastDataTime.current = Date.now();
              if (connectionStatus !== 'Connected') {
                console.log('🔄 Setting status to Connected (received history)');
                setConnectionStatus('Connected');
              }
            }
          } catch (error) {
            console.error('❌ Error parsing WebSocket message:', error);
          }
        };

        ws.current.onclose = (event) => {
          console.log('🔌 WebSocket disconnected. Code:', event.code, 'Reason:', event.reason || 'None');
          
          // If we were connected and receiving data recently, try to reconnect
          const timeSinceLastData = lastDataTime.current ? (Date.now() - lastDataTime.current) / 1000 : null;
          const shouldReconnect = (
            event.code !== 1000 && // Not a normal close
            !isReconnecting.current && // Not already reconnecting
            (!timeSinceLastData || timeSinceLastData < 30) // Recent data activity
          );

          if (shouldReconnect) {
            console.log('🔄 Scheduling reconnect in 3 seconds...');
            setConnectionStatus('Connecting');
            isReconnecting.current = true;
            reconnectTimeoutRef.current = setTimeout(() => {
              connectWebSocket();
            }, 3000);
          } else {
            setConnectionStatus('Disconnected');
          }
        };

        ws.current.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          setConnectionStatus('Error');
          
          // Retry connection after error
          if (!isReconnecting.current) {
            isReconnecting.current = true;
            reconnectTimeoutRef.current = setTimeout(() => {
              connectWebSocket();
            }, 5000);
          }
        };
      } catch (error) {
        console.error('❌ Failed to create WebSocket connection:', error);
        setConnectionStatus('Error');
      }
    };

    connectWebSocket();

    // Heartbeat check - if we haven't received data in a while, try to reconnect
    const heartbeatInterval = setInterval(() => {
      const timeSinceLastData = lastDataTime.current ? (Date.now() - lastDataTime.current) / 1000 : null;
      
      // If we're marked as connected but haven't received data in 15 seconds, something's wrong
      if (connectionStatus === 'Connected' && timeSinceLastData && timeSinceLastData > 15) {
        console.log('⚠️ Heartbeat failed - no data for', timeSinceLastData.toFixed(1), 'seconds');
        setConnectionStatus('Disconnected');
        if (!isReconnecting.current) {
          isReconnecting.current = true;
          connectWebSocket();
        }
      }
    }, 10000); // Check every 10 seconds

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up WebSocket connection...');
      
      // Clear reconnection timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      // Clear heartbeat interval
      clearInterval(heartbeatInterval);
      
      // Close WebSocket connection
      if (ws.current) {
        ws.current.onclose = null; // Prevent reconnection
        ws.current.close(1000, 'Component unmounting');
        ws.current = null;
      }
    };
  }, [url, connectionStatus]); // Include connectionStatus in deps to properly handle state changes

  return { data, connectionStatus };
};

export default useWebSocket;
