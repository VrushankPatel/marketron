import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  BarChart3, 
  PieChart, 
  Globe,
  Search,
  RefreshCw,
  Filter
} from 'lucide-react';
import { useTradingStore } from '@/stores/useTradingStore';
import { useMarketDataList } from '@/hooks/useMarketData';
import { getInstrumentsByAssetClass, getInstrumentsBySector } from '@/data/instruments';
import { formatPrice, formatVolume, formatPercentage, getPriceChangeColor } from '@/utils/formatters';
import { AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export const MarketOverview: React.FC = () => {
  const { instruments } = useTradingStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [selectedAssetClass, setSelectedAssetClass] = useState<string>('all');

  // Get market data for all instruments
  const allSymbols = instruments.map(inst => inst.symbol);
  const marketDataList = useMarketDataList(allSymbols);

  const filteredData = useMemo(() => {
    let filtered = marketDataList;

    if (searchTerm) {
      filtered = filtered.filter(item => {
        const instrument = instruments.find(inst => inst.symbol === item.symbol);
        return item.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
               instrument?.name.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    if (selectedSector !== 'all') {
      filtered = filtered.filter(item => {
        const instrument = instruments.find(inst => inst.symbol === item.symbol);
        return instrument?.sector === selectedSector;
      });
    }

    if (selectedAssetClass !== 'all') {
      filtered = filtered.filter(item => {
        const instrument = instruments.find(inst => inst.symbol === item.symbol);
        return instrument?.assetClass === selectedAssetClass;
      });
    }

    return filtered;
  }, [marketDataList, searchTerm, selectedSector, selectedAssetClass, instruments]);

  // Market statistics
  const marketStats = useMemo(() => {
    const dataWithChanges = filteredData.filter(item => item.data);
    
    return {
      total: dataWithChanges.length,
      gainers: dataWithChanges.filter(item => item.data!.change > 0).length,
      losers: dataWithChanges.filter(item => item.data!.change < 0).length,
      unchanged: dataWithChanges.filter(item => item.data!.change === 0).length,
      totalVolume: dataWithChanges.reduce((sum, item) => sum + (item.data!.volume || 0), 0),
      avgChange: dataWithChanges.length > 0 
        ? dataWithChanges.reduce((sum, item) => sum + item.data!.changePercent, 0) / dataWithChanges.length 
        : 0
    };
  }, [filteredData]);

  // Sector performance data
  const sectorData = useMemo(() => {
    const sectors = ['Technology', 'Finance', 'Healthcare', 'Energy', 'Automotive'];
    
    return sectors.map(sector => {
      const sectorInstruments = filteredData.filter(item => {
        const instrument = instruments.find(inst => inst.symbol === item.symbol);
        return instrument?.sector === sector && item.data;
      });
      
      const avgChange = sectorInstruments.length > 0
        ? sectorInstruments.reduce((sum, item) => sum + item.data!.changePercent, 0) / sectorInstruments.length
        : 0;
      
      const totalVolume = sectorInstruments.reduce((sum, item) => sum + (item.data!.volume || 0), 0);
      
      return {
        name: sector,
        change: avgChange,
        volume: totalVolume,
        count: sectorInstruments.length,
        color: COLORS[sectors.indexOf(sector) % COLORS.length]
      };
    }).filter(item => item.count > 0);
  }, [filteredData, instruments]);

  // Asset class distribution
  const assetClassData = useMemo(() => {
    const assetClasses = ['EQUITY', 'FUTURES', 'OPTIONS', 'FOREX', 'INDEX'];
    
    return assetClasses.map(assetClass => {
      const count = filteredData.filter(item => {
        const instrument = instruments.find(inst => inst.symbol === item.symbol);
        return instrument?.assetClass === assetClass;
      }).length;
      
      return {
        name: assetClass,
        value: count,
        color: COLORS[assetClasses.indexOf(assetClass) % COLORS.length]
      };
    }).filter(item => item.value > 0);
  }, [filteredData, instruments]);

  // Top movers
  const topMovers = useMemo(() => {
    const dataWithChanges = filteredData.filter(item => item.data);
    
    return {
      gainers: dataWithChanges
        .filter(item => item.data!.change > 0)
        .sort((a, b) => b.data!.changePercent - a.data!.changePercent)
        .slice(0, 10),
      losers: dataWithChanges
        .filter(item => item.data!.change < 0)
        .sort((a, b) => a.data!.changePercent - b.data!.changePercent)
        .slice(0, 10)
    };
  }, [filteredData]);

  // Volume leaders
  const volumeLeaders = useMemo(() => {
    return filteredData
      .filter(item => item.data)
      .sort((a, b) => (b.data!.volume || 0) - (a.data!.volume || 0))
      .slice(0, 10);
  }, [filteredData]);

  const sectors = Array.from(new Set(instruments.map(inst => inst.sector).filter(Boolean)));
  const assetClasses = Array.from(new Set(instruments.map(inst => inst.assetClass)));

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Globe className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Market Overview</h2>
          <Badge variant="outline">{marketStats.total} instruments</Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-48">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search instruments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        
        <Select value={selectedSector} onValueChange={setSelectedSector}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Sector" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sectors</SelectItem>
            {sectors.map(sector => (
              <SelectItem key={sector} value={sector}>{sector}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={selectedAssetClass} onValueChange={setSelectedAssetClass}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Asset Class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Assets</SelectItem>
            {assetClasses.map(assetClass => (
              <SelectItem key={assetClass} value={assetClass}>{assetClass}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Market Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <div>
                <div className="text-2xl font-bold text-green-500">{marketStats.gainers}</div>
                <div className="text-xs text-muted-foreground">Gainers</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <div>
                <div className="text-2xl font-bold text-red-500">{marketStats.losers}</div>
                <div className="text-xs text-muted-foreground">Losers</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{formatVolume(marketStats.totalVolume)}</div>
                <div className="text-xs text-muted-foreground">Total Volume</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-purple-500" />
              <div>
                <div className={`text-2xl font-bold ${getPriceChangeColor(marketStats.avgChange)}`}>
                  {formatPercentage(marketStats.avgChange)}
                </div>
                <div className="text-xs text-muted-foreground">Avg Change</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="movers">Top Movers</TabsTrigger>
            <TabsTrigger value="sectors">Sectors</TabsTrigger>
            <TabsTrigger value="volume">Volume</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="flex-1 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
              {/* Sector Performance Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Sector Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={sectorData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                        <XAxis 
                          dataKey="name" 
                          fontSize={10}
                          stroke="hsl(var(--muted-foreground))"
                        />
                        <YAxis 
                          fontSize={10}
                          stroke="hsl(var(--muted-foreground))"
                          tickFormatter={(value) => `${value.toFixed(1)}%`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '6px',
                          }}
                          formatter={(value: number) => [`${value.toFixed(2)}%`, 'Change']}
                        />
                        <Bar dataKey="change" radius={[2, 2, 0, 0]}>
                          {sectorData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.change >= 0 ? '#10b981' : '#ef4444'}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Asset Class Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Asset Class Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          dataKey="value"
                          data={assetClassData}
                          cx="50%"
                          cy="50%"
                          outerRadius={60}
                          label={({ name, value, percent }) => 
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                          labelLine={false}
                          fontSize={10}
                        >
                          {assetClassData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="movers" className="flex-1">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
              {/* Top Gainers */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    Top Gainers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {topMovers.gainers.map((item, index) => {
                      const instrument = instruments.find(inst => inst.symbol === item.symbol);
                      return (
                        <div key={item.symbol} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground w-4">{index + 1}</span>
                            <div>
                              <div className="font-medium text-sm">{item.symbol}</div>
                              <div className="text-xs text-muted-foreground truncate">
                                {instrument?.name || instrument?.assetClass}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono text-sm">{formatPrice(item.data!.price)}</div>
                            <div className="text-xs text-green-500">
                              +{formatPercentage(item.data!.changePercent)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Top Losers */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-500" />
                    Top Losers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {topMovers.losers.map((item, index) => {
                      const instrument = instruments.find(inst => inst.symbol === item.symbol);
                      return (
                        <div key={item.symbol} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground w-4">{index + 1}</span>
                            <div>
                              <div className="font-medium text-sm">{item.symbol}</div>
                              <div className="text-xs text-muted-foreground truncate">
                                {instrument?.name || instrument?.assetClass}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono text-sm">{formatPrice(item.data!.price)}</div>
                            <div className="text-xs text-red-500">
                              {formatPercentage(item.data!.changePercent)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sectors" className="flex-1">
            <div className="grid grid-cols-1 gap-4">
              {sectorData.map(sector => (
                <Card key={sector.name}>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center justify-between">
                      {sector.name}
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{sector.count} instruments</Badge>
                        <span className={`text-sm font-mono ${getPriceChangeColor(sector.change)}`}>
                          {formatPercentage(sector.change)}
                        </span>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Avg Change: </span>
                        <span className={getPriceChangeColor(sector.change)}>
                          {formatPercentage(sector.change)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Volume: </span>
                        <span>{formatVolume(sector.volume)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="volume" className="flex-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Volume Leaders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {volumeLeaders.map((item, index) => {
                    const instrument = instruments.find(inst => inst.symbol === item.symbol);
                    return (
                      <div key={item.symbol} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-4">{index + 1}</span>
                          <div>
                            <div className="font-medium text-sm">{item.symbol}</div>
                            <div className="text-xs text-muted-foreground">
                              {instrument?.name || instrument?.assetClass}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-sm">{formatVolume(item.data!.volume || 0)}</div>
                          <div className={`text-xs ${getPriceChangeColor(item.data!.change)}`}>
                            {formatPrice(item.data!.price)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
