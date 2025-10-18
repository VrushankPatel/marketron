export interface BacktestResult {
  strategyName: string;
  startDate: number;
  endDate: number;
  initialCapital: number;
  finalCapital: number;
  totalReturn: number;
  totalReturnPercent: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  profitFactor: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  trades: BacktestTrade[];
  equityCurve: Array<{ timestamp: number; equity: number }>;
}

export interface BacktestTrade {
  entryDate: number;
  exitDate: number;
  symbol: string;
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  profit: number;
  profitPercent: number;
  reason: string;
}

export interface TradingStrategy {
  name: string;
  description: string;
  parameters: Record<string, number>;
  shouldEnter: (data: HistoricalBar[], indicators: Record<string, number[]>) => boolean;
  shouldExit: (data: HistoricalBar[], indicators: Record<string, number[]>, entryPrice: number) => boolean;
}

export interface HistoricalBar {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Indicator {
  name: string;
  calculate: (data: HistoricalBar[], params?: Record<string, number>) => number[];
}

export class BacktestingEngine {
  private indicators: Map<string, Indicator> = new Map();

  constructor() {
    this.registerBuiltInIndicators();
  }

  private registerBuiltInIndicators(): void {
    this.indicators.set('SMA', {
      name: 'Simple Moving Average',
      calculate: (data, params = { period: 20 }) => {
        const result: number[] = [];
        const period = params.period;

        for (let i = 0; i < data.length; i++) {
          if (i < period - 1) {
            result.push(NaN);
          } else {
            const sum = data.slice(i - period + 1, i + 1).reduce((acc, bar) => acc + bar.close, 0);
            result.push(sum / period);
          }
        }

        return result;
      },
    });

    this.indicators.set('EMA', {
      name: 'Exponential Moving Average',
      calculate: (data, params = { period: 20 }) => {
        const result: number[] = [];
        const period = params.period;
        const multiplier = 2 / (period + 1);

        let ema = 0;
        for (let i = 0; i < data.length; i++) {
          if (i === 0) {
            ema = data[i].close;
          } else {
            ema = (data[i].close - ema) * multiplier + ema;
          }
          result.push(ema);
        }

        return result;
      },
    });

    this.indicators.set('RSI', {
      name: 'Relative Strength Index',
      calculate: (data, params = { period: 14 }) => {
        const result: number[] = [];
        const period = params.period;

        let gains = 0;
        let losses = 0;

        for (let i = 1; i < data.length; i++) {
          const change = data[i].close - data[i - 1].close;

          if (i <= period) {
            if (change > 0) gains += change;
            else losses += Math.abs(change);

            if (i === period) {
              const avgGain = gains / period;
              const avgLoss = losses / period;
              const rs = avgGain / avgLoss;
              result.push(100 - 100 / (1 + rs));
            } else {
              result.push(NaN);
            }
          } else {
            const prevAvgGain = gains / period;
            const prevAvgLoss = losses / period;

            const currentGain = change > 0 ? change : 0;
            const currentLoss = change < 0 ? Math.abs(change) : 0;

            gains = (prevAvgGain * (period - 1) + currentGain) / period;
            losses = (prevAvgLoss * (period - 1) + currentLoss) / period;

            const rs = gains / losses;
            result.push(100 - 100 / (1 + rs));
          }
        }

        return [NaN, ...result];
      },
    });

    this.indicators.set('MACD', {
      name: 'Moving Average Convergence Divergence',
      calculate: (data, params = { fast: 12, slow: 26, signal: 9 }) => {
        const fastEMA = this.indicators.get('EMA')!.calculate(data, { period: params.fast });
        const slowEMA = this.indicators.get('EMA')!.calculate(data, { period: params.slow });

        const macdLine = fastEMA.map((fast, i) => fast - slowEMA[i]);

        const signalData = macdLine.map((value, i) => ({
          timestamp: data[i].timestamp,
          open: value,
          high: value,
          low: value,
          close: value,
          volume: 0,
        }));

        const signalLine = this.indicators.get('EMA')!.calculate(signalData, { period: params.signal });

        const histogram = macdLine.map((macd, i) => macd - signalLine[i]);

        return histogram;
      },
    });

    this.indicators.set('BB', {
      name: 'Bollinger Bands',
      calculate: (data, params = { period: 20, stdDev: 2 }) => {
        const sma = this.indicators.get('SMA')!.calculate(data, { period: params.period });
        const result: number[] = [];

        for (let i = 0; i < data.length; i++) {
          if (i < params.period - 1) {
            result.push(NaN);
          } else {
            const slice = data.slice(i - params.period + 1, i + 1);
            const mean = sma[i];
            const variance =
              slice.reduce((acc, bar) => acc + Math.pow(bar.close - mean, 2), 0) / params.period;
            const stdDev = Math.sqrt(variance);
            result.push(stdDev * params.stdDev);
          }
        }

        return result;
      },
    });
  }

