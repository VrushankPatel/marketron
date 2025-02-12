import { Order, Trade, Side } from '../types/trading';
import { create } from 'zustand';

interface MatchingEngineStore {
  orders: Order[];
  trades: Trade[];
  addOrder: (order: Order) => void;
  cancelOrder: (orderId: string) => void;
  getOrders: () => Order[];
  getTrades: () => Trade[];
  setState: (state: Partial<MatchingEngineStore>) => void;
}

export const useMatchingEngine = create<MatchingEngineStore>((set, get) => ({
  orders: [],
  trades: [],
  
  addOrder: (order: Order) => {
    set((state) => {
      const newOrders = [...state.orders, order];
      const { matchedOrders, trades } = matchOrders(newOrders);
      return {
        orders: matchedOrders,
        trades: [...state.trades, ...trades]
      };
    });
  },

  cancelOrder: (orderId: string) => {
    set((state) => ({
      orders: state.orders.map(order =>
        order.id === orderId
          ? { ...order, status: 'CANCELLED' }
          : order
      )
    }));
  },

  getOrders: () => get().orders,
  getTrades: () => get().trades,
  setState: (newState) => set(newState),
}));

function matchOrders(orders: Order[]): { matchedOrders: Order[], trades: Trade[] } {
  const newTrades: Trade[] = [];
  const ordersCopy = [...orders];

  // Sort orders by timestamp
  const activeOrders = ordersCopy
    .filter(order => order.status !== 'FILLED' && order.status !== 'CANCELLED')
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  for (let i = 0; i < activeOrders.length; i++) {
    const order = activeOrders[i];
    if (order.status === 'FILLED' || order.status === 'CANCELLED') continue;

    for (let j = i + 1; j < activeOrders.length; j++) {
      const matchOrder = activeOrders[j];
      if (matchOrder.status === 'FILLED' || matchOrder.status === 'CANCELLED') continue;

      if (canMatch(order, matchOrder)) {
        const trade = executeTrade(order, matchOrder);
        if (trade) {
          newTrades.push(trade);
        }
      }
    }
  }

  return {
    matchedOrders: ordersCopy,
    trades: newTrades
  };
}

function canMatch(order1: Order, order2: Order): boolean {
  if (order1.symbol !== order2.symbol) return false;
  if (order1.side === order2.side) return false;

  const [buyOrder, sellOrder] = order1.side === 'BUY'
    ? [order1, order2]
    : [order2, order1];

  if (buyOrder.type === 'MARKET' || sellOrder.type === 'MARKET') return true;

  return (buyOrder.price || 0) >= (sellOrder.price || 0);
}

function executeTrade(order1: Order, order2: Order): Trade | null {
  const [buyOrder, sellOrder] = order1.side === 'BUY'
    ? [order1, order2]
    : [order2, order1];

  const remainingBuyQty = buyOrder.quantity - buyOrder.filledQuantity;
  const remainingSellQty = sellOrder.quantity - sellOrder.filledQuantity;
  const tradeQty = Math.min(remainingBuyQty, remainingSellQty);

  if (tradeQty <= 0) return null;

  const tradePrice = sellOrder.type === 'MARKET' ? buyOrder.price : sellOrder.price;
  if (!tradePrice && sellOrder.type !== 'MARKET') return null;

  buyOrder.filledQuantity += tradeQty;
  sellOrder.filledQuantity += tradeQty;

  buyOrder.status = buyOrder.filledQuantity === buyOrder.quantity ? 'FILLED' : 'PARTIALLY_FILLED';
  sellOrder.status = sellOrder.filledQuantity === sellOrder.quantity ? 'FILLED' : 'PARTIALLY_FILLED';

  return {
    id: Math.random().toString(36).substr(2, 9),
    symbol: buyOrder.symbol,
    price: tradePrice || 0,
    quantity: tradeQty,
    side: 'BUY',
    timestamp: new Date(),
  };
}

// Export a singleton instance for backward compatibility
export const matchingEngine = {
  addOrder: useMatchingEngine.getState().addOrder,
  cancelOrder: useMatchingEngine.getState().cancelOrder,
  getOrders: useMatchingEngine.getState().getOrders,
  getTrades: useMatchingEngine.getState().getTrades,
};