import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { MarketData, Tick, OHLCV, OrderBook } from '@/types/market';

interface MarketDataState {
  // Market data
  marketData: Map<string, MarketData>;
  orderBooks: Map<string, OrderBook>;
  ticks: Map<string, Tick[]>;
  ohlcvData: Map<string, OHLCV[]>;
  
  // WebSocket state
  isConnected: boolean;
  lastUpdate: number;
  subscriptions: Set<string>;
  
  // Actions
  updateMarketData: (symbol: string, data: MarketData) => void;
  updateOrderBook: (symbol: string, orderBook: OrderBook) => void;
  addTick: (tick: Tick) => void;
  addOHLCV: (ohlcv: OHLCV) => void;
  subscribe: (symbol: string) => void;
  unsubscribe: (symbol: string) => void;
  startDataFeed: () => void;
  stopDataFeed: () => void;
  getMarketData: (symbol: string) => MarketData | undefined;
  getOrderBook: (symbol: string) => OrderBook | undefined;
  getTicks: (symbol: string) => Tick[];
  getOHLCV: (symbol: string) => OHLCV[];
}

export const useMarketDataStore = create<MarketDataState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    marketData: new Map(),
    orderBooks: new Map(),
    ticks: new Map(),
    ohlcvData: new Map(),
    isConnected: false,
    lastUpdate: Date.now(),
    subscriptions: new Set(),
    
    // Actions
    updateMarketData: (symbol, data) => {
      const currentData = new Map(get().marketData);
      currentData.set(symbol, data);
      set({ 
        marketData: currentData,
        lastUpdate: Date.now()
      });
    },
    
    updateOrderBook: (symbol, orderBook) => {
      const currentBooks = new Map(get().orderBooks);
      currentBooks.set(symbol, orderBook);
      set({ 
        orderBooks: currentBooks,
        lastUpdate: Date.now()
      });
    },
    
    addTick: (tick) => {
      const currentTicks = new Map(get().ticks);
      const symbolTicks = currentTicks.get(tick.symbol) || [];
      
      // Keep only last 1000 ticks per symbol
      const updatedTicks = [...symbolTicks, tick].slice(-1000);
      currentTicks.set(tick.symbol, updatedTicks);
      
      set({ 
        ticks: currentTicks,
        lastUpdate: Date.now()
      });
    },
    
    addOHLCV: (ohlcv) => {
      const currentOHLCV = new Map(get().ohlcvData);
      const symbolData = currentOHLCV.get(ohlcv.symbol) || [];
      
      // Keep only last 500 candles per symbol
      const updatedData = [...symbolData, ohlcv].slice(-500);
      currentOHLCV.set(ohlcv.symbol, updatedData);
      
      set({ 
        ohlcvData: currentOHLCV,
        lastUpdate: Date.now()
      });
    },
    
    subscribe: (symbol) => {
      const currentSubs = new Set(get().subscriptions);
      currentSubs.add(symbol);
      set({ subscriptions: currentSubs });
    },
    
    unsubscribe: (symbol) => {
      const currentSubs = new Set(get().subscriptions);
      currentSubs.delete(symbol);
      set({ subscriptions: currentSubs });
    },
    
    startDataFeed: () => {
      set({ isConnected: true });
      console.log('Market data feed started');
    },
    
    stopDataFeed: () => {
      set({ isConnected: false });
      console.log('Market data feed stopped');
    },
    
    // Getters
    getMarketData: (symbol) => get().marketData.get(symbol),
    getOrderBook: (symbol) => get().orderBooks.get(symbol),
    getTicks: (symbol) => get().ticks.get(symbol) || [],
    getOHLCV: (symbol) => get().ohlcvData.get(symbol) || [],
  }))
);
