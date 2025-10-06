import { useState, useEffect, useRef } from 'react';

const useWebSocket = (url) => {
  const [data, setData] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('Connecting');
  const ws = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const mountedRef = useRef(true);
  const lastDataTime = useRef(null);

  // Monitor connection health
  useEffect(() => {
    const healthCheck = setInterval(() => {
      if (!mountedRef.current) return;
      
      const now = Date.now();
      const timeSinceLastData = lastDataTime.current ? (now - lastDataTime.current) / 1000 : null;
      
      // If we haven't received data in 10 seconds but are marked as connected, something's wrong
      if (connectionStatus === 'Connected' && timeSinceLastData && timeSinceLastData > 10) {
        console.log('⚠️ No data received for', timeSinceLastData.toFixed(1), 'seconds - connection may be stale');
        setConnectionStatus('Disconnected');
      }
      
      // Log current status every 30 seconds for debugging
      if (Math.floor(now / 30000) !== Math.floor((now - 5000) / 30000)) {
        console.log('📊 Connection Health:', {
          status: connectionStatus,
          lastData: timeSinceLastData ? timeSinceLastData.toFixed(1) + 's ago' : 'never',
          wsReadyState: ws.current?.readyState,
          timestamp: new Date().toLocaleTimeString()
        });
      }
    }, 5000);
    
    return () => clearInterval(healthCheck);
  }, [connectionStatus]);

  useEffect(() => {
    let isConnecting = false;

    const connectWebSocket = () => {
      if (isConnecting || !mountedRef.current) return;
      
      isConnecting = true;
      
      try {
        console.log('🔌 Attempting WebSocket connection to:', url);
        
        // Clear any existing timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }

        // Close existing connection if any
        if (ws.current && ws.current.readyState !== WebSocket.CLOSED) {
          ws.current.close();
        }

        setConnectionStatus('Connecting');
        ws.current = new WebSocket(url);
        
        ws.current.onopen = () => {
          if (mountedRef.current) {
            console.log('✅ WebSocket connected successfully');
            setConnectionStatus('Connected');
            isConnecting = false;
          }
        };

        ws.current.onmessage = (event) => {
          if (!mountedRef.current) return;
          
          try {
            const message = JSON.parse(event.data);
            console.log('📨 Received message type:', message.type, 'at', new Date().toLocaleTimeString());
            
            if (message.type === 'metrics' && message.data) {
              setData(message.data);
              lastDataTime.current = Date.now();
              // Force Connected status when receiving fresh data
              if (connectionStatus !== 'Connected') {
                console.log('🔄 Setting connection status to Connected');
                setConnectionStatus('Connected');
              }
              console.log('📊 Updated metrics data - CPU:', message.data.cpu + '%');
            } else if (message.type === 'history') {
              // We received historical data, connection is working
              lastDataTime.current = Date.now();
              if (connectionStatus !== 'Connected') {
                console.log('🔄 Setting connection status to Connected (history data)');
                setConnectionStatus('Connected');
              }
            }
          } catch (error) {
            console.error('❌ Error parsing WebSocket message:', error);
          }
        };

        ws.current.onclose = (event) => {
          isConnecting = false;
          
          if (!mountedRef.current) return;
          
          console.log('🔌 WebSocket disconnected. Code:', event.code, 'Reason:', event.reason);
          setConnectionStatus('Disconnected');
          
          // Only reconnect if the close was unexpected (not manual cleanup)
          if (event.code !== 1000 && mountedRef.current) {
            console.log('🔄 Scheduling reconnect in 3 seconds...');
            reconnectTimeoutRef.current = setTimeout(() => {
              connectWebSocket();
            }, 3000);
          }
        };

        ws.current.onerror = (error) => {
          isConnecting = false;
          
          if (!mountedRef.current) return;
          
          console.error('❌ WebSocket error:', error);
          setConnectionStatus('Error');
          
          // Retry connection after error
          if (mountedRef.current) {
            reconnectTimeoutRef.current = setTimeout(() => {
              connectWebSocket();
            }, 5000);
          }
        };
      } catch (error) {
        isConnecting = false;
        console.error('❌ Failed to create WebSocket connection:', error);
        
        if (mountedRef.current) {
          setConnectionStatus('Error');
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, 5000);
        }
      }
    };

    connectWebSocket();

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up WebSocket connection...');
      mountedRef.current = false;
      
      // Clear reconnection timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      // Close WebSocket connection
      if (ws.current) {
        ws.current.onclose = null; // Prevent reconnection
        ws.current.close(1000, 'Component unmounting');
        ws.current = null;
      }
    };
  }, [url]); // Only reconnect if URL changes

  return { data, connectionStatus };
};

export default useWebSocket;