  registerCustomIndicator(name: string, indicator: Indicator): void {
    this.indicators.set(name, indicator);
  }

  private calculateAllIndicators(
    data: HistoricalBar[],
    indicatorsToCalculate: Array<{ name: string; params?: Record<string, number> }>
  ): Record<string, number[]> {
    const results: Record<string, number[]> = {};

    indicatorsToCalculate.forEach(({ name, params }) => {
      const indicator = this.indicators.get(name);
      if (indicator) {
        results[name] = indicator.calculate(data, params);
      }
    });

    return results;
  }

  runBacktest(
    strategy: TradingStrategy,
    historicalData: HistoricalBar[],
    initialCapital: number = 100000,
    indicatorsToUse: Array<{ name: string; params?: Record<string, number> }> = []
  ): BacktestResult {
    const indicators = this.calculateAllIndicators(historicalData, indicatorsToUse);

    const trades: BacktestTrade[] = [];
    let currentCapital = initialCapital;
    let currentPosition: { entryDate: number; entryPrice: number; quantity: number; side: 'LONG' | 'SHORT' } | null = null;

    const equityCurve: Array<{ timestamp: number; equity: number }> = [];

    for (let i = 0; i < historicalData.length; i++) {
      const currentBar = historicalData[i];

      const currentIndicators: Record<string, number[]> = {};
      Object.keys(indicators).forEach(key => {
        currentIndicators[key] = indicators[key].slice(0, i + 1);
      });

      if (!currentPosition && strategy.shouldEnter(historicalData.slice(0, i + 1), currentIndicators)) {
        const positionSize = Math.floor((currentCapital * 0.95) / currentBar.close);
        if (positionSize > 0) {
          currentPosition = {
            entryDate: currentBar.timestamp,
            entryPrice: currentBar.close,
            quantity: positionSize,
            side: 'LONG',
          };
        }
      } else if (currentPosition && strategy.shouldExit(historicalData.slice(0, i + 1), currentIndicators, currentPosition.entryPrice)) {
        const exitPrice = currentBar.close;
        const profit = (exitPrice - currentPosition.entryPrice) * currentPosition.quantity;
        const profitPercent = ((exitPrice - currentPosition.entryPrice) / currentPosition.entryPrice) * 100;

        trades.push({
          entryDate: currentPosition.entryDate,
          exitDate: currentBar.timestamp,
          symbol: 'SIMULATED',
          side: currentPosition.side,
          entryPrice: currentPosition.entryPrice,
          exitPrice,
          quantity: currentPosition.quantity,
          profit,
          profitPercent,
          reason: 'Exit signal',
        });

        currentCapital += profit;
        currentPosition = null;
      }

      const currentEquity = currentPosition
        ? currentCapital + (currentBar.close - currentPosition.entryPrice) * currentPosition.quantity
        : currentCapital;

      equityCurve.push({
        timestamp: currentBar.timestamp,
        equity: currentEquity,
      });
    }

    if (currentPosition) {
      const lastBar = historicalData[historicalData.length - 1];
      const profit = (lastBar.close - currentPosition.entryPrice) * currentPosition.quantity;
      const profitPercent = ((lastBar.close - currentPosition.entryPrice) / currentPosition.entryPrice) * 100;

      trades.push({
        entryDate: currentPosition.entryDate,
        exitDate: lastBar.timestamp,
        symbol: 'SIMULATED',
        side: currentPosition.side,
        entryPrice: currentPosition.entryPrice,
        exitPrice: lastBar.close,
        quantity: currentPosition.quantity,
        profit,
        profitPercent,
        reason: 'End of backtest',
      });

      currentCapital += profit;
    }

    const winningTrades = trades.filter(t => t.profit > 0);
    const losingTrades = trades.filter(t => t.profit <= 0);

    const winRate = trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0;

    const totalGain = winningTrades.reduce((sum, t) => sum + t.profit, 0);
    const totalLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.profit, 0));
    const profitFactor = totalLoss > 0 ? totalGain / totalLoss : totalGain > 0 ? Infinity : 0;

    const returns = equityCurve.slice(1).map((point, i) =>
      (point.equity - equityCurve[i].equity) / equityCurve[i].equity
    );

