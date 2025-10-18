import { Order, OrderBookLevel } from '@/types/trading';

interface MatchResult {
  trades: Array<{
    buyOrderId: string;
    sellOrderId: string;
    price: number;
    quantity: number;
    timestamp: number;
  }>;
  updatedOrders: Order[];
}

export class MatchingEngine {
  private buyOrders: Map<string, Order[]> = new Map(); // symbol -> orders
  private sellOrders: Map<string, Order[]> = new Map(); // symbol -> orders

  constructor() {
    console.log('MatchingEngine initialized');
  }

  addOrder(order: Order): MatchResult {
    const symbol = order.symbol;
    
    if (order.side === 'BUY') {
      const orders = this.buyOrders.get(symbol) || [];
      orders.push(order);
      // Sort by price (highest first), then by time (earliest first)
      orders.sort((a, b) => {
        if (a.price !== b.price) {
          return (b.price || 0) - (a.price || 0);
        }
        return a.timestamp - b.timestamp;
      });
      this.buyOrders.set(symbol, orders);
    } else {
      const orders = this.sellOrders.get(symbol) || [];
      orders.push(order);
      // Sort by price (lowest first), then by time (earliest first)
      orders.sort((a, b) => {
        if (a.price !== b.price) {
          return (a.price || 0) - (b.price || 0);
        }
        return a.timestamp - b.timestamp;
      });
      this.sellOrders.set(symbol, orders);
    }
    
    return this.matchOrders(symbol);
  }

  private matchOrders(symbol: string): MatchResult {
    const buyOrders = this.buyOrders.get(symbol) || [];
    const sellOrders = this.sellOrders.get(symbol) || [];
    
    const trades: MatchResult['trades'] = [];
    const updatedOrders: Order[] = [];
    
    let buyIndex = 0;
    let sellIndex = 0;
    
    while (buyIndex < buyOrders.length && sellIndex < sellOrders.length) {
      const buyOrder = buyOrders[buyIndex];
      const sellOrder = sellOrders[sellIndex];
      
      // Check if orders can match
      if (!this.canMatch(buyOrder, sellOrder)) {
        break;
      }
      
      // Determine trade price (price-time priority)
      const tradePrice = this.determineTradePrice(buyOrder, sellOrder);
      
      // Determine trade quantity
      const buyRemaining = buyOrder.quantity - buyOrder.filledQuantity;
      const sellRemaining = sellOrder.quantity - sellOrder.filledQuantity;
      const tradeQuantity = Math.min(buyRemaining, sellRemaining);
      
      // Create trade
      trades.push({
        buyOrderId: buyOrder.id,
        sellOrderId: sellOrder.id,
        price: tradePrice,
        quantity: tradeQuantity,
        timestamp: Date.now(),
      });
      
      // Update orders
      buyOrder.filledQuantity += tradeQuantity;
      sellOrder.filledQuantity += tradeQuantity;
      
      // Calculate average fill prices
      buyOrder.avgFillPrice = this.calculateAvgPrice(buyOrder, tradeQuantity, tradePrice);
      sellOrder.avgFillPrice = this.calculateAvgPrice(sellOrder, tradeQuantity, tradePrice);
      
      // Update order status
      if (buyOrder.filledQuantity === buyOrder.quantity) {
        buyOrder.status = 'FILLED';
        buyIndex++;
      }
      
      if (sellOrder.filledQuantity === sellOrder.quantity) {
        sellOrder.status = 'FILLED';
        sellIndex++;
      }
      
      updatedOrders.push(buyOrder, sellOrder);
    }
    
    // Remove filled orders from order book
    if (buyIndex > 0) {
      this.buyOrders.set(symbol, buyOrders.slice(buyIndex));
    }
    if (sellIndex > 0) {
      this.sellOrders.set(symbol, sellOrders.slice(sellIndex));
    }
    
    return { trades, updatedOrders };
  }

