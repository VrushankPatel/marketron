import { Order, Trade, ExecutionReport, OrderType, OrderSide, OrderStatus } from '@/types/trading';
import { useOrderStore } from '@/stores/useOrderStore';
import { useMarketDataStore } from '@/stores/useMarketDataStore';
import { usePositionStore } from '@/stores/usePositionStore';
import { useTutorialStore } from '@/stores/useTutorialStore';
import { MatchingEngine } from './MatchingEngine';

export class OrderService {
  private matchingEngine: MatchingEngine;
  private orderSequence: number = 1;

  constructor() {
    this.matchingEngine = new MatchingEngine();
  }

  initialize(): void {
    // Load existing orders from storage
    const { loadFromStorage } = useOrderStore.getState();
    loadFromStorage();
    
    console.log('OrderService initialized');
  }

  async submitOrder(orderData: {
    symbol: string;
    side: OrderSide;
    orderType: OrderType;
    quantity: number;
    price?: number;
    stopPrice?: number;
    timeInForce: 'DAY' | 'GTC' | 'IOC' | 'FOK' | 'GTD';
    gatewayType?: 'FIX' | 'OUCH';
  }): Promise<string> {
    const { createOrder, addExecutionReport } = useOrderStore.getState();
    
    // Generate client order ID
    const clientOrderId = `CLT_${Date.now()}_${this.orderSequence++}`;
    
    // Create order
    const orderId = createOrder({
      clientOrderId,
      symbol: orderData.symbol,
      side: orderData.side,
      orderType: orderData.orderType,
      quantity: orderData.quantity,
      price: orderData.price,
      stopPrice: orderData.stopPrice,
      timeInForce: orderData.timeInForce,
      gatewayType: orderData.gatewayType || 'FIX',
    });
    
    // Create initial execution report (NEW)
    const newExecutionReport: ExecutionReport = {
      id: `EXEC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      orderId,
      execType: 'NEW',
      execId: `EXEC_${orderId}`,
      lastQty: 0,
      lastPx: 0,
      cumQty: 0,
      avgPx: 0,
      ordStatus: 'NEW',
      timestamp: Date.now(),
    };
    
    addExecutionReport(newExecutionReport);
    
    // Track order for tutorial achievements
    const tutorialStore = useTutorialStore.getState();
    tutorialStore.incrementOrdersPlaced();
    tutorialStore.addInstrumentTraded(orderData.symbol);
    
    // Process order through matching engine
    setTimeout(() => {
      this.processOrder(orderId);
    }, Math.random() * 100 + 50); // Simulate network latency
    
    console.log(`Order submitted: ${orderId}`);
    return orderId;
  }

  private async processOrder(orderId: string): Promise<void> {
    const { getOrder, addExecutionReport, addTrade } = useOrderStore.getState();
    const { getMarketData } = useMarketDataStore.getState();
    const { updatePosition } = usePositionStore.getState();
    
    const order = getOrder(orderId);
    if (!order || order.status !== 'NEW') return;
    
    const marketData = getMarketData(order.symbol);
    if (!marketData) {
      this.rejectOrder(orderId, 'No market data available');
      return;
    }
    
    // Basic order validation
    if (!this.validateOrder(order)) {
      this.rejectOrder(orderId, 'Order validation failed');
      return;
    }
    
    // Process different order types
    switch (order.orderType) {
      case 'MARKET':
        this.processMarketOrder(order, marketData.price);
        break;
      case 'LIMIT':
        this.processLimitOrder(order, marketData);
        break;
      case 'STOP':
        this.processStopOrder(order, marketData);
        break;
      case 'STOP_LIMIT':
        this.processStopLimitOrder(order, marketData);
        break;
      default:
        console.log(`Order type ${order.orderType} not fully implemented`);
        break;
    }
  }

  private processMarketOrder(order: Order, marketPrice: number): void {
    const { addExecutionReport, addTrade } = useOrderStore.getState();
    const { updatePosition } = usePositionStore.getState();
    const tutorialStore = useTutorialStore.getState();
    
    // Market orders execute immediately at current market price
    const fillPrice = order.side === 'BUY' 
      ? marketPrice * 1.001 // Simulate slippage
      : marketPrice * 0.999;
    
    const fillQuantity = order.quantity;
    
    // Create execution report
    const executionReport: ExecutionReport = {
      id: `EXEC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      orderId: order.id,
      execType: 'FILL',
      execId: `FILL_${order.id}`,
      lastQty: fillQuantity,
      lastPx: Math.round(fillPrice * 100) / 100,
      cumQty: fillQuantity,
      avgPx: Math.round(fillPrice * 100) / 100,
      ordStatus: 'FILLED',
      timestamp: Date.now(),
    };
    
    addExecutionReport(executionReport);
    
    // Create trade
    const trade: Trade = {
      id: `TRD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      orderId: order.id,
      symbol: order.symbol,
      side: order.side,
      quantity: fillQuantity,
      price: Math.round(fillPrice * 100) / 100,
      timestamp: Date.now(),
      tradeId: `T_${Date.now()}`,
    };
    
    addTrade(trade);
    
    // Track trade execution for tutorial achievements
    tutorialStore.incrementTradesExecuted();
    
    // Update position
    const positionQuantity = order.side === 'BUY' ? fillQuantity : -fillQuantity;
    updatePosition(order.symbol, positionQuantity, fillPrice);
    
    console.log(`Market order filled: ${order.id} at ${fillPrice}`);
  }

  private processLimitOrder(order: Order, marketData: any): void {
    if (!order.price) return;
    
    // Check if limit order can be filled immediately
    const canFill = order.side === 'BUY' 
      ? marketData.ask <= order.price
      : marketData.bid >= order.price;
    
    if (canFill) {
      const fillPrice = order.side === 'BUY' ? marketData.ask : marketData.bid;
      this.fillOrder(order, order.quantity, fillPrice);
    } else {
      // Order goes to order book (simulated)
      console.log(`Limit order ${order.id} added to book at ${order.price}`);
      
      // Simulate periodic checking for fills
      setTimeout(() => {
        if (Math.random() > 0.7) { // 30% chance of fill
          this.fillOrder(order, order.quantity, order.price);
        }
      }, Math.random() * 5000 + 1000);
    }
  }

  private processStopOrder(order: Order, marketData: any): void {
    if (!order.stopPrice) return;
    
    // Check if stop is triggered
    const isTriggered = order.side === 'BUY'
      ? marketData.price >= order.stopPrice
      : marketData.price <= order.stopPrice;
    
    if (isTriggered) {
      // Convert to market order
      this.processMarketOrder(order, marketData.price);
    } else {
      // Monitor for trigger (simplified)
      console.log(`Stop order ${order.id} monitoring at ${order.stopPrice}`);
    }
  }

  private processStopLimitOrder(order: Order, marketData: any): void {
    if (!order.stopPrice || !order.price) return;
    
    // Check if stop is triggered
    const isTriggered = order.side === 'BUY'
      ? marketData.price >= order.stopPrice
      : marketData.price <= order.stopPrice;
    
    if (isTriggered) {
      // Convert to limit order
      this.processLimitOrder(order, marketData);
    } else {
      console.log(`Stop-limit order ${order.id} monitoring at ${order.stopPrice}`);
    }
  }

  private fillOrder(order: Order, quantity: number, price: number): void {
    const { addExecutionReport, addTrade } = useOrderStore.getState();
    const { updatePosition } = usePositionStore.getState();
    const tutorialStore = useTutorialStore.getState();
    
    const executionReport: ExecutionReport = {
      id: `EXEC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      orderId: order.id,
      execType: quantity === order.quantity ? 'FILL' : 'PARTIAL_FILL',
      execId: `FILL_${order.id}_${Date.now()}`,
      lastQty: quantity,
      lastPx: Math.round(price * 100) / 100,
      cumQty: order.filledQuantity + quantity,
      avgPx: Math.round(price * 100) / 100,
      ordStatus: quantity === order.quantity ? 'FILLED' : 'PARTIALLY_FILLED',
      timestamp: Date.now(),
    };
    
    addExecutionReport(executionReport);
    
    const trade: Trade = {
      id: `TRD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      orderId: order.id,
      symbol: order.symbol,
      side: order.side,
      quantity,
      price: Math.round(price * 100) / 100,
      timestamp: Date.now(),
      tradeId: `T_${Date.now()}`,
    };
    
    addTrade(trade);
    
    // Track trade execution for tutorial achievements
    tutorialStore.incrementTradesExecuted();
    
    const positionQuantity = order.side === 'BUY' ? quantity : -quantity;
    updatePosition(order.symbol, positionQuantity, price);
    
    console.log(`Order filled: ${order.id} - ${quantity}@${price}`);
  }

  private validateOrder(order: Order): boolean {
    // Basic validation
    if (order.quantity <= 0) return false;
    if (order.orderType === 'LIMIT' && !order.price) return false;
    if (order.orderType === 'STOP' && !order.stopPrice) return false;
    if (order.orderType === 'STOP_LIMIT' && (!order.price || !order.stopPrice)) return false;
    
    return true;
  }

  private rejectOrder(orderId: string, reason: string): void {
    const { addExecutionReport } = useOrderStore.getState();
    
    const executionReport: ExecutionReport = {
      id: `EXEC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      orderId,
      execType: 'REJECTED',
      execId: `REJ_${orderId}`,
      lastQty: 0,
      lastPx: 0,
      cumQty: 0,
      avgPx: 0,
      ordStatus: 'REJECTED',
      timestamp: Date.now(),
    };
    
    addExecutionReport(executionReport);
    console.log(`Order rejected: ${orderId} - ${reason}`);
  }

  async cancelOrder(orderId: string): Promise<boolean> {
    const { getOrder, addExecutionReport, cancelOrder } = useOrderStore.getState();
    
    const order = getOrder(orderId);
    if (!order) return false;
    
    if (order.status === 'FILLED' || order.status === 'CANCELLED' || order.status === 'REJECTED') {
      return false;
    }
    
    const executionReport: ExecutionReport = {
      id: `EXEC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      orderId,
      execType: 'CANCELLED',
      execId: `CXL_${orderId}`,
      lastQty: 0,
      lastPx: 0,
      cumQty: order.filledQuantity,
      avgPx: order.avgFillPrice,
      ordStatus: 'CANCELLED',
      timestamp: Date.now(),
    };
    
    addExecutionReport(executionReport);
    cancelOrder(orderId);
    
    console.log(`Order cancelled: ${orderId}`);
    return true;
  }
}
