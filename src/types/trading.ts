export type Side = 'BUY' | 'SELL';
export type OrderType = 'MARKET' | 'LIMIT';
export type OrderStatus = 'NEW' | 'FILLED' | 'PARTIALLY_FILLED' | 'CANCELLED';

export interface Order {
  id: string;
  symbol: string;
  side: Side;
  type: OrderType;
  quantity: number;
  price?: number;
  status: OrderStatus;
  filledQuantity: number;
  timestamp: Date;
}

export interface Trade {
  id: string;
  symbol: string;
  price: number;
  quantity: number;
  side: Side;
  timestamp: Date;
}

export interface MarketData {
  symbol: string;
  bid: number;
  ask: number;
  lastPrice: number;
  volume: number;
  high: number;
  low: number;
}