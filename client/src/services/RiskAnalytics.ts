import { Position } from '@/types/trading';

export interface VaRResult {
  confidenceLevel: number;
  valueAtRisk: number;
  expectedShortfall: number;
  method: 'historical' | 'parametric' | 'monte-carlo';
}

export interface StressTestScenario {
  name: string;
  description: string;
  marketShock: number;
  volatilityShock: number;
  estimatedLoss: number;
}

export interface RiskMetrics {
  var95: number;
  var99: number;
  expectedShortfall: number;
  sharpeRatio: number;
  maximumDrawdown: number;
  beta: number;
  volatility: number;
  concentrationRisk: number;
  liquidityRisk: number;
}

export interface PortfolioRisk {
  totalValue: number;
  totalExposure: number;
  longExposure: number;
  shortExposure: number;
  netExposure: number;
  leverage: number;
  diversificationRatio: number;
}

export class RiskAnalytics {
  calculateHistoricalVaR(
    returns: number[],
    confidenceLevel: number = 0.95,
    portfolioValue: number = 100000
  ): VaRResult {
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const index = Math.floor((1 - confidenceLevel) * sortedReturns.length);
    const var Value = -sortedReturns[index] * portfolioValue;

    const tailReturns = sortedReturns.slice(0, index);
    const expectedShortfall =
      tailReturns.length > 0
        ? (-tailReturns.reduce((sum, r) => sum + r, 0) / tailReturns.length) * portfolioValue
        : varValue;

    return {
      confidenceLevel,
      valueAtRisk: varValue,
      expectedShortfall,
      method: 'historical',
    };
  }

  calculateParametricVaR(
    mean: number,
    stdDev: number,
    confidenceLevel: number = 0.95,
    portfolioValue: number = 100000
  ): VaRResult {
    const zScore = confidenceLevel === 0.95 ? 1.645 : confidenceLevel === 0.99 ? 2.326 : 1.96;

    const varValue = portfolioValue * (mean - zScore * stdDev);

    const expectedShortfall = portfolioValue * (mean - stdDev * this.normalPDF(zScore) / (1 - confidenceLevel));

    return {
      confidenceLevel,
      valueAtRisk: Math.abs(varValue),
      expectedShortfall: Math.abs(expectedShortfall),
      method: 'parametric',
    };
  }

  calculateMonteCarloVaR(
    mean: number,
    stdDev: number,
    portfolioValue: number = 100000,
    simulations: number = 10000,
    confidenceLevel: number = 0.95
  ): VaRResult {
    const returns: number[] = [];

    for (let i = 0; i < simulations; i++) {
      const randomReturn = this.generateNormalRandom(mean, stdDev);
      returns.push(randomReturn * portfolioValue);
    }

    return this.calculateHistoricalVaR(
      returns.map(r => r / portfolioValue),
      confidenceLevel,
      portfolioValue
    );
  }

  private normalPDF(x: number): number {
    return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
  }

  private generateNormalRandom(mean: number, stdDev: number): number {
    let u = 0,
      v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();

    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return z * stdDev + mean;
  }

  performStressTest(
    positions: Position[],
    marketPrices: Map<string, number>
  ): StressTestScenario[] {
    const scenarios: StressTestScenario[] = [
      {
        name: 'Market Crash (-20%)',
        description: '2008-style market crash with significant price drops',
        marketShock: -0.20,
        volatilityShock: 2.0,
        estimatedLoss: 0,
      },
      {
        name: 'Flash Crash (-10%)',
        description: 'Sudden intraday market drop',
        marketShock: -0.10,
        volatilityShock: 3.0,
        estimatedLoss: 0,
      },
      {
        name: 'Black Swan (-30%)',
        description: 'Extreme tail event with massive losses',
        marketShock: -0.30,
        volatilityShock: 4.0,
        estimatedLoss: 0,
      },
      {
        name: 'Volatility Spike',
        description: 'Increased market volatility without directional bias',
        marketShock: 0,
        volatilityShock: 2.5,
        estimatedLoss: 0,
      },
      {
        name: 'Bull Rally (+15%)',
        description: 'Strong market rally',
        marketShock: 0.15,
        volatilityShock: 0.8,
        estimatedLoss: 0,
      },
      {
        name: 'Sector Rotation (-15% / +10%)',
        description: 'Major shift between sectors',
        marketShock: -0.05,
        volatilityShock: 1.5,
        estimatedLoss: 0,
      },
    ];

    scenarios.forEach(scenario => {
      let totalLoss = 0;

      positions.forEach(position => {
        const currentPrice = marketPrices.get(position.symbol) || position.averagePrice;
        const stressPrice = currentPrice * (1 + scenario.marketShock);

        const currentValue = position.quantity * currentPrice;
        const stressValue = position.quantity * stressPrice;
        const loss = stressValue - currentValue;

        totalLoss += loss;
      });

      scenario.estimatedLoss = totalLoss;
    });

    return scenarios.sort((a, b) => a.estimatedLoss - b.estimatedLoss);
  }

  calculateSharpeRatio(
    returns: number[],
    riskFreeRate: number = 0.02
  ): number {
    if (returns.length === 0) return 0;

    const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance =
      returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) return 0;