    const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    const sharpeRatio = stdDev > 0 ? (meanReturn / stdDev) * Math.sqrt(252) : 0;

    let maxDrawdown = 0;
    let peak = equityCurve[0].equity;

    equityCurve.forEach(point => {
      if (point.equity > peak) {
        peak = point.equity;
      }
      const drawdown = (peak - point.equity) / peak;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    });

    return {
      strategyName: strategy.name,
      startDate: historicalData[0].timestamp,
      endDate: historicalData[historicalData.length - 1].timestamp,
      initialCapital,
      finalCapital: currentCapital,
      totalReturn: currentCapital - initialCapital,
      totalReturnPercent: ((currentCapital - initialCapital) / initialCapital) * 100,
      sharpeRatio,
      maxDrawdown: maxDrawdown * 100,
      winRate,
      profitFactor,
      totalTrades: trades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      averageWin: winningTrades.length > 0 ? totalGain / winningTrades.length : 0,
      averageLoss: losingTrades.length > 0 ? totalLoss / losingTrades.length : 0,
      largestWin: winningTrades.length > 0 ? Math.max(...winningTrades.map(t => t.profit)) : 0,
      largestLoss: losingTrades.length > 0 ? Math.min(...losingTrades.map(t => t.profit)) : 0,
      trades,
      equityCurve,
    };
  }

  generateHistoricalData(
    days: number,
    initialPrice: number = 100,
    volatility: number = 0.02
  ): HistoricalBar[] {
    const bars: HistoricalBar[] = [];
    let currentPrice = initialPrice;

    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    for (let i = 0; i < days; i++) {
      const timestamp = now - (days - i) * oneDayMs;

      const change = (Math.random() - 0.5) * 2 * volatility * currentPrice;
      const open = currentPrice;
      const close = currentPrice + change;

      const high = Math.max(open, close) * (1 + Math.random() * volatility);
      const low = Math.min(open, close) * (1 - Math.random() * volatility);

      bars.push({
        timestamp,
        open,
        high,
        low,
        close,
        volume: Math.floor(Math.random() * 1000000) + 100000,
      });

      currentPrice = close;
    }

    return bars;
  }
}

export const backtestingEngine = new BacktestingEngine();

export const predefinedStrategies: TradingStrategy[] = [
  {
    name: 'SMA Crossover',
    description: 'Buy when fast SMA crosses above slow SMA, sell when it crosses below',
    parameters: { fastPeriod: 20, slowPeriod: 50 },
    shouldEnter: (data, indicators) => {
      if (indicators.SMA_FAST && indicators.SMA_SLOW && data.length > 1) {
        const fastSMA = indicators.SMA_FAST;
        const slowSMA = indicators.SMA_SLOW;
        const prevIdx = fastSMA.length - 2;
        const currIdx = fastSMA.length - 1;

        return (
          !isNaN(fastSMA[prevIdx]) &&
          !isNaN(slowSMA[prevIdx]) &&
          fastSMA[prevIdx] <= slowSMA[prevIdx] &&
          fastSMA[currIdx] > slowSMA[currIdx]
        );
      }
      return false;
    },
    shouldExit: (data, indicators, entryPrice) => {
      if (indicators.SMA_FAST && indicators.SMA_SLOW && data.length > 1) {
        const fastSMA = indicators.SMA_FAST;
        const slowSMA = indicators.SMA_SLOW;
        const prevIdx = fastSMA.length - 2;
        const currIdx = fastSMA.length - 1;

        return (
          !isNaN(fastSMA[prevIdx]) &&
          !isNaN(slowSMA[prevIdx]) &&
          fastSMA[prevIdx] >= slowSMA[prevIdx] &&
          fastSMA[currIdx] < slowSMA[currIdx]
        );
      }
      return false;
    },
  },
  {
    name: 'RSI Mean Reversion',
    description: 'Buy when RSI is oversold (<30), sell when RSI is overbought (>70)',
    parameters: { period: 14, oversold: 30, overbought: 70 },
    shouldEnter: (data, indicators) => {
      if (indicators.RSI) {
        const rsi = indicators.RSI;
        const currentRSI = rsi[rsi.length - 1];
        return !isNaN(currentRSI) && currentRSI < 30;
      }
      return false;
    },
    shouldExit: (data, indicators, entryPrice) => {
      if (indicators.RSI) {
        const rsi = indicators.RSI;
        const currentRSI = rsi[rsi.length - 1];
        return !isNaN(currentRSI) && currentRSI > 70;
      }
      return false;
    },
  },
];
