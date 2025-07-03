import { useState, useEffect, useRef } from 'react';

const useWebSocket = (url) => {
  const [data, setData] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('Connecting');
  const ws = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const connect = () => {
      if (!isMounted) return;
      
      console.log('🔌 Connecting to WebSocket:', url);
      setConnectionStatus('Connecting');
      
      try {
        ws.current = new WebSocket(url);
        
        ws.current.onopen = () => {
          if (isMounted) {
            console.log('✅ WebSocket connected');
            setConnectionStatus('Connected');
          }
        };

        ws.current.onmessage = (event) => {
          if (!isMounted) return;
          
          try {
            const message = JSON.parse(event.data);
            if (message.type === 'metrics' && message.data) {
              setData(message.data);
              setConnectionStatus('Connected');
            }
          } catch (error) {
            console.error('❌ Parse error:', error);
          }
        };

        ws.current.onclose = (event) => {
          if (!isMounted) return;
          
          console.log('🔌 WebSocket closed. Code:', event.code);
          setConnectionStatus('Disconnected');
          
          // Reconnect after delay for unexpected closures
          if (event.code !== 1000 && isMounted) {
            setTimeout(() => {
              if (isMounted) connect();
            }, 3000);
          }
        };

        ws.current.onerror = (error) => {
          if (!isMounted) return;
          
          console.error('❌ WebSocket error:', error);
          setConnectionStatus('Error');
        };
      } catch (error) {
        console.error('❌ Failed to create WebSocket:', error);
        setConnectionStatus('Error');
      }
    };

    // Start connection
    connect();

    return () => {
      isMounted = false;
      if (ws.current) {
        ws.current.close(1000, 'Component unmounting');
        ws.current = null;
      }
    };
  }, [url]);

  return { data, connectionStatus };
};

export default useWebSocket;
