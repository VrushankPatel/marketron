import { useEffect, useRef, useCallback } from 'react';

interface WebSocketOptions {
  url: string;
  onMessage?: (data: any) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  reconnectAttempts?: number;
  reconnectInterval?: number;
}

export const useWebSocket = (options: WebSocketOptions) => {
  const {
    url,
    onMessage,
    onOpen,
    onClose,
    onError,
    reconnectAttempts = 3,
    reconnectInterval = 1000,
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectCountRef = useRef(0);

  const connect = useCallback(() => {
    try {
      // For demo purposes, we'll simulate WebSocket behavior
      // In a real implementation, this would be: new WebSocket(url)
      console.log(`Simulating WebSocket connection to ${url}`);
      
      // Simulate connection success
      setTimeout(() => {
        console.log('WebSocket connection established (simulated)');
        onOpen?.();
        reconnectCountRef.current = 0;
      }, 100);

      // Simulate periodic messages
      const messageInterval = setInterval(() => {
        if (onMessage) {
          // Simulate market data messages
          const mockMessage = {
            type: 'market_data',
            symbol: 'AAPL',
            price: 175.25 + (Math.random() - 0.5) * 2,
            timestamp: Date.now(),
          };
          onMessage(mockMessage);
        }
      }, 1000);

      // Store cleanup function
      wsRef.current = {
        close: () => {
          clearInterval(messageInterval);
          onClose?.();
        },
        send: (data: string) => {
          console.log('Sending WebSocket message (simulated):', data);
        },
        readyState: WebSocket.OPEN,
      } as any;

    } catch (error) {
      console.error('WebSocket connection failed:', error);
      onError?.(error as Event);
      
      if (reconnectCountRef.current < reconnectAttempts) {
        reconnectCountRef.current++;
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, reconnectInterval * reconnectCountRef.current);
      }
    }
  }, [url, onMessage, onOpen, onClose, onError, reconnectAttempts, reconnectInterval]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const sendMessage = useCallback((data: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket is not connected');
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    sendMessage,
    disconnect,
    reconnect: connect,
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
  };
};
