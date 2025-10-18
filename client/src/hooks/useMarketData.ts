import { useEffect, useState } from 'react';
import { useMarketDataStore } from '@/stores/useMarketDataStore';
import { MarketData, OrderBook, Tick } from '@/types/market';

export const useMarketData = (symbol?: string) => {
  const {
    marketData,
    orderBooks,
    ticks,
    isConnected,
    subscribe,
    unsubscribe,
    getMarketData,
    getOrderBook,
    getTicks,
  } = useMarketDataStore();

  const [isSubscribed, setIsSubscribed] = useState(false);

  // Subscribe to symbol updates
  useEffect(() => {
    if (symbol && !isSubscribed) {
      subscribe(symbol);
      setIsSubscribed(true);
      console.log(`Subscribed to market data for ${symbol}`);
    }

    return () => {
      if (symbol && isSubscribed) {
        unsubscribe(symbol);
        setIsSubscribed(false);
        console.log(`Unsubscribed from market data for ${symbol}`);
      }
    };
  }, [symbol, isSubscribed, subscribe, unsubscribe]);

  // Get current market data for symbol
  const currentMarketData = symbol ? getMarketData(symbol) : undefined;
  const currentOrderBook = symbol ? getOrderBook(symbol) : undefined;
  const currentTicks = symbol ? getTicks(symbol) : [];

  return {
    marketData: currentMarketData,
    orderBook: currentOrderBook,
    ticks: currentTicks,
    allMarketData: marketData,
    allOrderBooks: orderBooks,
    isConnected,
    isSubscribed,
  };
};

export const useMarketDataList = (symbols: string[]) => {
  const { getMarketData, subscribe, unsubscribe } = useMarketDataStore();

  useEffect(() => {
    // Subscribe to all symbols
    symbols.forEach(symbol => {
      subscribe(symbol);
    });

    // Cleanup: unsubscribe from all symbols
    return () => {
      symbols.forEach(symbol => {
        unsubscribe(symbol);
      });
    };
  }, [symbols.join(','), subscribe, unsubscribe]);

  // Get market data for all symbols
  const marketDataList = symbols.map(symbol => ({
    symbol,
    data: getMarketData(symbol),
  })).filter(item => item.data !== undefined);

  return marketDataList;
};

export const useRealtimePrice = (symbol: string) => {
  const { getMarketData } = useMarketDataStore();
  const [price, setPrice] = useState<number>(0);
  const [previousPrice, setPreviousPrice] = useState<number>(0);

  useEffect(() => {
    const updatePrice = () => {
      const marketData = getMarketData(symbol);
      if (marketData) {
        setPreviousPrice(price);
        setPrice(marketData.price);
      }
    };

    // Update immediately
    updatePrice();

    // Set up interval for real-time updates
    const interval = setInterval(updatePrice, 100);

    return () => clearInterval(interval);
  }, [symbol, getMarketData, price]);

  const priceChange = price - previousPrice;
  const priceDirection = priceChange > 0 ? 'up' : priceChange < 0 ? 'down' : 'neutral';

  return {
    price,
    previousPrice,
    priceChange,
    priceDirection,
  };
};
