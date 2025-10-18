export type OrderType = 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT' | 'ICEBERG' | 'TWAP' | 'VWAP' | 'BRACKET' | 'OCO' | 'MULTI_LEG';
export type OrderSide = 'BUY' | 'SELL';
export type OrderStatus = 'NEW' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELLED' | 'REJECTED' | 'EXPIRED' | 'PENDING_NEW' | 'REPLACED' | 'SUSPENDED';
export type TimeInForce = 'DAY' | 'GTC' | 'IOC' | 'FOK' | 'GTD' | 'ATC' | 'ATO' | 'GFS' | 'GTT';
export type AssetClass = 'EQUITY' | 'FUTURES' | 'OPTIONS' | 'FOREX' | 'INDEX';

export interface Order {
  id: string;
  clientOrderId: string;
  symbol: string;
  side: OrderSide;
  orderType: OrderType;
  quantity: number;
  price?: number;
  stopPrice?: number;
  timeInForce: TimeInForce;
  status: OrderStatus;
  filledQuantity: number;
  avgFillPrice: number;
  remainingQuantity: number;
  timestamp: number;
  lastUpdateTime: number;
  gatewayType: 'FIX' | 'OUCH';
  executionReports: ExecutionReport[];
  expireDate?: number;
  displayQuantity?: number;
  minQuantity?: number;
  pegOffset?: number;
  parentOrderId?: string;
  childOrderIds?: string[];
  contingentOrders?: ContingentOrder[];
  legs?: OrderLeg[];
}

export interface ExecutionReport {
  id: string;
  orderId: string;
  execType: 'NEW' | 'FILL' | 'PARTIAL_FILL' | 'CANCELLED' | 'REJECTED';
  execId: string;
  lastQty: number;
  lastPx: number;
  cumQty: number;
  avgPx: number;
  ordStatus: OrderStatus;
  timestamp: number;
}

export interface Trade {
  id: string;
  orderId: string;
  symbol: string;
  side: OrderSide;
  quantity: number;
  price: number;
  timestamp: number;
  tradeId: string;
  counterparty?: string;
}

export interface Position {
  symbol: string;
  quantity: number;
  averagePrice: number;
  marketValue: number;
  unrealizedPnL: number;
  realizedPnL: number;
  side: 'LONG' | 'SHORT' | 'FLAT';
  lastUpdateTime: number;
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

export interface FIXMessage {
  msgType: string;
  fields: Record<string, string>;
  rawMessage: string;
  timestamp: number;
}

export interface ContingentOrder {
  type: 'STOP_LOSS' | 'TAKE_PROFIT' | 'TRAILING_STOP';
  triggerPrice: number;
  orderType: OrderType;
  quantity: number;
  price?: number;
  offsetPercent?: number;
}

export interface OrderLeg {
  legId: string;
  symbol: string;
  side: OrderSide;
  quantity: number;
  ratio: number;
  orderType: OrderType;
  price?: number;
}

export interface BracketOrder {
  entryOrder: Partial<Order>;
  takeProfitOrder: ContingentOrder;
  stopLossOrder: ContingentOrder;
  trailingStop?: boolean;
}

export interface OCOOrder {
  primaryOrder: Partial<Order>;
  secondaryOrder: Partial<Order>;
}

export interface ProtocolGateway {
  type: 'FIX' | 'OUCH' | 'ITCH';
  status: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING';
  messagesReceived: number;
  messagesSent: number;
  lastHeartbeat?: number;
}
