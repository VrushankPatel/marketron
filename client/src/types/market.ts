export interface Instrument {
  symbol: string;
  name: string;
  assetClass: 'EQUITY' | 'FUTURES' | 'OPTIONS' | 'FOREX' | 'INDEX';
  sector?: string;
  exchange: string;
  currency: string;
  lotSize: number;
  tickSize: number;
  isin?: string;
  multiplier: number;
  expirationDate?: string;
  underlyingSymbol?: string;
  strikePrice?: number;
  optionType?: 'CALL' | 'PUT';
  marginRequirement?: number;
  tradingHours: {
    open: string;
    close: string;
    timezone: string;
  };
}

export interface MarketData {
  symbol: string;
  price: number;
  bid: number;
  ask: number;
  bidSize: number;
  askSize: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  vwap: number;
  change: number;
  changePercent: number;
  timestamp: number;
}

export interface Tick {
  symbol: string;
  price: number;
  size: number;
  timestamp: number;
  side?: 'BUY' | 'SELL';
}

export interface OHLCV {
  symbol: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: number;
  vwap: number;
}

export interface GreekData {
  symbol: string;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
  impliedVolatility: number;
  timestamp: number;
}

export interface MarketStats {
  symbol: string;
  totalVolume: number;
  totalValue: number;
  totalTrades: number;
  vwap: number;
  participation: number;
  timestamp: number;
}

export interface OrderBookLevel {
  price: number;
  quantity: number;
  orderCount: number;
}

export interface OrderBook {
  symbol: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  timestamp: number;
}
