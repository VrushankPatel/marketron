import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, LineChart, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { useTradingStore } from '@/stores/useTradingStore';
import { useMarketData } from '@/hooks/useMarketData';
import { formatPrice, formatVolume, getPriceChangeColor } from '@/utils/formatters';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';

type ChartType = 'line' | 'area' | 'candlestick' | 'volume';
type TimeFrame = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

export const TradingChart: React.FC = () => {
  const { selectedInstrument } = useTradingStore();
  const { marketData, ticks } = useMarketData(selectedInstrument?.symbol);
  const [chartType, setChartType] = useState<ChartType>('line');
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('5m');
  const [chartData, setChartData] = useState<any[]>([]);

  // Initialize chart data when instrument or timeframe changes
  useEffect(() => {
    if (!selectedInstrument || !marketData) {
      setChartData([]);
      return;
    }

    const getTimeframeInMs = (tf: TimeFrame): number => {
      switch (tf) {
        case '1m': return 60000;
        case '5m': return 300000;
        case '15m': return 900000;
        case '1h': return 3600000;
        case '4h': return 14400000;
        case '1d': return 86400000;
        default: return 300000;
      }
    };

    const getDataPoints = (tf: TimeFrame): number => {
      switch (tf) {
        case '1m': return 60;
        case '5m': return 60;
        case '15m': return 96;
        case '1h': return 24;
        case '4h': return 30;
        case '1d': return 30;
        default: return 60;
      }
    };

    const timeframeMs = getTimeframeInMs(timeFrame);
    const dataPoints = getDataPoints(timeFrame);
    const now = Date.now();
    const currentPrice = marketData.price;
    
    // Generate realistic historical price data using random walk
    const historicalData = [];
    let price = currentPrice * (0.95 + Math.random() * 0.05); // Start 0-5% below current price
    
    for (let i = 0; i < dataPoints; i++) {
      const timestamp = now - (dataPoints - i) * timeframeMs;
      
      // Random walk with trend toward current price
      const trendFactor = (i / dataPoints) * 0.3; // Gradually trend upward
      const randomChange = (Math.random() - 0.5) * currentPrice * 0.005; // ±0.5% random movement
      const trendChange = (currentPrice - price) * trendFactor * 0.1; // Trend toward current price
      
      price = price + randomChange + trendChange;
      price = Math.max(price, currentPrice * 0.9); // Don't go below 10% of current price
      price = Math.min(price, currentPrice * 1.1); // Don't go above 10% of current price
      
      // Generate OHLC data
      const open = price;
      const volatility = currentPrice * 0.003; // 0.3% intrabar volatility
      const high = price + Math.random() * volatility;
      const low = price - Math.random() * volatility;
      const close = low + Math.random() * (high - low);
      
      // Ensure OHLC relationships are correct
      const ohlc = {
        open: Math.round(open * 100) / 100,
        high: Math.round(Math.max(open, close, high) * 100) / 100,
        low: Math.round(Math.min(open, close, low) * 100) / 100,
        close: Math.round(close * 100) / 100,
      };
      
      price = ohlc.close; // Continue from close price
      
      historicalData.push({
        timestamp,
        time: timeFrame === '1d'
          ? new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : new Date(timestamp).toLocaleTimeString('en-US', {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit'
            }),
        price: ohlc.close,
        volume: Math.floor(Math.random() * 5000) + 1000,
        ...ohlc
      });
    }
    
    // Ensure the last data point matches the current market price
    if (historicalData.length > 0) {
      const lastPoint = historicalData[historicalData.length - 1];
      lastPoint.price = currentPrice;
      lastPoint.close = currentPrice;
      lastPoint.high = Math.max(lastPoint.high, currentPrice);
      lastPoint.low = Math.min(lastPoint.low, currentPrice);
    }

    setChartData(historicalData);
  }, [timeFrame, selectedInstrument?.symbol]);

  // Update chart data progressively with new price
  useEffect(() => {
    if (!marketData?.price || chartData.length === 0) return;

    const updateInterval = setInterval(() => {
      setChartData(prev => {
        const lastPoint = prev[prev.length - 1];
        
        // Update the last point with new price
        const updatedLastPoint = {
          ...lastPoint,
          price: marketData.price,
          high: Math.max(lastPoint.high, marketData.price),
          low: Math.min(lastPoint.low, marketData.price),
          close: marketData.price,
          volume: Math.max(lastPoint.volume, marketData.volume),
        };

        return [...prev.slice(0, -1), updatedLastPoint];
      });
    }, 1000);

    return () => clearInterval(updateInterval);
  }, [marketData?.price, chartData.length]);

  const renderChart = () => {
    if (chartData.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Loading chart data...</p>
        </div>
      );
    }

    const commonProps = {
      data: chartData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    };

    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <RechartsLineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
              <XAxis 
                dataKey="time" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                domain={['dataMin - 1', 'dataMax + 1']}
                tickFormatter={(value) => formatPrice(value)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
                formatter={(value: number) => [formatPrice(value), 'Price']}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, stroke: 'hsl(var(--primary))' }}
              />
            </RechartsLineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
              <XAxis 
                dataKey="time" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                domain={['dataMin - 1', 'dataMax + 1']}
                tickFormatter={(value) => formatPrice(value)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
                formatter={(value: number) => [formatPrice(value), 'Price']}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'volume':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
              <XAxis 
                dataKey="time" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                tickFormatter={(value) => formatVolume(value)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
                formatter={(value: number) => [formatVolume(value), 'Volume']}
              />
              <Bar
                dataKey="volume"
                fill="hsl(var(--primary))"
                opacity={0.8}
              />
            </BarChart>
          </ResponsiveContainer>
        );

      default:
        return renderChart();
    }
  };

  const currentPrice = chartData[chartData.length - 1]?.price || 0;
  const previousPrice = chartData[chartData.length - 2]?.price || 0;
  const priceChange = currentPrice - previousPrice;
  const priceChangePercent = previousPrice > 0 ? (priceChange / previousPrice) * 100 : 0;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Trading Chart
            {selectedInstrument && (
              <Badge variant="outline" className="text-xs">
                {selectedInstrument.symbol}
              </Badge>
            )}
          </CardTitle>
          
          {/* Chart Controls */}
          <div className="flex items-center gap-2">
            <Select value={chartType} onValueChange={(value: ChartType) => setChartType(value)}>
              <SelectTrigger className="w-24 h-7">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="line">
                  <LineChart className="h-3 w-3 inline mr-1" />
                  Line
                </SelectItem>
                <SelectItem value="area">
                  <TrendingUp className="h-3 w-3 inline mr-1" />
                  Area
                </SelectItem>
                <SelectItem value="volume">
                  <BarChart3 className="h-3 w-3 inline mr-1" />
                  Volume
                </SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={timeFrame} onValueChange={(value: TimeFrame) => setTimeFrame(value)}>
              <SelectTrigger className="w-16 h-7">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1m">1m</SelectItem>
                <SelectItem value="5m">5m</SelectItem>
                <SelectItem value="15m">15m</SelectItem>
                <SelectItem value="1h">1h</SelectItem>
                <SelectItem value="4h">4h</SelectItem>
                <SelectItem value="1d">1d</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Price Information */}
        {selectedInstrument && marketData && (
          <div className="flex items-center gap-4 pt-2">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">{formatPrice(currentPrice)}</span>
              <div className={`flex items-center gap-1 text-sm ${getPriceChangeColor(priceChange)}`}>
                {priceChange >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                <span>{formatPrice(Math.abs(priceChange))} ({Math.abs(priceChangePercent).toFixed(2)}%)</span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              Vol: {formatVolume(marketData.volume)}
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="h-96">
          {selectedInstrument ? (
            renderChart()
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Select an instrument to view chart</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
