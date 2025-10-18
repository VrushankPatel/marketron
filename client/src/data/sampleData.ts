import { MarketData, OrderBook, OrderBookLevel } from '@/types/market';
import { instruments } from './instruments';

// Base price configurations for different instruments
const basePriceMap: Record<string, number> = {
  'AAPL': 175.25,
  'GOOGL': 2750.80,
  'MSFT': 412.50,
  'TSLA': 248.75,
  'NVDA': 875.30,
  'JPM': 185.40,
  'BAC': 34.25,
  'WFC': 52.80,
  'GS': 456.30,
  'MS': 98.75,
  'JNJ': 158.20,
  'PFE': 28.45,
  'XOM': 112.60,
  'CVX': 158.90,
  'ESM4': 5025.50,
  'NQM4': 18350.75,
  'AAPL240621C00180000': 8.50,
  'AAPL240621P00180000': 6.25,
  'EURUSD': 1.0875,
  'GBPUSD': 1.2650,
  'USDJPY': 149.25,
  'USDCHF': 0.8745,
  'AUDUSD': 0.6580,
  'SPX': 5025.50,
  'NDX': 18350.75,
  'DJI': 38250.25
};

// Generate market data for a symbol
const generateMarketDataForSymbol = (symbol: string, basePrice: number): MarketData => {
  const spread = basePrice * 0.0001; // 0.01% spread
  const bid = basePrice - spread / 2;
  const ask = basePrice + spread / 2;
  const open = basePrice * (0.98 + Math.random() * 0.04); // -2% to +2%
  const high = basePrice * (1 + Math.random() * 0.02); // +0% to +2%
  const low = basePrice * (1 - Math.random() * 0.02); // -2% to 0%
  const volume = Math.floor(Math.random() * 2000000) + 500000;
  const change = basePrice - open;
  const changePercent = (change / open) * 100;
  
  return {
    symbol,
    price: Math.round(basePrice * 100) / 100,
    bid: Math.round(bid * 100) / 100,
    ask: Math.round(ask * 100) / 100,
    bidSize: Math.floor(Math.random() * 500) + 100,
    askSize: Math.floor(Math.random() * 500) + 100,
    open: Math.round(open * 100) / 100,
    high: Math.round(high * 100) / 100,
    low: Math.round(low * 100) / 100,
    close: Math.round(basePrice * 100) / 100,
    volume,
    vwap: Math.round((basePrice + open) / 2 * 100) / 100,
    change: Math.round(change * 100) / 100,
    changePercent: Math.round(changePercent * 100) / 100,
    timestamp: Date.now()
  };
};

// Generate order book levels
const generateOrderBookLevels = (basePrice: number, isAsk: boolean = false): OrderBookLevel[] => {
  const levels: OrderBookLevel[] = [];
  const increment = basePrice * 0.001; // 0.1% increments
  
  for (let i = 0; i < 10; i++) {
    const price = isAsk 
      ? basePrice + (increment * (i + 1))
      : basePrice - (increment * (i + 1));
    
    levels.push({
      price: Math.round(price * 100) / 100,
      quantity: Math.floor(Math.random() * 1000) + 100,
      orderCount: Math.floor(Math.random() * 10) + 1
    });
  }
  
  return levels;
};

// Generate order book for a symbol
const generateOrderBookForSymbol = (symbol: string, bid: number, ask: number): OrderBook => {
  return {
    symbol,
    bids: generateOrderBookLevels(bid),
    asks: generateOrderBookLevels(ask, true),
    timestamp: Date.now()
  };
};

// Automatically generate initial market data for all instruments
export const initialMarketData: Record<string, MarketData> = {};
export const initialOrderBooks: Record<string, OrderBook> = {};

instruments.forEach(instrument => {
  const basePrice = basePriceMap[instrument.symbol] || 100;
  const marketData = generateMarketDataForSymbol(instrument.symbol, basePrice);
  const orderBook = generateOrderBookForSymbol(instrument.symbol, marketData.bid, marketData.ask);
  
  initialMarketData[instrument.symbol] = marketData;
  initialOrderBooks[instrument.symbol] = orderBook;
});

// Price multipliers for different volatility levels
export const volatilityProfiles = {
  low: 0.0001,    // 0.01%
  medium: 0.0005, // 0.05%
  high: 0.001,    // 0.1%
  extreme: 0.002  // 0.2%
};

// Symbol-specific volatility settings
export const symbolVolatility: Record<string, keyof typeof volatilityProfiles> = {
  'AAPL': 'medium',
  'GOOGL': 'medium',
  'MSFT': 'low',
  'TSLA': 'high',
  'NVDA': 'high',
  'JPM': 'medium',
  'BAC': 'medium',
  'WFC': 'medium',
  'GS': 'medium',
  'MS': 'medium',
  'JNJ': 'low',
  'PFE': 'medium',
  'XOM': 'low',
  'CVX': 'low',
  'SPX': 'low',
  'NDX': 'medium',
  'DJI': 'low',
  'EURUSD': 'low',
  'GBPUSD': 'low',
  'USDJPY': 'low',
  'USDCHF': 'low',
  'AUDUSD': 'low',
  'ESM4': 'medium',
  'NQM4': 'medium',
  'AAPL240621C00180000': 'high',
  'AAPL240621P00180000': 'high'
};
