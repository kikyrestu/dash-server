import { useState, useEffect, useRef } from 'react';

const useWebSocket = (url) => {
  const [data, setData] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('Connecting');
  const ws = useRef(null);
  const reconnectTimeoutRef = useRef(null);

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

        console.log('Attempting to connect to WebSocket:', url);
        ws.current = new WebSocket(url);
        
        ws.current.onopen = () => {
          console.log('WebSocket connected successfully');
          setConnectionStatus('Connected');
        };

        ws.current.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log('Received message type:', message.type);
            
            if (message.type === 'metrics') {
              setData(message.data);
              // Ensure we stay connected when receiving data
              if (connectionStatus !== 'Connected') {
                setConnectionStatus('Connected');
              }
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        ws.current.onclose = (event) => {
          console.log('WebSocket disconnected. Code:', event.code, 'Reason:', event.reason);
          setConnectionStatus('Disconnected');
          
          // Only reconnect if the close was unexpected (not manual)
          if (event.code !== 1000) {
            console.log('Scheduling reconnect in 3 seconds...');
            reconnectTimeoutRef.current = setTimeout(() => {
              if (ws.current?.readyState === WebSocket.CLOSED) {
                connectWebSocket();
              }
            }, 3000);
          }
        };

        ws.current.onerror = (error) => {
          console.error('WebSocket error:', error);
          setConnectionStatus('Error');
        };
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        setConnectionStatus('Error');
        
        // Retry connection after delay
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 3000);
      }
    };

    connectWebSocket();

    // Cleanup function
    return () => {
      console.log('Cleaning up WebSocket connection...');
      
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

export default useWebSocket;
