import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, 
  X, 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Star,
  Filter,
  MoreVertical
} from 'lucide-react';
import { useTradingStore } from '@/stores/useTradingStore';
import { useMarketDataList } from '@/hooks/useMarketData';
import { formatPrice, formatPercentage, getPriceChangeColor } from '@/utils/formatters';

export const Watchlist: React.FC = () => {
  const { 
    watchlist, 
    addToWatchlist, 
    removeFromWatchlist,
    instruments,
    selectedInstrument,
    setSelectedInstrument
  } = useTradingStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddInstrument, setShowAddInstrument] = useState(false);
  const [filter, setFilter] = useState<'all' | 'gainers' | 'losers'>('all');
  
  const marketDataList = useMarketDataList(watchlist);

  const filteredInstruments = useMemo(() => {
    return instruments.filter(instrument =>
      instrument.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      instrument.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 20);
  }, [instruments, searchTerm]);

  const filteredWatchlist = useMemo(() => {
    let filtered = marketDataList;
    
    switch (filter) {
      case 'gainers':
        filtered = filtered.filter(item => item.data && item.data.change > 0);
        break;
      case 'losers':
        filtered = filtered.filter(item => item.data && item.data.change < 0);
        break;
      default:
        break;
    }
    
    return filtered.sort((a, b) => {
      if (!a.data || !b.data) return 0;
      return Math.abs(b.data.changePercent) - Math.abs(a.data.changePercent);
    });
  }, [marketDataList, filter]);

  const handleAddInstrument = (symbol: string) => {
    addToWatchlist(symbol);
    setShowAddInstrument(false);
    setSearchTerm('');
  };

  const handleRemoveInstrument = (symbol: string) => {
    removeFromWatchlist(symbol);
  };

  const handleSelectInstrument = (symbol: string) => {
    const instrument = instruments.find(inst => inst.symbol === symbol);
    setSelectedInstrument(instrument || null);
  };

  return (
    <Card className="h-full" data-tutorial="watchlist">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Star className="h-4 w-4" />
            Watchlist
            <Badge variant="outline" className="text-xs">
              {watchlist.length}
            </Badge>
          </CardTitle>
          
          <div className="flex items-center gap-1">
            {/* Filter Buttons */}
            <Button
              variant={filter === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter('all')}
              className="h-6 px-2 text-xs"
            >
              All
            </Button>
            <Button
              variant={filter === 'gainers' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter('gainers')}
              className="h-6 px-2 text-xs text-green-500"
            >
              <TrendingUp className="h-3 w-3" />
            </Button>
            <Button
              variant={filter === 'losers' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter('losers')}
              className="h-6 px-2 text-xs text-red-500"
            >
              <TrendingDown className="h-3 w-3" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAddInstrument(!showAddInstrument)}
              className="h-6 w-6 p-0"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Add Instrument Search */}
        {showAddInstrument && (
          <div className="pt-2 space-y-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" />
              <Input
                placeholder="Search instruments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-7 h-8 text-xs"
              />
            </div>
            
            {searchTerm && (
              <div className="max-h-32 overflow-auto border rounded-md bg-background">
                {filteredInstruments.map((instrument) => (
                  <div
                    key={instrument.symbol}
                    className="flex items-center justify-between p-2 hover:bg-muted/50 cursor-pointer text-xs"
                    onClick={() => handleAddInstrument(instrument.symbol)}
                  >
                    <div>
                      <div className="font-medium">{instrument.symbol}</div>
                      <div className="text-muted-foreground text-xs truncate">
                        {instrument.name}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {instrument.assetClass}
                    </Badge>
                  </div>
                ))}
                {filteredInstruments.length === 0 && (
                  <div className="p-2 text-center text-muted-foreground text-xs">
                    No instruments found
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-full">
          <div className="space-y-0">
            {/* Header */}
            <div className="grid grid-cols-5 gap-1 px-3 py-2 bg-muted/50 text-xs font-semibold border-b sticky top-0">
              <div>Symbol</div>
              <div className="text-right">Price</div>
              <div className="text-right">Change</div>
              <div className="text-right">%</div>
              <div className="text-center">Action</div>
            </div>
            
            {/* Watchlist Items */}
            {filteredWatchlist.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <Star className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">No instruments in watchlist</p>
                <p className="text-xs">Click + to add instruments</p>
              </div>
            ) : (
              filteredWatchlist.map(({ symbol, data }) => {
                const isSelected = selectedInstrument?.symbol === symbol;
                const instrument = instruments.find(inst => inst.symbol === symbol);
                
                if (!data) {
                  return (
                    <div key={symbol} className="grid grid-cols-5 gap-1 px-3 py-2 text-xs border-b opacity-50">
                      <div className="font-medium">{symbol}</div>
                      <div className="text-right">--</div>
                      <div className="text-right">--</div>
                      <div className="text-right">--</div>
                      <div className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveInstrument(symbol)}
                          className="h-4 w-4 p-0"
                        >
                          <X className="h-2 w-2" />
                        </Button>
                      </div>
                    </div>
                  );
                }

                const changeColor = getPriceChangeColor(data.change);
                const ChangeIcon = data.change >= 0 ? TrendingUp : TrendingDown;
                
                return (
                  <div
                    key={symbol}
                    className={`grid grid-cols-5 gap-1 px-3 py-2 text-xs border-b hover:bg-muted/30 cursor-pointer ${
                      isSelected ? 'bg-primary/10 border-primary/20' : ''
                    }`}
                    onClick={() => handleSelectInstrument(symbol)}
                  >
                    <div className="space-y-0">
                      <div className="font-medium">{symbol}</div>
                      {instrument && (
                        <div className="text-muted-foreground text-xs truncate">
                          {instrument.assetClass}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right font-mono">
                      {formatPrice(data.price)}
                    </div>
                    
                    <div className={`text-right font-mono flex items-center justify-end gap-1 ${changeColor}`}>
                      <ChangeIcon className="h-2 w-2" />
                      {formatPrice(Math.abs(data.change))}
                    </div>
                    
                    <div className={`text-right font-mono ${changeColor}`}>
                      {formatPercentage(Math.abs(data.changePercent))}
                    </div>
                    
                    <div className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveInstrument(symbol);
                        }}
                        className="h-4 w-4 p-0"
                      >
                        <X className="h-2 w-2" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
        
        {/* Summary Statistics */}
        {filteredWatchlist.length > 0 && (
          <div className="border-t p-3 bg-muted/30">
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <div className="text-muted-foreground">Gainers</div>
                <div className="font-bold text-green-500">
                  {marketDataList.filter(item => item.data && item.data.change > 0).length}
                </div>
              </div>
              <div className="text-center">
                <div className="text-muted-foreground">Unchanged</div>
                <div className="font-bold text-muted-foreground">
                  {marketDataList.filter(item => item.data && item.data.change === 0).length}
                </div>
              </div>
              <div className="text-center">
                <div className="text-muted-foreground">Losers</div>
                <div className="font-bold text-red-500">
                  {marketDataList.filter(item => item.data && item.data.change < 0).length}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