    const excessReturn = meanReturn - riskFreeRate / 252;
    return excessReturn / stdDev;
  }

  calculateMaximumDrawdown(portfolioValues: number[]): number {
    if (portfolioValues.length < 2) return 0;

    let maxDrawdown = 0;
    let peak = portfolioValues[0];

    for (const value of portfolioValues) {
      if (value > peak) {
        peak = value;
      }

      const drawdown = (peak - value) / peak;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    return maxDrawdown;
  }

  calculateBeta(
    assetReturns: number[],
    marketReturns: number[]
  ): number {
    if (assetReturns.length !== marketReturns.length || assetReturns.length === 0) {
      return 1.0;
    }

    const meanAsset = assetReturns.reduce((sum, r) => sum + r, 0) / assetReturns.length;
    const meanMarket = marketReturns.reduce((sum, r) => sum + r, 0) / marketReturns.length;

    let covariance = 0;
    let marketVariance = 0;

    for (let i = 0; i < assetReturns.length; i++) {
      covariance += (assetReturns[i] - meanAsset) * (marketReturns[i] - meanMarket);
      marketVariance += Math.pow(marketReturns[i] - meanMarket, 2);
    }

    if (marketVariance === 0) return 1.0;

    return covariance / marketVariance;
  }

  calculateVolatility(returns: number[], annualizationFactor: number = 252): number {
    if (returns.length === 0) return 0;

    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance =
      returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;

    return Math.sqrt(variance * annualizationFactor);
  }

  calculateConcentrationRisk(positions: Position[]): number {
    if (positions.length === 0) return 0;

    const totalValue = positions.reduce((sum, pos) => sum + Math.abs(pos.marketValue), 0);

    if (totalValue === 0) return 0;

    const weights = positions.map(pos => Math.abs(pos.marketValue) / totalValue);

    const herfindahlIndex = weights.reduce((sum, w) => sum + w * w, 0);

    return herfindahlIndex;
  }

  calculateLiquidityRisk(
    positions: Position[],
    averageDailyVolumes: Map<string, number>,
    marketPrices: Map<string, number>
  ): number {
    let totalLiquidityScore = 0;
    let totalValue = 0;

    positions.forEach(position => {
      const dailyVolume = averageDailyVolumes.get(position.symbol) || 1000000;
      const currentPrice = marketPrices.get(position.symbol) || position.averagePrice;
      const positionValue = Math.abs(position.quantity * currentPrice);

      const dailyVolumeValue = dailyVolume * currentPrice;

      const liquidityRatio = dailyVolumeValue > 0 ? positionValue / dailyVolumeValue : 1;

      const daysToLiquidate = Math.min(liquidityRatio * 5, 20);

      totalLiquidityScore += daysToLiquidate * positionValue;
      totalValue += positionValue;
    });

    return totalValue > 0 ? totalLiquidityScore / totalValue : 0;
  }

  calculatePortfolioRisk(
    positions: Position[],
    marketPrices: Map<string, number>
  ): PortfolioRisk {
    let longExposure = 0;
    let shortExposure = 0;
    let totalValue = 0;

    positions.forEach(position => {
      const currentPrice = marketPrices.get(position.symbol) || position.averagePrice;
      const positionValue = position.quantity * currentPrice;

      totalValue += Math.abs(positionValue);

      if (positionValue > 0) {
        longExposure += positionValue;
      } else {
        shortExposure += Math.abs(positionValue);
      }
    });

    const netExposure = longExposure - shortExposure;
    const totalExposure = longExposure + shortExposure;
    const leverage = totalValue > 0 ? totalExposure / totalValue : 1;

    const uniqueSymbols = new Set(positions.map(p => p.symbol)).size;
    const diversificationRatio = positions.length > 0 ? uniqueSymbols / positions.length : 1;

    return {
      totalValue,
      totalExposure,
      longExposure,
      shortExposure,
      netExposure,
      leverage,
      diversificationRatio,
    };
  }

  generateRiskReport(
    positions: Position[],
    returns: number[],
    marketPrices: Map<string, number>,
    marketReturns: number[],
    portfolioValues: number[]
  ): RiskMetrics {
    const portfolioValue = positions.reduce((sum, pos) => {
      const price = marketPrices.get(pos.symbol) || pos.averagePrice;
      return sum + Math.abs(pos.quantity * price);
    }, 0);

    const var95 = this.calculateHistoricalVaR(returns, 0.95, portfolioValue).valueAtRisk;
    const var99 = this.calculateHistoricalVaR(returns, 0.99, portfolioValue).valueAtRisk;
    const expectedShortfall = this.calculateHistoricalVaR(returns, 0.95, portfolioValue).expectedShortfall;

    const sharpeRatio = this.calculateSharpeRatio(returns);
    const maximumDrawdown = this.calculateMaximumDrawdown(portfolioValues);
    const beta = this.calculateBeta(returns, marketReturns);
    const volatility = this.calculateVolatility(returns);

    const concentrationRisk = this.calculateConcentrationRisk(positions);

    const mockVolumes = new Map(
      Array.from(marketPrices.keys()).map(symbol => [symbol, 1000000])
    );
    const liquidityRisk = this.calculateLiquidityRisk(positions, mockVolumes, marketPrices);

    return {
      var95,
      var99,
      expectedShortfall,
      sharpeRatio,
      maximumDrawdown,
      beta,
      volatility,
      concentrationRisk,
      liquidityRisk,
    };
  }
}

export const riskAnalytics = new RiskAnalytics();
