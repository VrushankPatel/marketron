import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useOrderStore } from '@/stores/useOrderStore';
import { formatPrice, formatTimestamp, formatCurrency } from '@/utils/formatters';

export const TradeBlotter: React.FC = () => {
  const { trades } = useOrderStore();
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredTrades = useMemo(() => {
    let filtered = trades;
    
    if (searchTerm) {
      filtered = filtered.filter(trade =>
        trade.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trade.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }, [trades, searchTerm]);

  const getTotalValue = () => {
    return filteredTrades.reduce((sum, trade) => sum + (trade.price * trade.quantity), 0);
  };

  const getSideColor = (side: string) => {
    return side === 'BUY' ? 'text-green-500' : 'text-red-500';
  };

  return (
    <Card className="h-full" data-tutorial="trade-blotter">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          Trade Blotter
          <Badge variant="outline" className="text-xs">
            {filteredTrades.length} trades
          </Badge>
        </CardTitle>
        
        {/* Search */}
        <div className="flex gap-2 pt-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" />
            <Input
              placeholder="Search trades..."
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
          <div className="grid grid-cols-6 gap-1 px-3 py-2 bg-muted/50 text-xs font-semibold border-b">
            <div>Symbol</div>
            <div>Side</div>
            <div>Qty</div>
            <div>Price</div>
            <div>Value</div>
            <div>Time</div>
          </div>
          
          {/* Trades */}
          <div className="flex-1 overflow-auto">
            {filteredTrades.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                No trades found
              </div>
            ) : (
              <div className="space-y-0">
                {filteredTrades.map((trade) => (
                  <div
                    key={trade.id}
                    className="grid grid-cols-6 gap-1 px-3 py-2 text-xs hover:bg-muted/30 border-b"
                  >
                    <div className="font-medium">{trade.symbol}</div>
                    <div className={`font-medium ${getSideColor(trade.side)}`}>
                      {trade.side}
                    </div>
                    <div className="font-mono">{trade.quantity}</div>
                    <div className="font-mono">{formatPrice(trade.price)}</div>
                    <div className="font-mono">
                      {formatCurrency(trade.price * trade.quantity)}
                    </div>
                    <div className="font-mono text-muted-foreground">
                      {formatTimestamp(trade.timestamp)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Summary */}
          {filteredTrades.length > 0 && (
            <div className="border-t p-3 bg-muted/30">
              <div className="flex justify-between text-xs">
                <span className="font-medium">Total Trades: {filteredTrades.length}</span>
                <span className="font-mono">
                  Total Value: {formatCurrency(getTotalValue())}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