  private canMatch(buyOrder: Order, sellOrder: Order): boolean {
    // Only match limit orders for now
    if (buyOrder.orderType !== 'LIMIT' || sellOrder.orderType !== 'LIMIT') {
      return false;
    }
    
    if (!buyOrder.price || !sellOrder.price) {
      return false;
    }
    
    // Buy price must be >= sell price
    return buyOrder.price >= sellOrder.price;
  }

  private determineTradePrice(buyOrder: Order, sellOrder: Order): number {
    // Price-time priority: earlier order gets their price
    if (buyOrder.timestamp < sellOrder.timestamp) {
      return buyOrder.price || 0;
    } else {
      return sellOrder.price || 0;
    }
  }

  private calculateAvgPrice(order: Order, newQuantity: number, newPrice: number): number {
    const previousValue = order.avgFillPrice * (order.filledQuantity - newQuantity);
    const newValue = newPrice * newQuantity;
    return (previousValue + newValue) / order.filledQuantity;
  }

  getOrderBook(symbol: string): { bids: OrderBookLevel[]; asks: OrderBookLevel[] } {
    const buyOrders = this.buyOrders.get(symbol) || [];
    const sellOrders = this.sellOrders.get(symbol) || [];
    
    // Aggregate orders by price level
    const bidLevels = this.aggregateOrdersByPrice(buyOrders);
    const askLevels = this.aggregateOrdersByPrice(sellOrders);
    
    return {
      bids: bidLevels,
      asks: askLevels,
    };
  }

  private aggregateOrdersByPrice(orders: Order[]): OrderBookLevel[] {
    const priceMap = new Map<number, { quantity: number; orderCount: number }>();
    
    orders.forEach(order => {
      if (!order.price || order.status === 'FILLED' || order.status === 'CANCELLED') return;
      
      const remainingQuantity = order.quantity - order.filledQuantity;
      const existing = priceMap.get(order.price) || { quantity: 0, orderCount: 0 };
      
      priceMap.set(order.price, {
        quantity: existing.quantity + remainingQuantity,
        orderCount: existing.orderCount + 1,
      });
    });
    
    return Array.from(priceMap.entries()).map(([price, data]) => ({
      price,
      quantity: data.quantity,
      orderCount: data.orderCount,
    }));
  }

  cancelOrder(orderId: string, symbol: string): boolean {
    const buyOrders = this.buyOrders.get(symbol) || [];
    const sellOrders = this.sellOrders.get(symbol) || [];
    
    // Find and remove from buy orders
    const buyIndex = buyOrders.findIndex(order => order.id === orderId);
    if (buyIndex !== -1) {
      buyOrders.splice(buyIndex, 1);
      this.buyOrders.set(symbol, buyOrders);
      return true;
    }
    
    // Find and remove from sell orders
    const sellIndex = sellOrders.findIndex(order => order.id === orderId);
    if (sellIndex !== -1) {
      sellOrders.splice(sellIndex, 1);
      this.sellOrders.set(symbol, sellOrders);
      return true;
    }
    
    return false;
  }

  getOrderCount(symbol: string): { buyCount: number; sellCount: number } {
    const buyOrders = this.buyOrders.get(symbol) || [];
    const sellOrders = this.sellOrders.get(symbol) || [];
    
    return {
      buyCount: buyOrders.length,
      sellCount: sellOrders.length,
    };
  }

  getTotalVolume(symbol: string): { buyVolume: number; sellVolume: number } {
    const buyOrders = this.buyOrders.get(symbol) || [];
    const sellOrders = this.sellOrders.get(symbol) || [];
    
    const buyVolume = buyOrders.reduce((sum, order) => 
      sum + (order.quantity - order.filledQuantity), 0
    );
    
    const sellVolume = sellOrders.reduce((sum, order) => 
      sum + (order.quantity - order.filledQuantity), 0
    );
    
    return { buyVolume, sellVolume };
  }
}
