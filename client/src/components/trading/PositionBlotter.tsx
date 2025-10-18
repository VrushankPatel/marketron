import React, { useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { usePositionStore } from '@/stores/usePositionStore';
import { useMarketDataStore } from '@/stores/useMarketDataStore';
import { formatPrice, formatCurrency, formatPositionSide, getPriceChangeColor } from '@/utils/formatters';
import { calculateUnrealizedPnL } from '@/utils/calculations';

export const PositionBlotter: React.FC = () => {
  const { getAllPositions, updatePosition } = usePositionStore();
  const { marketData } = useMarketDataStore();
  const [searchTerm, setSearchTerm] = React.useState('');

  const positions = getAllPositions();

  // Update market values and unrealized P&L
  useEffect(() => {
    positions.forEach(position => {
      const currentMarketData = marketData.get(position.symbol);
      if (currentMarketData) {
        const marketValue = currentMarketData.price * Math.abs(position.quantity);
        const unrealizedPnL = calculateUnrealizedPnL(position, currentMarketData.price);
        
        // Update position with current market data
        if (position.marketValue !== marketValue || position.unrealizedPnL !== unrealizedPnL) {
          // This would normally be handled by the position store
          position.marketValue = marketValue;
          position.unrealizedPnL = unrealizedPnL;
        }
      }
    });
  }, [positions, marketData]);

  const filteredPositions = useMemo(() => {
    let filtered = positions.filter(pos => pos.quantity !== 0);
    
    if (searchTerm) {
      filtered = filtered.filter(position =>
        position.symbol.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered.sort((a, b) => Math.abs(b.marketValue) - Math.abs(a.marketValue));
  }, [positions, searchTerm]);

  const getTotalPnL = () => {
    return filteredPositions.reduce((sum, pos) => sum + pos.unrealizedPnL + pos.realizedPnL, 0);
  };

  const getTotalMarketValue = () => {
    return filteredPositions.reduce((sum, pos) => sum + Math.abs(pos.marketValue), 0);
  };

  const getCurrentPrice = (symbol: string) => {
    const currentMarketData = marketData.get(symbol);
    return currentMarketData?.price || 0;
  };

  const getSideColor = (side: string) => {
    switch (side) {
      case 'LONG': return 'text-green-500';
      case 'SHORT': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <Card className="h-full" data-tutorial="position-blotter">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          Position Blotter
          <Badge variant="outline" className="text-xs">
            {filteredPositions.length} positions
          </Badge>
        </CardTitle>
        
        {/* Search */}
        <div className="flex gap-2 pt-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" />
            <Input
              placeholder="Search positions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-7 h-8 text-xs"
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="grid grid-cols-7 gap-1 px-3 py-2 bg-muted/50 text-xs font-semibold border-b">
            <div>Symbol</div>
            <div>Side</div>
            <div>Qty</div>
            <div>Avg Price</div>
            <div>Market Price</div>
            <div>Market Value</div>
            <div>Unrealized P&L</div>
          </div>
          
          {/* Positions */}
          <div className="flex-1 overflow-auto">
            {filteredPositions.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                No positions found
              </div>
            ) : (
              <div className="space-y-0">
                {filteredPositions.map((position) => {
                  const currentPrice = getCurrentPrice(position.symbol);
                  const unrealizedPnL = calculateUnrealizedPnL(position, currentPrice);
                  
                  return (
                    <div
                      key={position.symbol}
                      className="grid grid-cols-7 gap-1 px-3 py-2 text-xs hover:bg-muted/30 border-b"
                    >
                      <div className="font-medium">{position.symbol}</div>
                      <div className={`font-medium ${getSideColor(position.side)}`}>
                        {formatPositionSide(position.side)}
                      </div>
                      <div className="font-mono">{Math.abs(position.quantity)}</div>
                      <div className="font-mono">{formatPrice(position.averagePrice)}</div>
                      <div className="font-mono">{formatPrice(currentPrice)}</div>
                      <div className="font-mono">
                        {formatCurrency(Math.abs(position.quantity) * currentPrice)}
                      </div>
                      <div className={`font-mono ${getPriceChangeColor(unrealizedPnL)}`}>
                        {formatCurrency(unrealizedPnL)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Summary */}
          {filteredPositions.length > 0 && (
            <div className="border-t p-3 bg-muted/30 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-medium">Total Positions: {filteredPositions.length}</span>
                <span className="font-mono">
                  Market Value: {formatCurrency(getTotalMarketValue())}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="font-medium">Total P&L:</span>
                <span className={`font-mono ${getPriceChangeColor(getTotalPnL())}`}>
                  {formatCurrency(getTotalPnL())}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
