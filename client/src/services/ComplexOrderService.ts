import { Order, BracketOrder, OCOOrder, OrderLeg, ContingentOrder, OrderSide } from '@/types/trading';
import { useOrderStore } from '@/stores/useOrderStore';
import { useMarketDataStore } from '@/stores/useMarketDataStore';

export class ComplexOrderService {
  private activeContingentOrders: Map<string, ContingentOrder[]> = new Map();
  private ocoGroups: Map<string, string[]> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startMonitoring();
  }

  createBracketOrder(bracketOrder: BracketOrder): { parentId: string; childIds: string[] } {
    const orderStore = useOrderStore.getState();

    const parentOrderData = {
      ...bracketOrder.entryOrder,
      clientOrderId: `BRACKET_${Date.now()}`,
      gatewayType: 'FIX' as const,
    };

    const parentId = orderStore.createOrder(parentOrderData as any);

    const childOrders: ContingentOrder[] = [
      bracketOrder.takeProfitOrder,
      bracketOrder.stopLossOrder,
    ];

    this.activeContingentOrders.set(parentId, childOrders);

    const childIds: string[] = [];

    orderStore.updateOrder(parentId, {
      contingentOrders: childOrders,
      childOrderIds: childIds,
    });

    console.log(`Bracket order created: Parent=${parentId}, Monitoring contingent orders`);

    return { parentId, childIds };
  }

  createOCOOrder(ocoOrder: OCOOrder): { primaryId: string; secondaryId: string } {
    const orderStore = useOrderStore.getState();

    const primaryOrderData = {
      ...ocoOrder.primaryOrder,
      clientOrderId: `OCO_PRIMARY_${Date.now()}`,
      gatewayType: 'FIX' as const,
    };

    const secondaryOrderData = {
      ...ocoOrder.secondaryOrder,
      clientOrderId: `OCO_SECONDARY_${Date.now()}`,
      gatewayType: 'FIX' as const,
    };

    const primaryId = orderStore.createOrder(primaryOrderData as any);
    const secondaryId = orderStore.createOrder(secondaryOrderData as any);

    const groupId = `OCO_${Date.now()}`;
    this.ocoGroups.set(groupId, [primaryId, secondaryId]);

    orderStore.updateOrder(primaryId, {
      childOrderIds: [secondaryId],
    });

    orderStore.updateOrder(secondaryId, {
      parentOrderId: primaryId,
    });

    console.log(`OCO order created: Primary=${primaryId}, Secondary=${secondaryId}`);

    return { primaryId, secondaryId };
  }

  createMultiLegOrder(
    symbol: string,
    legs: OrderLeg[],
    side: OrderSide,
    orderType: string = 'LIMIT'
  ): { parentId: string; legIds: string[] } {
    const orderStore = useOrderStore.getState();

    const totalQuantity = legs.reduce((sum, leg) => sum + leg.quantity, 0);

    const parentOrderData = {
      clientOrderId: `MULTILEG_${Date.now()}`,
      symbol,
      side,
      orderType: 'MULTI_LEG' as const,
      quantity: totalQuantity,
      timeInForce: 'DAY' as const,
      gatewayType: 'FIX' as const,
      legs,
    };

    const parentId = orderStore.createOrder(parentOrderData as any);

    const legIds = legs.map((leg, index) => {
      const legOrderData = {
        clientOrderId: `${parentId}_LEG_${index}`,
        symbol: leg.symbol,
        side: leg.side,
        orderType: leg.orderType,
        quantity: leg.quantity,
        price: leg.price,
        timeInForce: 'DAY' as const,
        gatewayType: 'FIX' as const,
        parentOrderId: parentId,
      };

      return orderStore.createOrder(legOrderData as any);
    });

    orderStore.updateOrder(parentId, {
      childOrderIds: legIds,
    });

    console.log(`Multi-leg order created: Parent=${parentId}, Legs=${legIds.join(', ')}`);

    return { parentId, legIds };
  }

  private startMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(() => {
      this.monitorBracketOrders();
      this.monitorOCOOrders();
    }, 500);
  }

  private monitorBracketOrders() {
    const orderStore = useOrderStore.getState();
    const marketDataStore = useMarketDataStore.getState();

    this.activeContingentOrders.forEach((contingentOrders, parentOrderId) => {
      const parentOrder = orderStore.getOrder(parentOrderId);

      if (!parentOrder || parentOrder.status === 'CANCELLED' || parentOrder.status === 'REJECTED') {
        this.activeContingentOrders.delete(parentOrderId);
        return;
      }

      if (parentOrder.status !== 'FILLED') {
        return;
      }

      const marketData = marketDataStore.marketData.get(parentOrder.symbol);
      if (!marketData) return;

      const currentPrice = marketData.price;

      contingentOrders.forEach((contingent) => {
        let shouldTrigger = false;

        if (contingent.type === 'TAKE_PROFIT') {
          if (parentOrder.side === 'BUY') {
            shouldTrigger = currentPrice >= contingent.triggerPrice;
          } else {
            shouldTrigger = currentPrice <= contingent.triggerPrice;
          }
        } else if (contingent.type === 'STOP_LOSS') {
          if (parentOrder.side === 'BUY') {
            shouldTrigger = currentPrice <= contingent.triggerPrice;
          } else {
            shouldTrigger = currentPrice >= contingent.triggerPrice;
          }
        } else if (contingent.type === 'TRAILING_STOP' && contingent.offsetPercent) {
          const offset = (contingent.offsetPercent / 100) * parentOrder.avgFillPrice;
          if (parentOrder.side === 'BUY') {
            const trailPrice = currentPrice - offset;
            shouldTrigger = currentPrice <= trailPrice;
          } else {
            const trailPrice = currentPrice + offset;
            shouldTrigger = currentPrice >= trailPrice;
          }
        }

        if (shouldTrigger) {
          const exitSide: OrderSide = parentOrder.side === 'BUY' ? 'SELL' : 'BUY';

          const exitOrderData = {
            clientOrderId: `${parentOrderId}_EXIT_${contingent.type}`,
            symbol: parentOrder.symbol,
            side: exitSide,
            orderType: contingent.orderType,
            quantity: contingent.quantity,
            price: contingent.price,
            timeInForce: 'IOC' as const,
            gatewayType: 'FIX' as const,
            parentOrderId: parentOrderId,
          };

          const exitOrderId = orderStore.createOrder(exitOrderData as any);
          console.log(`Contingent order triggered: ${contingent.type} for parent ${parentOrderId}, Exit order: ${exitOrderId}`);

          this.activeContingentOrders.delete(parentOrderId);
        }
      });
    });
  }

  private monitorOCOOrders() {
    const orderStore = useOrderStore.getState();

    this.ocoGroups.forEach((orderIds, groupId) => {
      const orders = orderIds.map(id => orderStore.getOrder(id)).filter(Boolean) as Order[];

      if (orders.length === 0) {
        this.ocoGroups.delete(groupId);
        return;
      }

      const filledOrder = orders.find(order => order.status === 'FILLED' || order.status === 'PARTIALLY_FILLED');

      if (filledOrder) {
        orderIds.forEach(orderId => {
          if (orderId !== filledOrder.id) {
            const orderToCancel = orderStore.getOrder(orderId);
            if (orderToCancel && orderToCancel.status === 'NEW') {
              orderStore.cancelOrder(orderId);
              console.log(`OCO: Cancelled order ${orderId} because ${filledOrder.id} was filled`);
            }
          }
        });

        this.ocoGroups.delete(groupId);
      }
    });
  }

  stop() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  getActiveContingentOrders() {
    return Array.from(this.activeContingentOrders.entries());
  }

  getActiveOCOGroups() {
    return Array.from(this.ocoGroups.entries());
  }
}

export const complexOrderService = new ComplexOrderService();
