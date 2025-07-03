import { useState, useEffect, useRef } from 'react';

const useWebSocket = (url) => {
  const [data, setData] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('Connecting');
  const ws = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const mountedRef = useRef(true);
  const isConnectingRef = useRef(false);

  useEffect(() => {
    let connectionTimeout;
    
    const connectWebSocket = () => {
      // Prevent multiple simultaneous connections
      if (isConnectingRef.current) {
        console.log('⏸️ Already connecting, skipping');
        return;
      }

      // Check if we already have an open connection
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        console.log('✅ Already connected');
        return;
      }

      // Don't connect if component is unmounted
      if (!mountedRef.current) {
        console.log('🛑 Component unmounted, skipping connection');
        return;
      }

      isConnectingRef.current = true;

      try {
        console.log('🔌 Connecting to WebSocket:', url);
        
        // Clear any existing timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }

        // Clean up existing connection
        if (ws.current) {
          ws.current.onopen = null;
          ws.current.onmessage = null;
          ws.current.onclose = null;
          ws.current.onerror = null;
          
          if (ws.current.readyState !== WebSocket.CLOSED) {
            ws.current.close(1000, 'Reconnecting');
          }
        }

        setConnectionStatus('Connecting');
        ws.current = new WebSocket(url);
        
        ws.current.onopen = () => {
          isConnectingRef.current = false;
          if (mountedRef.current) {
            console.log('✅ WebSocket connected');
            setConnectionStatus('Connected');
          }
        };

        ws.current.onmessage = (event) => {
          if (!mountedRef.current) return;
          
          try {
            const message = JSON.parse(event.data);
            
            if (message.type === 'metrics' && message.data) {
              setData(message.data);
              setConnectionStatus('Connected'); // Ensure status stays connected
            }
          } catch (error) {
            console.error('❌ Parse error:', error);
          }
        };

        ws.current.onclose = (event) => {
          isConnectingRef.current = false;
          
          if (!mountedRef.current) return;
          
          console.log('🔌 WebSocket closed. Code:', event.code);
          setConnectionStatus('Disconnected');
          
          // Only auto-reconnect for unexpected errors (not normal close)
          if (event.code !== 1000 && event.code !== 1001 && mountedRef.current) {
            console.log('🔄 Will reconnect in 10 seconds...');
            reconnectTimeoutRef.current = setTimeout(() => {
              if (mountedRef.current && !isConnectingRef.current) {
                connectWebSocket();
              }
            }, 10000); // Longer delay to prevent spam
          }
        };

        ws.current.onerror = (error) => {
          isConnectingRef.current = false;
          
          if (!mountedRef.current) return;
          
          console.error('❌ WebSocket error:', error);
          setConnectionStatus('Error');
        };
      } catch (error) {
        isConnectingRef.current = false;
        console.error('❌ Failed to create WebSocket:', error);
        setConnectionStatus('Error');
      }
    };

    // Delay initial connection to handle React StrictMode
    const initialConnectionTimer = setTimeout(() => {
      if (mountedRef.current) {
        connectWebSocket();
      }
    }, 100); // Small delay to let React settle

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up WebSocket...');
      mountedRef.current = false;
      isConnectingRef.current = false;
      
      // Clear initial connection timer
      if (initialConnectionTimer) {
        clearTimeout(initialConnectionTimer);
      }
      
      // Clear reconnection timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      // Close connection cleanly with delay to prevent race conditions
      if (ws.current) {
        const currentWs = ws.current;
        
        // Remove all event listeners
        currentWs.onopen = null;
        currentWs.onmessage = null;
        currentWs.onclose = null;
        currentWs.onerror = null;
        
        // Close connection if open or connecting
        if (currentWs.readyState === WebSocket.OPEN || currentWs.readyState === WebSocket.CONNECTING) {
          currentWs.close(1000, 'Component unmounting');
        }
        
        ws.current = null;
      }
    };
  }, []); // No dependencies to prevent reconnection loops

  return { data, connectionStatus };
};

export default useWebSocket;
