import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  TrendingDown, 
  AlertTriangle, 
  Activity, 
  BarChart3,
  PieChart,
  Target,
  Zap,
  RefreshCw
} from 'lucide-react';
import { useRiskStore } from '@/stores/useRiskStore';
import { usePositionStore } from '@/stores/usePositionStore';
import { useOrderStore } from '@/stores/useOrderStore';
import { useMarketDataStore } from '@/stores/useMarketDataStore';
import { PositionOverview } from './PositionOverview';
import { formatCurrency, formatPercentage, getPriceChangeColor } from '@/utils/formatters';
import { calculateVaR, calculateSharpeRatio, calculateMaxDrawdown, calculateVolatility } from '@/utils/calculations';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const RISK_COLORS = {
  low: '#10b981',
  medium: '#f59e0b', 
  high: '#ef4444',
  critical: '#dc2626'
};

export const RiskDashboard: React.FC = () => {
  const { 
    metrics, 
    limits, 
    breaches, 
    updateMetrics, 
    updateLimits, 
    checkLimits,
    clearBreaches 
  } = useRiskStore();
  
  const { getAllPositions, totalPnL, totalMarketValue } = usePositionStore();
  const { orders, trades } = useOrderStore();
  const { marketData } = useMarketDataStore();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [pnlHistory, setPnlHistory] = useState<Array<{ timestamp: number; pnl: number; value: number }>>([]);

  const positions = getAllPositions();

  // Update P&L history
  useEffect(() => {
    // Initialize with current value immediately
    setPnlHistory(prev => {
      if (prev.length === 0) {
        return [{
          timestamp: Date.now(),
          pnl: totalPnL,
          value: totalMarketValue
        }];
      }
      return prev;
    });

    const updateHistory = () => {
      setPnlHistory(prev => {
        const newEntry = {
          timestamp: Date.now(),
          pnl: totalPnL,
          value: totalMarketValue
        };

        return [...prev, newEntry].slice(-100); // Keep last 100 entries
      });
    };

    const interval = setInterval(updateHistory, 2000); // Update every 2 seconds
    return () => clearInterval(interval);
  }, [totalPnL, totalMarketValue]);

  // Calculate risk metrics
  const riskMetrics = useMemo(() => {
    const dailyPnLs = pnlHistory.map(entry => entry.pnl);
    const prices = Array.from(marketData.values()).map(data => data.price).filter(p => p > 0);

    // Use actual position data for more realistic risk metrics if no history yet
    const hasEnoughData = dailyPnLs.length >= 2;
    const hasPositions = positions.length > 0;

    if (!hasEnoughData && !hasPositions) {
      // Show realistic demo values when no positions
      const samplePortfolioValue = 100000;
      const sampleVolatility = 0.18;
      return {
        var95: samplePortfolioValue * sampleVolatility * 1.65 * -1,
        var99: samplePortfolioValue * sampleVolatility * 2.33 * -1,
        sharpeRatio: 1.2,
        maxDrawdown: 0.08,
        volatility: sampleVolatility,
        beta: 1.0
      };
    }

    // If we have positions but not enough history, use position-based estimates
    if (!hasEnoughData && hasPositions) {
      const portfolioValue = Math.abs(totalMarketValue) || 10000;
      const estimatedVol = prices.length > 1 ? calculateVolatility(prices) : 0.15;

      return {
        var95: portfolioValue * estimatedVol * 1.65 * -1, // 95% confidence
        var99: portfolioValue * estimatedVol * 2.33 * -1, // 99% confidence
        sharpeRatio: totalPnL > 0 ? 1.5 : totalPnL < 0 ? -0.5 : 0,
        maxDrawdown: totalPnL < 0 ? Math.abs(totalPnL) / portfolioValue : 0,
        volatility: estimatedVol,
        beta: 1.0
      };
    }

    return {
      var95: calculateVaR(dailyPnLs, 0.95),
      var99: calculateVaR(dailyPnLs, 0.99),
      sharpeRatio: calculateSharpeRatio(dailyPnLs),
      maxDrawdown: calculateMaxDrawdown(dailyPnLs),
      volatility: prices.length > 1 ? calculateVolatility(prices) : 0,
      beta: 1.0 // Simplified
    };
  }, [pnlHistory, marketData, positions.length, totalMarketValue, totalPnL]);

  // Update risk metrics in store
  useEffect(() => {
    updateMetrics(riskMetrics);
  }, [riskMetrics, updateMetrics]);

  // Position concentration analysis
  const concentrationData = useMemo(() => {
    const totalValue = Math.abs(totalMarketValue);
    
    return positions.map(position => ({
      symbol: position.symbol,
      value: Math.abs(position.marketValue),
      percentage: totalValue > 0 ? (Math.abs(position.marketValue) / totalValue) * 100 : 0,
      risk: position.unrealizedPnL < 0 ? Math.abs(position.unrealizedPnL) : 0,
      side: position.side
    })).sort((a, b) => b.percentage - a.percentage);
  }, [positions, totalMarketValue]);

  // Risk limit utilization
  const limitUtilization = useMemo(() => {
    const maxPosition = positions.reduce((max, pos) => 
      Math.max(max, Math.abs(pos.marketValue)), 0
    );
    
    return {
      position: {
        current: maxPosition,
        limit: limits.maxPositionSize,
        utilization: (maxPosition / limits.maxPositionSize) * 100
      },
      dailyLoss: {
        current: Math.abs(Math.min(0, totalPnL)),
        limit: limits.maxDailyLoss,
        utilization: (Math.abs(Math.min(0, totalPnL)) / limits.maxDailyLoss) * 100
      },
      var: {
        current: Math.abs(riskMetrics.var95),
        limit: limits.varLimit,
        utilization: (Math.abs(riskMetrics.var95) / limits.varLimit) * 100
      },
      concentration: {
        current: concentrationData[0]?.percentage || 0,
        limit: limits.maxConcentration * 100,
        utilization: ((concentrationData[0]?.percentage || 0) / (limits.maxConcentration * 100)) * 100
      }
    };
  }, [positions, totalPnL, limits, riskMetrics, concentrationData]);

  // Risk level assessment
  const overallRiskLevel = useMemo(() => {
    const utilizationValues = Object.values(limitUtilization).map(item => item.utilization);
    const maxUtilization = Math.max(...utilizationValues);
    
    if (maxUtilization >= 90) return 'critical';
    if (maxUtilization >= 70) return 'high';
    if (maxUtilization >= 50) return 'medium';
    return 'low';
  }, [limitUtilization]);

  const getRiskColor = (level: string) => RISK_COLORS[level as keyof typeof RISK_COLORS];
  
  const getRiskLevelText = (utilization: number) => {
    if (utilization >= 90) return 'Critical';
    if (utilization >= 70) return 'High';
    if (utilization >= 50) return 'Medium';
    return 'Low';
  };

  // Chart data for P&L history
  const pnlChartData = useMemo(() => {
    return pnlHistory.map(entry => ({
      time: new Date(entry.timestamp).toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      pnl: entry.pnl,
      value: entry.value,
      timestamp: entry.timestamp
    }));
  }, [pnlHistory]);

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Risk Dashboard</h2>
          <Badge 
            variant="outline" 
            className={`border-2`}
            style={{ 
              borderColor: getRiskColor(overallRiskLevel),
              color: getRiskColor(overallRiskLevel)
            }}
          >
            {overallRiskLevel.toUpperCase()} RISK
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={clearBreaches}>
            Clear Alerts
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Risk Alerts */}
      {breaches.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              {breaches.slice(0, 3).map((breach, index) => (
                <div key={index} className="text-sm">
                  {breach.message}
                </div>
              ))}
              {breaches.length > 3 && (
                <div className="text-xs opacity-80">
                  +{breaches.length - 3} more alerts
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">{formatCurrency(Math.abs(riskMetrics.var95))}</div>
                <div className="text-xs text-muted-foreground">VaR (95%)</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{riskMetrics.sharpeRatio.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">Sharpe Ratio</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">
                  {formatPercentage(riskMetrics.maxDrawdown * 100)}
                </div>
                <div className="text-xs text-muted-foreground">Max Drawdown</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold">
                  {formatPercentage(riskMetrics.volatility * 100)}
                </div>
                <div className="text-xs text-muted-foreground">Volatility</div>
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
            <TabsTrigger value="limits">Risk Limits</TabsTrigger>
            <TabsTrigger value="positions">Positions</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="flex-1 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
              {/* P&L Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">P&L History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={pnlChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                        <XAxis 
                          dataKey="time" 
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
                          formatter={(value: number) => [formatCurrency(value), 'P&L']}
                        />
                        <Area
                          type="monotone"
                          dataKey="pnl"
                          stroke="#3b82f6"
                          fill="#3b82f6"
                          fillOpacity={0.3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Risk Limits Utilization */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Risk Limits Utilization</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(limitUtilization).map(([key, data]) => (
                    <div key={key} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <span className={`font-mono ${getPriceChangeColor(data.utilization - 50)}`}>
                          {data.utilization.toFixed(1)}%
                        </span>
                      </div>
                      <Progress 
                        value={data.utilization} 
                        className="h-2"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{formatCurrency(data.current)}</span>
                        <span>Limit: {formatCurrency(data.limit)}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="limits" className="flex-1">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Current Limits */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Risk Limits</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-muted-foreground">Max Position Size</label>
                      <div className="text-lg font-mono">{formatCurrency(limits.maxPositionSize)}</div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Max Daily Loss</label>
                      <div className="text-lg font-mono">{formatCurrency(limits.maxDailyLoss)}</div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Max Order Size</label>
                      <div className="text-lg font-mono">{formatCurrency(limits.maxOrderSize)}</div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">VaR Limit</label>
                      <div className="text-lg font-mono">{formatCurrency(limits.varLimit)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Breach History */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Recent Breaches</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-auto">
                    {breaches.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No risk breaches</p>
                      </div>
                    ) : (
                      breaches.map((breach, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant={breach.severity === 'CRITICAL' ? 'destructive' : 'secondary'}
                                  className="text-xs"
                                >
                                  {breach.severity}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(breach.timestamp).toLocaleTimeString()}
                                </span>
                              </div>
                              <div className="text-sm">{breach.message}</div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="positions" className="flex-1">
            <PositionOverview />
          </TabsContent>

          <TabsContent value="analysis" className="flex-1 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Position Concentration */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Position Concentration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          dataKey="percentage"
                          data={concentrationData.slice(0, 8)}
                          cx="50%"
                          cy="50%"
                          outerRadius={60}
                          label={({ symbol, percentage }) => 
                            percentage > 5 ? `${symbol} ${percentage.toFixed(1)}%` : ''
                          }
                          labelLine={false}
                          fontSize={10}
                        >
                          {concentrationData.slice(0, 8).map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.side === 'LONG' ? '#10b981' : '#ef4444'} 
                            />
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

              {/* Risk Metrics Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Risk Metrics Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Beta:</span>
                        <span className="font-mono">{riskMetrics.beta.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sharpe Ratio:</span>
                        <span className="font-mono">{riskMetrics.sharpeRatio.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Max Drawdown:</span>
                        <span className="font-mono text-red-500">
                          {formatPercentage(riskMetrics.maxDrawdown * 100)}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>VaR 95%:</span>
                        <span className="font-mono text-orange-500">
                          {formatCurrency(Math.abs(riskMetrics.var95))}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>VaR 99%:</span>
                        <span className="font-mono text-red-500">
                          {formatCurrency(Math.abs(riskMetrics.var99))}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Volatility:</span>
                        <span className="font-mono">
                          {formatPercentage(riskMetrics.volatility * 100)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <div className="text-xs text-muted-foreground mb-2">Risk Assessment</div>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getRiskColor(overallRiskLevel) }}
                      ></div>
                      <span className="text-sm font-medium">
                        {getRiskLevelText(Math.max(...Object.values(limitUtilization).map(item => item.utilization)))} Risk Level
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Based on current position exposure and market conditions
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
