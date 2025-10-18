import { Position } from '@/types/trading';
import { MarketData } from '@/types/market';

export const calculateUnrealizedPnL = (
  position: Position,
  currentPrice: number
): number => {
  if (position.quantity === 0) return 0;
  
  const priceDiff = currentPrice - position.averagePrice;
  return priceDiff * position.quantity;
};

export const calculateRealizedPnL = (
  avgCostBasis: number,
  sellPrice: number,
  quantity: number
): number => {
  return (sellPrice - avgCostBasis) * quantity;
};

export const calculateVWAP = (
  trades: Array<{ price: number; quantity: number }>
): number => {
  if (trades.length === 0) return 0;
  
  const totalValue = trades.reduce((sum, trade) => sum + (trade.price * trade.quantity), 0);
  const totalVolume = trades.reduce((sum, trade) => sum + trade.quantity, 0);
  
  return totalVolume > 0 ? totalValue / totalVolume : 0;
};

export const calculateTWAP = (
  prices: Array<{ price: number; timestamp: number }>,
  startTime: number,
  endTime: number
): number => {
  const relevantPrices = prices.filter(p => p.timestamp >= startTime && p.timestamp <= endTime);
  
  if (relevantPrices.length === 0) return 0;
  
  return relevantPrices.reduce((sum, p) => sum + p.price, 0) / relevantPrices.length;
};

export const calculateVolatility = (
  prices: number[],
  periods: number = 20
): number => {
  if (prices.length < periods + 1) return 0;
  
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push(Math.log(prices[i] / prices[i - 1]));
  }
  
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  
  return Math.sqrt(variance * 252); // Annualized volatility
};

export const calculateBeta = (
  assetReturns: number[],
  marketReturns: number[]
): number => {
  if (assetReturns.length !== marketReturns.length || assetReturns.length < 2) {
    return 1; // Default beta
  }
  
  const assetMean = assetReturns.reduce((sum, r) => sum + r, 0) / assetReturns.length;
  const marketMean = marketReturns.reduce((sum, r) => sum + r, 0) / marketReturns.length;
  
  let covariance = 0;
  let marketVariance = 0;
  
  for (let i = 0; i < assetReturns.length; i++) {
    covariance += (assetReturns[i] - assetMean) * (marketReturns[i] - marketMean);
    marketVariance += Math.pow(marketReturns[i] - marketMean, 2);
  }
  
  return marketVariance > 0 ? covariance / marketVariance : 1;
};

export const calculateSharpeRatio = (
  returns: number[],
  riskFreeRate: number = 0.02 // 2% annual risk-free rate
): number => {
  if (returns.length === 0) return 0;
  
  const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const excessReturn = meanReturn - (riskFreeRate / 252); // Daily risk-free rate
  
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  
  return stdDev > 0 ? excessReturn / stdDev : 0;
};

export const calculateVaR = (
  returns: number[],
  confidenceLevel: number = 0.95
): number => {
  if (returns.length === 0) return 0;
  
  const sortedReturns = [...returns].sort((a, b) => a - b);
  const index = Math.floor((1 - confidenceLevel) * sortedReturns.length);
  
  return sortedReturns[index] || 0;
};

export const calculateMaxDrawdown = (prices: number[]): number => {
  if (prices.length < 2) return 0;
  
  let maxDrawdown = 0;
  let peak = prices[0];
  
  for (let i = 1; i < prices.length; i++) {
    if (prices[i] > peak) {
      peak = prices[i];
    } else {
      const drawdown = (peak - prices[i]) / peak;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
  }
  
  return maxDrawdown;
};

// Options Greeks calculations (Black-Scholes approximations)
export const calculateDelta = (
  spotPrice: number,
  strikePrice: number,
  timeToExpiry: number,
  riskFreeRate: number,
  volatility: number,
  isCall: boolean = true
): number => {
  const d1 = calculateD1(spotPrice, strikePrice, timeToExpiry, riskFreeRate, volatility);
  const N = normalCDF;
  
  if (isCall) {
    return N(d1);
  } else {
    return N(d1) - 1;
  }
};

export const calculateGamma = (
  spotPrice: number,
  strikePrice: number,
  timeToExpiry: number,
  riskFreeRate: number,
  volatility: number
): number => {
  const d1 = calculateD1(spotPrice, strikePrice, timeToExpiry, riskFreeRate, volatility);
  const phi = normalPDF;
  
  return phi(d1) / (spotPrice * volatility * Math.sqrt(timeToExpiry));
};

export const calculateTheta = (
  spotPrice: number,
  strikePrice: number,
  timeToExpiry: number,
  riskFreeRate: number,
  volatility: number,
  isCall: boolean = true
): number => {
  const d1 = calculateD1(spotPrice, strikePrice, timeToExpiry, riskFreeRate, volatility);
  const d2 = d1 - volatility * Math.sqrt(timeToExpiry);
  const N = normalCDF;
  const phi = normalPDF;
  
  const term1 = -(spotPrice * phi(d1) * volatility) / (2 * Math.sqrt(timeToExpiry));
  
  if (isCall) {
    const term2 = riskFreeRate * strikePrice * Math.exp(-riskFreeRate * timeToExpiry) * N(d2);
    return (term1 - term2) / 365;
  } else {
    const term2 = riskFreeRate * strikePrice * Math.exp(-riskFreeRate * timeToExpiry) * N(-d2);
    return (term1 + term2) / 365;
  }
};

// Helper functions for options calculations
const calculateD1 = (
  spotPrice: number,
  strikePrice: number,
  timeToExpiry: number,
  riskFreeRate: number,
  volatility: number
): number => {
  return (Math.log(spotPrice / strikePrice) + (riskFreeRate + 0.5 * volatility ** 2) * timeToExpiry) / 
         (volatility * Math.sqrt(timeToExpiry));
};

const normalCDF = (x: number): number => {
  return 0.5 * (1 + erf(x / Math.sqrt(2)));
};

const normalPDF = (x: number): number => {
  return Math.exp(-0.5 * x ** 2) / Math.sqrt(2 * Math.PI);
};

const erf = (x: number): number => {
  // Approximation of the error function
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;
  
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);
  
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  
  return sign * y;
};
