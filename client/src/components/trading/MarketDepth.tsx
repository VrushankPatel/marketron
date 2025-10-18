import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useTradingStore } from '@/stores/useTradingStore';
import { useMarketData } from '@/hooks/useMarketData';
import { formatPrice, formatVolume } from '@/utils/formatters';

export const MarketDepth: React.FC = () => {
  const { selectedInstrument } = useTradingStore();
  const { orderBook } = useMarketData(selectedInstrument?.symbol);

  if (!selectedInstrument) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-sm">Market Depth</CardTitle>
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
          <CardTitle className="text-sm">Market Depth</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-full">
          <p className="text-muted-foreground text-sm">Loading order book...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full" data-tutorial="market-depth">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          Market Depth
          <Badge variant="outline" className="text-xs">
            {selectedInstrument.symbol}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="grid grid-cols-3 gap-2 px-4 py-2 bg-muted/50 text-xs font-semibold">
            <div className="text-left">Size</div>
            <div className="text-center">Price</div>
            <div className="text-right">Orders</div>
          </div>
          
          <Separator />
          
          {/* Asks (Sell Orders) */}
          <div className="flex-1 overflow-auto">
            <div className="space-y-0">
              {orderBook.asks.slice(0, 10).reverse().map((level: { price: number; quantity: number; orderCount: number }, index: number) => (
                <div
                  key={`ask-${index}`}
                  className="grid grid-cols-3 gap-2 px-4 py-1 text-xs hover:bg-muted/30 border-l-2 border-red-500/20"
                >
                  <div className="text-left font-mono text-muted-foreground">
                    {formatVolume(level.quantity)}
                  </div>
                  <div className="text-center font-mono text-red-500">
                    {formatPrice(level.price)}
                  </div>
                  <div className="text-right font-mono text-muted-foreground">
                    {level.orderCount}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Spread */}
            <div className="py-2 px-4 bg-muted/30 border-y">
              <div className="text-center text-xs">
                <span className="text-muted-foreground">Spread: </span>
                <span className="font-mono">
                  {formatPrice(orderBook.asks[0]?.price - orderBook.bids[0]?.price)}
                </span>
              </div>
            </div>
            
            {/* Bids (Buy Orders) */}
            <div className="space-y-0">
              {orderBook.bids.slice(0, 10).map((level: { price: number; quantity: number; orderCount: number }, index: number) => (
                <div
                  key={`bid-${index}`}
                  className="grid grid-cols-3 gap-2 px-4 py-1 text-xs hover:bg-muted/30 border-l-2 border-green-500/20"
                >
                  <div className="text-left font-mono text-muted-foreground">
                    {formatVolume(level.quantity)}
                  </div>
                  <div className="text-center font-mono text-green-500">
                    {formatPrice(level.price)}
                  </div>
                  <div className="text-right font-mono text-muted-foreground">
                    {level.orderCount}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Footer with totals */}
          <Separator />
          <div className="p-3 bg-muted/30">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="text-center">
                <div className="text-muted-foreground">Total Bids</div>
                <div className="font-mono text-green-500">
                  {formatVolume(orderBook.bids.reduce((sum: number, level: { quantity: number }) => sum + level.quantity, 0))}
                </div>
              </div>
              <div className="text-center">
                <div className="text-muted-foreground">Total Asks</div>
                <div className="font-mono text-red-500">
                  {formatVolume(orderBook.asks.reduce((sum: number, level: { quantity: number }) => sum + level.quantity, 0))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
