import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { X, Search, Filter } from 'lucide-react';
import { useOrderStore } from '@/stores/useOrderStore';
import { OrderService } from '@/services/OrderService';
import { formatPrice, formatTimestamp, formatOrderStatus, formatOrderType } from '@/utils/formatters';
import { Order } from '@/types/trading';

const orderService = new OrderService();

export const OrderBlotter: React.FC = () => {
  const { orders } = useOrderStore();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');

  const filteredOrders = useMemo(() => {
    let filtered = orders;
    
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }
    
    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }, [orders, searchTerm, statusFilter]);

  const handleCancelOrder = async (orderId: string) => {
    try {
      await orderService.cancelOrder(orderId);
    } catch (error) {
      console.error('Failed to cancel order:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW': return 'bg-blue-500';
      case 'PARTIALLY_FILLED': return 'bg-yellow-500';
      case 'FILLED': return 'bg-green-500';
      case 'CANCELLED': return 'bg-gray-500';
      case 'REJECTED': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getSideColor = (side: string) => {
    return side === 'BUY' ? 'text-green-500' : 'text-red-500';
  };

  return (
    <Card className="h-full" data-tutorial="order-blotter">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          Order Blotter
          <Badge variant="outline" className="text-xs">
            {filteredOrders.length} orders
          </Badge>
        </CardTitle>
        
        {/* Filters */}
        <div className="flex gap-2 pt-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-7 h-8 text-xs"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 px-2 text-xs border border-input bg-background rounded-md"
          >
            <option value="all">All Status</option>
            <option value="NEW">New</option>
            <option value="PARTIALLY_FILLED">Partial</option>
            <option value="FILLED">Filled</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="h-full overflow-auto">
          {/* Header */}
          <div className="grid grid-cols-8 gap-1 px-3 py-2 bg-muted/50 text-xs font-semibold border-b sticky top-0">
            <div>Symbol</div>
            <div>Side</div>
            <div>Type</div>
            <div>Qty</div>
            <div>Price</div>
            <div>Status</div>
            <div>Time</div>
            <div>Action</div>
          </div>
          
          {/* Orders */}
          <div className="space-y-0">
            {filteredOrders.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                No orders found
              </div>
            ) : (
              filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="grid grid-cols-8 gap-1 px-3 py-2 text-xs hover:bg-muted/30 border-b"
                >
                  <div className="font-medium">{order.symbol}</div>
                  <div className={`font-medium ${getSideColor(order.side)}`}>
                    {order.side}
                  </div>
                  <div className="text-muted-foreground">
                    {formatOrderType(order.orderType)}
                  </div>
                  <div className="font-mono">
                    {order.filledQuantity > 0 ? (
                      <span>
                        {order.filledQuantity}
                        <span className="text-muted-foreground">/{order.quantity}</span>
                      </span>
                    ) : (
                      order.quantity
                    )}
                  </div>
                  <div className="font-mono">
                    {order.orderType === 'MARKET' ? 'MKT' : formatPrice(order.price || 0)}
                  </div>
                  <div>
                    <Badge
                      variant="secondary"
                      className={`text-xs text-white ${getStatusColor(order.status)}`}
                    >
                      {formatOrderStatus(order.status)}
                    </Badge>
                  </div>
                  <div className="font-mono text-muted-foreground">
                    {formatTimestamp(order.timestamp)}
                  </div>
                  <div>
                    {(order.status === 'NEW' || order.status === 'PARTIALLY_FILLED') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelOrder(order.id)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
