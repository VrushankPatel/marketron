import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Target, 
  DollarSign,
  Percent,
  BarChart3,
  PieChart
} from 'lucide-react';
import { usePositionStore } from '@/stores/usePositionStore';
import { useMarketDataStore } from '@/stores/useMarketDataStore';
import { useTradingStore } from '@/stores/useTradingStore';
import { calculateUnrealizedPnL } from '@/utils/calculations';
import { 
  formatPrice, 
  formatCurrency, 
  formatPercentage, 
  formatPositionSide, 
  getPriceChangeColor 
} from '@/utils/formatters';
import { BarChart, Bar, PieChart as RechartsPieChart, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Pie } from 'recharts';

export const PositionOverview: React.FC = () => {
  const { getAllPositions, totalPnL, totalMarketValue } = usePositionStore();
  const { marketData } = useMarketDataStore();
  const { instruments } = useTradingStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'symbol' | 'value' | 'pnl' | 'percentage'>('value');
  const [filterSide, setFilterSide] = useState<'all' | 'LONG' | 'SHORT' | 'FLAT'>('all');

  const positions = getAllPositions();

  const enrichedPositions = useMemo(() => {
    return positions
      .filter(position => position.quantity !== 0)
      .map(position => {
        const currentMarketData = marketData.get(position.symbol);
        const currentPrice = currentMarketData?.price || 0;
        const unrealizedPnL = calculateUnrealizedPnL(position, currentPrice);
        const marketValue = Math.abs(position.quantity) * currentPrice;
        const instrument = instruments.find(inst => inst.symbol === position.symbol);
        
        return {
          ...position,
          currentPrice,
          unrealizedPnL,
          marketValue,
          instrument,
          percentageOfPortfolio: totalMarketValue > 0 ? (marketValue / totalMarketValue) * 100 : 0,
          pnlPercentage: position.averagePrice > 0 
            ? ((currentPrice - position.averagePrice) / position.averagePrice) * 100 
            : 0
        };
      });
  }, [positions, marketData, instruments, totalMarketValue]);

  const filteredPositions = useMemo(() => {
    let filtered = enrichedPositions;

    if (searchTerm) {
      filtered = filtered.filter(position =>
        position.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        position.instrument?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterSide !== 'all') {
      filtered = filtered.filter(position => position.side === filterSide);
    }

    // Sort positions
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'symbol':
          return a.symbol.localeCompare(b.symbol);
        case 'value':
          return b.marketValue - a.marketValue;
        case 'pnl':
          return b.unrealizedPnL - a.unrealizedPnL;
        case 'percentage':
          return b.percentageOfPortfolio - a.percentageOfPortfolio;
        default:
          return 0;
      }
    });
  }, [enrichedPositions, searchTerm, filterSide, sortBy]);

  // Portfolio statistics
  const portfolioStats = useMemo(() => {
    const longPositions = filteredPositions.filter(pos => pos.side === 'LONG');
    const shortPositions = filteredPositions.filter(pos => pos.side === 'SHORT');
    
    return {
      totalPositions: filteredPositions.length,
      longPositions: longPositions.length,
      shortPositions: shortPositions.length,
      longValue: longPositions.reduce((sum, pos) => sum + pos.marketValue, 0),
      shortValue: shortPositions.reduce((sum, pos) => sum + pos.marketValue, 0),
      totalUnrealizedPnL: filteredPositions.reduce((sum, pos) => sum + pos.unrealizedPnL, 0),
      winners: filteredPositions.filter(pos => pos.unrealizedPnL > 0).length,
      losers: filteredPositions.filter(pos => pos.unrealizedPnL < 0).length,
    };
  }, [filteredPositions]);

  // Sector allocation data for chart
  const sectorAllocation = useMemo(() => {
    const sectorMap = new Map<string, { value: number; pnl: number }>();
    
    filteredPositions.forEach(position => {
      const sector = position.instrument?.sector || 'Unknown';
      const existing = sectorMap.get(sector) || { value: 0, pnl: 0 };
      
      sectorMap.set(sector, {
        value: existing.value + position.marketValue,
        pnl: existing.pnl + position.unrealizedPnL
      });
    });
    
    return Array.from(sectorMap.entries()).map(([sector, data]) => ({
      name: sector,
      value: data.value,
      pnl: data.pnl,
      percentage: totalMarketValue > 0 ? (data.value / totalMarketValue) * 100 : 0
    })).sort((a, b) => b.value - a.value);
  }, [filteredPositions, totalMarketValue]);

  // Top positions by value
  const topPositions = useMemo(() => {
    return filteredPositions.slice(0, 10);
  }, [filteredPositions]);

  const getSideColor = (side: string) => {
    switch (side) {
      case 'LONG': return 'text-green-500';
      case 'SHORT': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  const getSideBadgeVariant = (side: string) => {
    switch (side) {
      case 'LONG': return 'default' as const;
      case 'SHORT': return 'destructive' as const;
      default: return 'secondary' as const;
    }
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Target className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Position Overview</h3>
          <Badge variant="outline">{portfolioStats.totalPositions} positions</Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <div className={`text-sm font-medium ${getPriceChangeColor(portfolioStats.totalUnrealizedPnL)}`}>
            Total P&L: {formatCurrency(portfolioStats.totalUnrealizedPnL)}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <div>
                <div className="text-lg font-bold text-green-500">{portfolioStats.longPositions}</div>
                <div className="text-xs text-muted-foreground">Long</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <div>
                <div className="text-lg font-bold text-red-500">{portfolioStats.shortPositions}</div>
                <div className="text-xs text-muted-foreground">Short</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-500" />
              <div>
                <div className="text-lg font-bold">{formatCurrency(totalMarketValue)}</div>
                <div className="text-xs text-muted-foreground">Market Value</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <div>
                <div className="text-lg font-bold text-green-500">{portfolioStats.winners}</div>
                <div className="text-xs text-muted-foreground">Winners</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <div>
                <div className="text-lg font-bold text-red-500">{portfolioStats.losers}</div>
                <div className="text-xs text-muted-foreground">Losers</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Positions Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Top Positions by Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topPositions}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                  <XAxis 
                    dataKey="symbol" 
                    fontSize={10}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis
                    fontSize={10}
                    stroke="hsl(var(--muted-foreground))"
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                    }}
                    formatter={(value: number) => [formatCurrency(value), 'Market Value']}
                  />
                  <Bar dataKey="marketValue" radius={[2, 2, 0, 0]}>
                    {topPositions.map((position, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={position.side === 'LONG' ? '#10b981' : '#ef4444'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Sector Allocation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Sector Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    dataKey="percentage"
                    data={sectorAllocation}
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    label={({ name, percentage }) => 
                      percentage > 5 ? `${name} ${percentage.toFixed(1)}%` : ''
                    }
                    labelLine={false}
                    fontSize={10}
                  >
                    {sectorAllocation.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${value.toFixed(2)}%`, 'Allocation']}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-48">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search positions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        
        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="value">By Value</SelectItem>
            <SelectItem value="pnl">By P&L</SelectItem>
            <SelectItem value="percentage">By %</SelectItem>
            <SelectItem value="symbol">By Symbol</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={filterSide} onValueChange={(value: any) => setFilterSide(value)}>
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="LONG">Long</SelectItem>
            <SelectItem value="SHORT">Short</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Position Table */}
      <Card className="flex-1">
        <CardHeader>
          <CardTitle className="text-sm">Position Details</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto max-h-96">
            {/* Header */}
            <div className="grid grid-cols-8 gap-2 px-4 py-2 bg-muted/50 text-xs font-semibold border-b sticky top-0">
              <div>Symbol</div>
              <div>Side</div>
              <div className="text-right">Quantity</div>
              <div className="text-right">Avg Price</div>
              <div className="text-right">Current Price</div>
              <div className="text-right">Market Value</div>
              <div className="text-right">Unrealized P&L</div>
              <div className="text-right">Portfolio %</div>
            </div>
            
            {/* Positions */}
            <div className="space-y-0">
              {filteredPositions.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  <div className="text-center">
                    <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No positions found</p>
                  </div>
                </div>
              ) : (
                filteredPositions.map((position) => (
                  <div
                    key={position.symbol}
                    className="grid grid-cols-8 gap-2 px-4 py-3 text-xs hover:bg-muted/30 border-b"
                  >
                    <div className="space-y-0">
                      <div className="font-medium">{position.symbol}</div>
                      <div className="text-muted-foreground text-xs">
                        {position.instrument?.assetClass}
                      </div>
                    </div>
                    
                    <div>
                      <Badge 
                        variant={getSideBadgeVariant(position.side)}
                        className="text-xs"
                      >
                        {formatPositionSide(position.side)}
                      </Badge>
                    </div>
                    
                    <div className="text-right font-mono">
                      {Math.abs(position.quantity).toLocaleString()}
                    </div>
                    
                    <div className="text-right font-mono">
                      {formatPrice(position.averagePrice)}
                    </div>
                    
                    <div className="text-right font-mono">
                      {formatPrice(position.currentPrice)}
                    </div>
                    
                    <div className="text-right font-mono">
                      {formatCurrency(position.marketValue)}
                    </div>
                    
                    <div className={`text-right font-mono ${getPriceChangeColor(position.unrealizedPnL)}`}>
                      {formatCurrency(position.unrealizedPnL)}
                    </div>
                    
                    <div className="text-right font-mono text-muted-foreground">
                      {position.percentageOfPortfolio.toFixed(2)}%
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* Summary Footer */}
          {filteredPositions.length > 0 && (
            <div className="border-t p-4 bg-muted/30">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Total Positions: </span>
                  <span className="font-medium">{filteredPositions.length}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Market Value: </span>
                  <span className="font-mono">{formatCurrency(totalMarketValue)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Unrealized P&L: </span>
                  <span className={`font-mono ${getPriceChangeColor(portfolioStats.totalUnrealizedPnL)}`}>
                    {formatCurrency(portfolioStats.totalUnrealizedPnL)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
