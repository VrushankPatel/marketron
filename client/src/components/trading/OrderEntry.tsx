import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { useTradingStore } from '@/stores/useTradingStore';
import { useMarketData } from '@/hooks/useMarketData';
import { OrderService } from '@/services/OrderService';
import { useToast } from '@/hooks/use-toast';
import { formatPrice, formatCurrency } from '@/utils/formatters';
import { OrderType, OrderSide, TimeInForce } from '@/types/trading';
import { complexOrderService } from '@/services/ComplexOrderService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const orderService = new OrderService();

export const OrderEntry: React.FC = () => {
  const { selectedInstrument, settings } = useTradingStore();
  const { marketData } = useMarketData(selectedInstrument?.symbol);
  const { toast } = useToast();

  const [orderData, setOrderData] = useState({
    side: 'BUY' as OrderSide,
    orderType: 'LIMIT' as OrderType,
    quantity: settings.defaultQuantity,
    price: 0,
    stopPrice: 0,
    timeInForce: 'DAY' as TimeInForce,
    gatewayType: 'FIX' as 'FIX' | 'OUCH',
    expireDate: undefined as number | undefined,
  });

  const [isAdvanced, setIsAdvanced] = useState(false);
  const [orderCategory, setOrderCategory] = useState<'simple' | 'bracket' | 'oco' | 'multileg'>('simple');

  const [bracketData, setBracketData] = useState({
    takeProfitPrice: 0,
    stopLossPrice: 0,
    trailingStop: false,
    trailingPercent: 5,
  });

  const [ocoData, setOcoData] = useState({
    primaryPrice: 0,
    secondaryPrice: 0,
    primaryType: 'LIMIT' as OrderType,
    secondaryType: 'STOP' as OrderType,
  });

  // Update price when market data changes
  React.useEffect(() => {
    if (marketData && orderData.orderType === 'LIMIT') {
      const price = orderData.side === 'BUY' ? marketData.bid : marketData.ask;
      setOrderData(prev => ({ ...prev, price }));
    }
  }, [marketData, orderData.side, orderData.orderType]);

  const handleSubmitOrder = async () => {
    if (!selectedInstrument) {
      toast({
        title: "Error",
        description: "Please select an instrument first",
        variant: "destructive",
      });
      return;
    }

    if (orderData.quantity <= 0) {
      toast({
        title: "Error",
        description: "Quantity must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    try {
      let orderId: string | undefined;

      if (orderCategory === 'bracket') {
        const result = complexOrderService.createBracketOrder({
          entryOrder: {
            symbol: selectedInstrument.symbol,
            side: orderData.side,
            orderType: orderData.orderType,
            quantity: orderData.quantity,
            price: orderData.price,
            timeInForce: orderData.timeInForce,
            gatewayType: orderData.gatewayType,
          },
          takeProfitOrder: {
            type: 'TAKE_PROFIT',
            triggerPrice: bracketData.takeProfitPrice,
            orderType: 'LIMIT',
            quantity: orderData.quantity,
            price: bracketData.takeProfitPrice,
          },
          stopLossOrder: {
            type: bracketData.trailingStop ? 'TRAILING_STOP' : 'STOP_LOSS',
            triggerPrice: bracketData.stopLossPrice,
            orderType: 'MARKET',
            quantity: orderData.quantity,
            offsetPercent: bracketData.trailingStop ? bracketData.trailingPercent : undefined,
          },
          trailingStop: bracketData.trailingStop,
        });
        orderId = result.parentId;
        toast({
          title: "Bracket Order Submitted",
          description: `Parent: ${result.parentId}`,
        });
      } else if (orderCategory === 'oco') {
        const result = complexOrderService.createOCOOrder({
          primaryOrder: {
            symbol: selectedInstrument.symbol,
            side: orderData.side,
            orderType: ocoData.primaryType,
            quantity: orderData.quantity,
            price: ocoData.primaryPrice,
            timeInForce: orderData.timeInForce,
            gatewayType: orderData.gatewayType,
          },
          secondaryOrder: {
            symbol: selectedInstrument.symbol,
            side: orderData.side,
            orderType: ocoData.secondaryType,
            quantity: orderData.quantity,
            price: ocoData.secondaryPrice,
            stopPrice: ocoData.secondaryPrice,
            timeInForce: orderData.timeInForce,
            gatewayType: orderData.gatewayType,
          },
        });
        orderId = result.primaryId;
        toast({
          title: "OCO Order Submitted",
          description: `Primary: ${result.primaryId}, Secondary: ${result.secondaryId}`,
        });
      } else {
        orderId = await orderService.submitOrder({
          symbol: selectedInstrument.symbol,
          side: orderData.side,
          orderType: orderData.orderType,
          quantity: orderData.quantity,
          price: orderData.orderType === 'MARKET' ? undefined : orderData.price,
          stopPrice: orderData.orderType === 'STOP' || orderData.orderType === 'STOP_LIMIT'
            ? orderData.stopPrice : undefined,
          timeInForce: orderData.timeInForce,
          gatewayType: orderData.gatewayType,
          expireDate: orderData.expireDate,
        });
        toast({
          title: "Order Submitted",
          description: `Order ${orderId} submitted successfully`,
        });
      }

      setOrderData(prev => ({
        ...prev,
        quantity: settings.defaultQuantity,
      }));
    } catch (error) {
      toast({
        title: "Order Failed",
        description: "Failed to submit order",
        variant: "destructive",
      });
    }
  };

  const calculateOrderValue = () => {
    const price = orderData.orderType === 'MARKET' 
      ? (marketData?.price || 0)
      : orderData.price;
    return price * orderData.quantity;
  };

  const getEstimatedFillPrice = () => {
    if (!marketData) return 0;
    
    switch (orderData.orderType) {
      case 'MARKET':
        return orderData.side === 'BUY' ? marketData.ask : marketData.bid;
      case 'LIMIT':
        return orderData.price;
      default:
        return marketData.price;
    }
  };

  if (!selectedInstrument) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-sm">Order Entry</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-full">
          <p className="text-muted-foreground text-sm">Select an instrument to start trading</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full" data-tutorial="order-entry">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          Order Entry
          <Badge variant="outline" className="text-xs">
            {selectedInstrument.symbol}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4 p-4">
        {/* Market Data Display */}
        {marketData && (
          <div className="grid grid-cols-2 gap-2 p-2 bg-muted/50 rounded">
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Bid</div>
              <div className="text-sm font-mono text-red-500">
                {formatPrice(marketData.bid)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Ask</div>
              <div className="text-sm font-mono text-green-500">
                {formatPrice(marketData.ask)}
              </div>
            </div>
          </div>
        )}


        {/* Order Type */}
        <div data-tutorial="order-type">
          <Label className="text-xs">Order Type</Label>
          <Select
            value={orderData.orderType}
            onValueChange={(value: OrderType) => 
              setOrderData(prev => ({ ...prev, orderType: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MARKET">Market</SelectItem>
              <SelectItem value="LIMIT">Limit</SelectItem>
              <SelectItem value="STOP">Stop</SelectItem>
              <SelectItem value="STOP_LIMIT">Stop Limit</SelectItem>
              <SelectItem value="ICEBERG">Iceberg</SelectItem>
              <SelectItem value="TWAP">TWAP</SelectItem>
              <SelectItem value="VWAP">VWAP</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Order Category Tabs */}
        <Tabs value={orderCategory} onValueChange={(v) => setOrderCategory(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="simple" className="text-xs">Simple</TabsTrigger>
            <TabsTrigger value="bracket" className="text-xs">Bracket</TabsTrigger>
            <TabsTrigger value="oco" className="text-xs">OCO</TabsTrigger>
            <TabsTrigger value="multileg" className="text-xs">Multi-Leg</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Quantity */}
        <div data-tutorial="quantity">
          <Label className="text-xs">Quantity</Label>
          <Input
            type="number"
            value={orderData.quantity}
            onChange={(e) => setOrderData(prev => ({ 
              ...prev, 
              quantity: parseInt(e.target.value) || 0 
            }))}
            min="1"
          />
        </div>

        {/* Price Fields */}
        {(orderData.orderType === 'LIMIT' || orderData.orderType === 'STOP_LIMIT') && (
          <div data-tutorial="price">
            <Label className="text-xs">Price</Label>
            <Input
              type="number"
              value={orderData.price}
              onChange={(e) => setOrderData(prev => ({ 
                ...prev, 
                price: parseFloat(e.target.value) || 0 
              }))}
              step="0.01"
              min="0"
            />
          </div>
        )}

        {(orderData.orderType === 'STOP' || orderData.orderType === 'STOP_LIMIT') && (
          <div>
            <Label className="text-xs">Stop Price</Label>
            <Input
              type="number"
              value={orderData.stopPrice}
              onChange={(e) => setOrderData(prev => ({ 
                ...prev, 
                stopPrice: parseFloat(e.target.value) || 0 
              }))}
              step="0.01"
              min="0"
            />
          </div>
        )}

        {/* Advanced Options Toggle */}
        <div className="flex items-center space-x-2">
          <Switch
            checked={isAdvanced}
            onCheckedChange={setIsAdvanced}
          />
          <Label className="text-xs">Advanced Options</Label>
        </div>

        {/* Complex Order Fields */}
        {orderCategory === 'bracket' && (
          <div className="space-y-3 p-3 bg-muted/30 rounded">
            <Label className="text-xs font-semibold">Bracket Order Settings</Label>
            <div>
              <Label className="text-xs">Take Profit Price</Label>
              <Input
                type="number"
                value={bracketData.takeProfitPrice}
                onChange={(e) => setBracketData(prev => ({ ...prev, takeProfitPrice: parseFloat(e.target.value) || 0 }))}
                step="0.01"
              />
            </div>
            <div>
              <Label className="text-xs">Stop Loss Price</Label>
              <Input
                type="number"
                value={bracketData.stopLossPrice}
                onChange={(e) => setBracketData(prev => ({ ...prev, stopLossPrice: parseFloat(e.target.value) || 0 }))}
                step="0.01"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={bracketData.trailingStop}
                onCheckedChange={(checked) => setBracketData(prev => ({ ...prev, trailingStop: checked }))}
              />
              <Label className="text-xs">Trailing Stop</Label>
            </div>
            {bracketData.trailingStop && (
              <div>
                <Label className="text-xs">Trailing % Offset</Label>
                <Input
                  type="number"
                  value={bracketData.trailingPercent}
                  onChange={(e) => setBracketData(prev => ({ ...prev, trailingPercent: parseFloat(e.target.value) || 0 }))}
                  step="0.1"
                  min="0"
                  max="100"
                />
              </div>
            )}
          </div>
        )}

        {orderCategory === 'oco' && (
          <div className="space-y-3 p-3 bg-muted/30 rounded">
            <Label className="text-xs font-semibold">OCO Order Settings</Label>
            <div>
              <Label className="text-xs">Primary Order Price</Label>
              <Input
                type="number"
                value={ocoData.primaryPrice}
                onChange={(e) => setOcoData(prev => ({ ...prev, primaryPrice: parseFloat(e.target.value) || 0 }))}
                step="0.01"
              />
            </div>
            <div>
              <Label className="text-xs">Secondary Order Price</Label>
              <Input
                type="number"
                value={ocoData.secondaryPrice}
                onChange={(e) => setOcoData(prev => ({ ...prev, secondaryPrice: parseFloat(e.target.value) || 0 }))}
                step="0.01"
              />
            </div>
          </div>
        )}

        {isAdvanced && (
          <>
            <Separator />

            {/* Time in Force */}
            <div>
              <Label className="text-xs">Time in Force</Label>
              <Select
                value={orderData.timeInForce}
                onValueChange={(value: TimeInForce) =>
                  setOrderData(prev => ({ ...prev, timeInForce: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DAY">Day</SelectItem>
                  <SelectItem value="GTC">Good Till Cancel</SelectItem>
                  <SelectItem value="IOC">Immediate or Cancel</SelectItem>
                  <SelectItem value="FOK">Fill or Kill</SelectItem>
                  <SelectItem value="GTD">Good Till Date</SelectItem>
                  <SelectItem value="ATC">At The Close</SelectItem>
                  <SelectItem value="ATO">At The Open</SelectItem>
                  <SelectItem value="GTT">Good Till Time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Expire Date for GTD */}
            {orderData.timeInForce === 'GTD' && (
              <div>
                <Label className="text-xs">Expire Date</Label>
                <Input
                  type="date"
                  onChange={(e) => setOrderData(prev => ({
                    ...prev,
                    expireDate: e.target.value ? new Date(e.target.value).getTime() : undefined
                  }))}
                />
              </div>
            )}

            {/* Gateway Type */}
            <div>
              <Label className="text-xs">Gateway</Label>
              <Select
                value={orderData.gatewayType}
                onValueChange={(value: 'FIX' | 'OUCH') =>
                  setOrderData(prev => ({ ...prev, gatewayType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FIX">FIX Protocol</SelectItem>
                  <SelectItem value="OUCH">OUCH Protocol</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {/* Order Summary */}
        <div className="p-3 bg-muted/30 rounded space-y-2">
          <div className="flex justify-between text-xs">
            <span>Order Value:</span>
            <span className="font-mono">{formatCurrency(calculateOrderValue())}</span>
          </div>
        </div>

        {/* Buy and Sell Buttons */}
        <div className="grid grid-cols-2 gap-3" data-tutorial="order-buttons">
          <Button
            onClick={() => {
              setOrderData(prev => ({ ...prev, side: 'BUY' }));
              setTimeout(handleSubmitOrder, 50);
            }}
            className="bg-green-600 hover:bg-green-700 h-12"
            size="lg"
          >
            <TrendingUp className="h-5 w-5 mr-2" />
            Buy
          </Button>
          <Button
            onClick={() => {
              setOrderData(prev => ({ ...prev, side: 'SELL' }));
              setTimeout(handleSubmitOrder, 50);
            }}
            className="bg-red-600 hover:bg-red-700 h-12"
            size="lg"
          >
            <TrendingDown className="h-5 w-5 mr-2" />
            Sell
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
