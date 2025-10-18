import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';
import { useTradingStore } from '@/stores/useTradingStore';
import { useMarketData } from '@/hooks/useMarketData';
import { formatPrice, formatVolume } from '@/utils/formatters';

export const MarketDepthChart: React.FC = () => {
  const { selectedInstrument } = useTradingStore();
  const { orderBook } = useMarketData(selectedInstrument?.symbol);

  if (!selectedInstrument) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-sm">Market Depth Chart</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-full">
          <p className="text-muted-foreground text-sm">Select an instrument</p>
        </CardContent>
      </Card>
    );
  }

  if (!orderBook) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-sm">Market Depth Chart</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-full">
          <p className="text-muted-foreground text-sm">Loading market depth...</p>
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data
  const chartData = React.useMemo(() => {
    const bids = orderBook.bids.slice(0, 10).map(level => ({
      price: level.price,
      quantity: level.quantity,
      side: 'bid',
      cumulativeQuantity: 0,
    }));

    const asks = orderBook.asks.slice(0, 10).map(level => ({
      price: level.price,
      quantity: level.quantity,
      side: 'ask',
      cumulativeQuantity: 0,
    }));

    // Calculate cumulative quantities
    let bidCumulative = 0;
    bids.forEach(bid => {
      bidCumulative += bid.quantity;
      bid.cumulativeQuantity = bidCumulative;
    });

    let askCumulative = 0;
    asks.forEach(ask => {
      askCumulative += ask.quantity;
      ask.cumulativeQuantity = askCumulative;
    });

    // Combine and sort by price
    return [...bids, ...asks].sort((a, b) => a.price - b.price);
  }, [orderBook]);

  const maxQuantity = Math.max(...chartData.map(d => d.quantity));

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          Market Depth Chart
          <Badge variant="outline" className="text-xs">
            {selectedInstrument.symbol}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
              <XAxis 
                dataKey="price"
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                tickFormatter={(value) => formatPrice(value)}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                tickFormatter={(value) => formatVolume(value)}
              />
              <Bar dataKey="quantity" radius={[2, 2, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.side === 'bid' ? '#10b981' : '#ef4444'}
                    fillOpacity={0.8}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="flex justify-center gap-6 mt-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Bids (Buy Orders)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Asks (Sell Orders)</span>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Total Bid Volume</div>
            <div className="text-sm font-mono text-green-500">
              {formatVolume(orderBook.bids.reduce((sum, level) => sum + level.quantity, 0))}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Total Ask Volume</div>
            <div className="text-sm font-mono text-red-500">
              {formatVolume(orderBook.asks.reduce((sum, level) => sum + level.quantity, 0))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
