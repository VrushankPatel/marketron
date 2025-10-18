import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Order, Trade, ExecutionReport, OrderType, OrderSide, TimeInForce } from '@/types/trading';
import { getLocalStorage, setLocalStorage } from '@/lib/utils';

interface OrderState {
  orders: Order[];
  trades: Trade[];
  executionReports: ExecutionReport[];
  
  // Order entry state
  pendingOrder: {
    symbol: string;
    side: OrderSide;
    orderType: OrderType;
    quantity: number;
    price?: number;
    stopPrice?: number;
    timeInForce: TimeInForce;
  } | null;
  
  // Actions
  createOrder: (orderData: Omit<Order, 'id' | 'timestamp' | 'status' | 'filledQuantity' | 'avgFillPrice' | 'remainingQuantity' | 'lastUpdateTime' | 'executionReports'>) => string;
  updateOrder: (orderId: string, updates: Partial<Order>) => void;
  cancelOrder: (orderId: string) => void;
  addTrade: (trade: Trade) => void;
  addExecutionReport: (report: ExecutionReport) => void;
  setPendingOrder: (order: OrderState['pendingOrder']) => void;
  clearPendingOrder: () => void;
  getOrder: (orderId: string) => Order | undefined;
  getOrdersBySymbol: (symbol: string) => Order[];
  getTradesBySymbol: (symbol: string) => Trade[];
  saveToStorage: () => void;
  loadFromStorage: () => void;
}

export const useOrderStore = create<OrderState>()(
  subscribeWithSelector((set, get) => ({
    orders: [],
    trades: [],
    executionReports: [],
    pendingOrder: null,
    
    createOrder: (orderData) => {
      const orderId = `ORD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = Date.now();
      
      const order: Order = {
        ...orderData,
        id: orderId,
        timestamp: now,
        status: 'NEW',
        filledQuantity: 0,
        avgFillPrice: 0,
        remainingQuantity: orderData.quantity,
        lastUpdateTime: now,
        executionReports: [],
      };
      
      set(state => ({
        orders: [...state.orders, order]
      }));
      
      get().saveToStorage();
      return orderId;
    },
    
    updateOrder: (orderId, updates) => {
      set(state => ({
        orders: state.orders.map(order =>
          order.id === orderId
            ? { ...order, ...updates, lastUpdateTime: Date.now() }
            : order
        )
      }));
      get().saveToStorage();
    },
    
    cancelOrder: (orderId) => {
      get().updateOrder(orderId, { status: 'CANCELLED' });
    },
    
    addTrade: (trade) => {
      set(state => ({
        trades: [...state.trades, trade]
      }));
      get().saveToStorage();
    },
    
    addExecutionReport: (report) => {
      set(state => ({
        executionReports: [...state.executionReports, report],
        orders: state.orders.map(order =>
          order.id === report.orderId
            ? {
                ...order,
                status: report.ordStatus,
                filledQuantity: report.cumQty,
                avgFillPrice: report.avgPx,
                remainingQuantity: order.quantity - report.cumQty,
                lastUpdateTime: report.timestamp,
                executionReports: [...order.executionReports, report]
              }
            : order
        )
      }));
      get().saveToStorage();
    },
    
    setPendingOrder: (order) => {
      set({ pendingOrder: order });
    },
    
    clearPendingOrder: () => {
      set({ pendingOrder: null });
    },
    
    getOrder: (orderId) => {
      return get().orders.find(order => order.id === orderId);
    },
    
    getOrdersBySymbol: (symbol) => {
      return get().orders.filter(order => order.symbol === symbol);
    },
    
    getTradesBySymbol: (symbol) => {
      return get().trades.filter(trade => trade.symbol === symbol);
    },
    
    saveToStorage: () => {
      const state = get();
      setLocalStorage('orders', state.orders);
      setLocalStorage('trades', state.trades);
      setLocalStorage('executionReports', state.executionReports);
    },
    
    loadFromStorage: () => {
      const orders = getLocalStorage('orders') || [];
      const trades = getLocalStorage('trades') || [];
      const executionReports = getLocalStorage('executionReports') || [];
      
      set({ orders, trades, executionReports });
    },
  }))
);
