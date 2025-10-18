import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { optionsCalculator, OptionPricing } from '@/services/OptionsCalculator';
import { formatPrice } from '@/utils/formatters';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface OptionsChainProps {
  symbol: string;
  spotPrice: number;
}

export const OptionsChain: React.FC<OptionsChainProps> = ({ symbol, spotPrice }) => {
  const [volatility, setVolatility] = useState(0.25);
  const [riskFreeRate, setRiskFreeRate] = useState(0.05);
  const [daysToExpiry, setDaysToExpiry] = useState(30);
  const [strikeStep, setStrikeStep] = useState(5);
  const [selectedExpiry, setSelectedExpiry] = useState('30d');

  const expiryOptions = [
    { label: '1 Week', value: '7d', days: 7 },
    { label: '2 Weeks', value: '14d', days: 14 },
    { label: '1 Month', value: '30d', days: 30 },
    { label: '2 Months', value: '60d', days: 60 },
    { label: '3 Months', value: '90d', days: 90 },
    { label: '6 Months', value: '180d', days: 180 },
  ];

  useEffect(() => {
    const selected = expiryOptions.find(opt => opt.value === selectedExpiry);
    if (selected) {
      setDaysToExpiry(selected.days);
    }
  }, [selectedExpiry]);

  const optionChain = useMemo(() => {
    const timeToExpiry = daysToExpiry / 365;

    const strikeRange = {
      min: Math.floor((spotPrice * 0.8) / strikeStep) * strikeStep,
      max: Math.ceil((spotPrice * 1.2) / strikeStep) * strikeStep,
      step: strikeStep,
    };

    return optionsCalculator.generateOptionChain(
      spotPrice,
      timeToExpiry,
      riskFreeRate,
      volatility,
      strikeRange
    );
  }, [spotPrice, daysToExpiry, riskFreeRate, volatility, strikeStep]);

  const atmStrike = useMemo(() => {
    return optionChain.reduce((closest, option) => {
      return Math.abs(option.strike - spotPrice) < Math.abs(closest.strike - spotPrice)
        ? option
        : closest;
    }, optionChain[0]);
  }, [optionChain, spotPrice]);

  const renderGreeksTable = (type: 'call' | 'put') => {
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Strike</TableHead>
              <TableHead className="text-xs text-right">Price</TableHead>
              <TableHead className="text-xs text-right">Delta</TableHead>
              <TableHead className="text-xs text-right">Gamma</TableHead>
              <TableHead className="text-xs text-right">Theta</TableHead>
              <TableHead className="text-xs text-right">Vega</TableHead>
              <TableHead className="text-xs text-right">IV</TableHead>
              <TableHead className="text-xs text-right">Vol</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {optionChain.map((option, index) => {
              const pricing: OptionPricing = type === 'call' ? option.call : option.put;
              const isATM = option.strike === atmStrike.strike;
              const isITM = type === 'call'
                ? option.strike < spotPrice
                : option.strike > spotPrice;

              return (
                <TableRow
                  key={index}
                  className={`
                    ${isATM ? 'bg-blue-500/10 font-semibold' : ''}
                    ${isITM ? 'bg-green-500/5' : 'bg-red-500/5'}
                    hover:bg-muted/50
                  `}
                >
                  <TableCell className="text-xs font-mono">
                    <div className="flex items-center gap-2">
                      {formatPrice(option.strike)}
                      {isATM && <Badge variant="outline" className="text-xs">ATM</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-right font-semibold">
                    {formatPrice(pricing.callPrice)}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-right">
                    {pricing.delta.toFixed(4)}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-right">
                    {pricing.gamma.toFixed(4)}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-right text-red-500">
                    {pricing.theta.toFixed(4)}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-right">
                    {pricing.vega.toFixed(4)}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-right">
                    {pricing.intrinsicValue.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-right">
                    {pricing.timeValue.toFixed(2)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>Options Chain - {symbol}</span>
          <Badge variant="outline" className="text-xs">
            Spot: {formatPrice(spotPrice)}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <Label className="text-xs">Volatility (σ)</Label>
            <Input
              type="number"
              value={volatility}
              onChange={(e) => setVolatility(parseFloat(e.target.value) || 0.25)}
              step="0.01"
              min="0.01"
              max="2.0"
              className="text-xs"
            />
          </div>

          <div>
            <Label className="text-xs">Risk-Free Rate</Label>
            <Input
              type="number"
              value={riskFreeRate}
              onChange={(e) => setRiskFreeRate(parseFloat(e.target.value) || 0.05)}
              step="0.001"
              min="0"
              max="0.2"
              className="text-xs"
            />
          </div>

          <div>
            <Label className="text-xs">Strike Step</Label>
            <Input
              type="number"
              value={strikeStep}
              onChange={(e) => setStrikeStep(parseInt(e.target.value) || 5)}
              step="1"
              min="1"
              max="50"
              className="text-xs"
            />
          </div>

          <div>
            <Label className="text-xs">Days to Expiry</Label>
            <Input
              type="number"
              value={daysToExpiry}
              onChange={(e) => setDaysToExpiry(parseInt(e.target.value) || 30)}
              step="1"
              min="1"
              max="365"
              className="text-xs"
            />
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {expiryOptions.map((option) => (
            <Button
              key={option.value}
              variant={selectedExpiry === option.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedExpiry(option.value)}
              className="text-xs"
            >
              {option.label}
            </Button>
          ))}
        </div>

        <Tabs defaultValue="calls" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="calls" className="text-xs flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Calls
            </TabsTrigger>
            <TabsTrigger value="puts" className="text-xs flex items-center gap-1">
              <TrendingDown className="h-3 w-3" />
              Puts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calls" className="mt-4">
            {renderGreeksTable('call')}
          </TabsContent>

          <TabsContent value="puts" className="mt-4">
            {renderGreeksTable('put')}
          </TabsContent>
        </Tabs>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 p-3 bg-muted/30 rounded text-xs">
          <div className="text-center">
            <div className="text-muted-foreground">ATM Strike</div>
            <div className="font-mono font-semibold">{formatPrice(atmStrike.strike)}</div>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground">Call Price</div>
            <div className="font-mono font-semibold text-green-500">
              {formatPrice(atmStrike.call.callPrice)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground">Put Price</div>
            <div className="font-mono font-semibold text-red-500">
              {formatPrice(atmStrike.put.putPrice)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground">Time to Expiry</div>
            <div className="font-mono font-semibold">{daysToExpiry}d</div>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground">Volatility</div>
            <div className="font-mono font-semibold">{(volatility * 100).toFixed(1)}%</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
