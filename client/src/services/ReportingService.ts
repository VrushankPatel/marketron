import { Order, Trade, Position } from '@/types/trading';
import { BacktestResult } from './BacktestingEngine';
import { RiskMetrics } from './RiskAnalytics';
import { SettlementInstruction, MarginCall } from './ClearingSettlementService';

export interface TradeCaptureReport {
  reportId: string;
  reportDate: number;
  trades: Trade[];
  totalTrades: number;
  totalVolume: number;
  totalValue: number;
  bySymbol: Record<string, { count: number; volume: number; value: number }>;
  bySide: { buy: number; sell: number };
  avgTradeSize: number;
}

export interface ExecutionReport {
  reportId: string;
  reportDate: number;
  orders: Order[];
  totalOrders: number;
  filledOrders: number;
  partiallyFilledOrders: number;
  cancelledOrders: number;
  rejectedOrders: number;
  fillRate: number;
  avgFillTime: number;
  bestExecution: number;
}

export interface PositionReport {
  reportId: string;
  reportDate: number;
  positions: Position[];
  totalPositions: number;
  longPositions: number;
  shortPositions: number;
  totalValue: number;
  unrealizedPnL: number;
  realizedPnL: number;
  topGainers: Array<{ symbol: string; pnl: number; percent: number }>;
  topLosers: Array<{ symbol: string; pnl: number; percent: number }>;
}

export interface PnLReport {
  reportId: string;
  reportDate: number;
  startDate: number;
  endDate: number;
  startingBalance: number;
  endingBalance: number;
  realizedPnL: number;
  unrealizedPnL: number;
  totalPnL: number;
  dailyPnL: Array<{ date: number; pnl: number }>;
  monthlyPnL: Array<{ month: string; pnl: number }>;
  bySymbol: Record<string, number>;
  returnOnCapital: number;
}

export interface RiskReport {
  reportId: string;
  reportDate: number;
  riskMetrics: RiskMetrics;
  exposureAnalysis: {
    totalExposure: number;
    longExposure: number;
    shortExposure: number;
    netExposure: number;
    leverage: number;
  };
  concentrationRisk: Array<{ symbol: string; exposure: number; percentage: number }>;
  stressTestResults: any[];
  recommendations: string[];
}

export interface RegulatoryReport {
  reportId: string;
  reportDate: number;
  reportType: 'MIFID_II' | 'CAT' | 'EMIR' | 'REGULATORY_SUMMARY';
  period: { start: number; end: number };
  data: any;
  compliance: {
    status: 'COMPLIANT' | 'NON_COMPLIANT' | 'UNDER_REVIEW';
    issues: string[];
    warnings: string[];
  };
}

export class ReportingService {
  generateTradeCaptureReport(
    trades: Trade[],
    startDate?: number,
    endDate?: number
  ): TradeCaptureReport {
    const filteredTrades = this.filterByDateRange(trades, startDate, endDate);

    const bySymbol: Record<string, { count: number; volume: number; value: number }> = {};
    let totalVolume = 0;
    let totalValue = 0;
    let buyCount = 0;
    let sellCount = 0;

    filteredTrades.forEach(trade => {
      if (!bySymbol[trade.symbol]) {
        bySymbol[trade.symbol] = { count: 0, volume: 0, value: 0 };
      }

      bySymbol[trade.symbol].count++;
      bySymbol[trade.symbol].volume += trade.quantity;
      bySymbol[trade.symbol].value += trade.quantity * trade.price;

      totalVolume += trade.quantity;
      totalValue += trade.quantity * trade.price;

      if (trade.side === 'BUY') buyCount++;
      else sellCount++;
    });

    return {
      reportId: `TCR_${Date.now()}`,
      reportDate: Date.now(),
      trades: filteredTrades,
      totalTrades: filteredTrades.length,
      totalVolume,
      totalValue,
      bySymbol,
      bySide: { buy: buyCount, sell: sellCount },
      avgTradeSize: filteredTrades.length > 0 ? totalVolume / filteredTrades.length : 0,
    };
  }

  generateExecutionReport(orders: Order[]): ExecutionReport {
    const filledOrders = orders.filter(o => o.status === 'FILLED');
    const partiallyFilledOrders = orders.filter(o => o.status === 'PARTIALLY_FILLED');
    const cancelledOrders = orders.filter(o => o.status === 'CANCELLED');
    const rejectedOrders = orders.filter(o => o.status === 'REJECTED');

    const fillRate =
      orders.length > 0 ? ((filledOrders.length + partiallyFilledOrders.length) / orders.length) * 100 : 0;

    const fillTimes = filledOrders
      .filter(o => o.lastUpdateTime && o.timestamp)
      .map(o => o.lastUpdateTime - o.timestamp);

    const avgFillTime = fillTimes.length > 0 ? fillTimes.reduce((a, b) => a + b, 0) / fillTimes.length : 0;

    const executionQuality = filledOrders
      .filter(o => o.price && o.avgFillPrice)
      .map(o => {
        const slippage = Math.abs((o.avgFillPrice - (o.price || 0)) / (o.price || 1));
        return slippage;
      });

    const bestExecution =
      executionQuality.length > 0
        ? (1 - executionQuality.reduce((a, b) => a + b, 0) / executionQuality.length) * 100
        : 100;

    return {
      reportId: `EXR_${Date.now()}`,
      reportDate: Date.now(),
      orders,
      totalOrders: orders.length,
      filledOrders: filledOrders.length,
      partiallyFilledOrders: partiallyFilledOrders.length,
      cancelledOrders: cancelledOrders.length,
      rejectedOrders: rejectedOrders.length,
      fillRate,
      avgFillTime,
      bestExecution,
    };
  }

  generatePositionReport(positions: Position[], marketPrices: Map<string, number>): PositionReport {
    const longPositions = positions.filter(p => p.side === 'LONG');
    const shortPositions = positions.filter(p => p.side === 'SHORT');

    const totalValue = positions.reduce((sum, p) => sum + p.marketValue, 0);
    const unrealizedPnL = positions.reduce((sum, p) => sum + p.unrealizedPnL, 0);
    const realizedPnL = positions.reduce((sum, p) => sum + p.realizedPnL, 0);

    const positionsWithPercent = positions.map(p => ({
      symbol: p.symbol,
      pnl: p.unrealizedPnL + p.realizedPnL,
      percent: p.averagePrice > 0 ? ((p.unrealizedPnL + p.realizedPnL) / (p.quantity * p.averagePrice)) * 100 : 0,
    }));

    const topGainers = positionsWithPercent
      .filter(p => p.pnl > 0)
      .sort((a, b) => b.pnl - a.pnl)
      .slice(0, 5);

    const topLosers = positionsWithPercent
      .filter(p => p.pnl < 0)
      .sort((a, b) => a.pnl - b.pnl)
      .slice(0, 5);

    return {
      reportId: `PSR_${Date.now()}`,
      reportDate: Date.now(),
      positions,
      totalPositions: positions.length,
      longPositions: longPositions.length,
      shortPositions: shortPositions.length,
      totalValue,
      unrealizedPnL,
      realizedPnL,
      topGainers,
      topLosers,
    };
  }

  generatePnLReport(
    trades: Trade[],
    positions: Position[],
    startingBalance: number,
    startDate: number,
    endDate: number
  ): PnLReport {
    const filteredTrades = this.filterByDateRange(trades, startDate, endDate);

    const realizedPnL = filteredTrades.reduce((sum, trade) => {
      return sum + (trade.side === 'BUY' ? -1 : 1) * trade.quantity * trade.price;
    }, 0);

    const unrealizedPnL = positions.reduce((sum, p) => sum + p.unrealizedPnL, 0);
    const totalPnL = realizedPnL + unrealizedPnL;

    const endingBalance = startingBalance + totalPnL;

    const dailyPnL = this.calculateDailyPnL(filteredTrades, startDate, endDate);
    const monthlyPnL = this.calculateMonthlyPnL(dailyPnL);

    const bySymbol: Record<string, number> = {};
    filteredTrades.forEach(trade => {
      if (!bySymbol[trade.symbol]) bySymbol[trade.symbol] = 0;
      bySymbol[trade.symbol] += (trade.side === 'BUY' ? -1 : 1) * trade.quantity * trade.price;
    });

    positions.forEach(pos => {
      if (!bySymbol[pos.symbol]) bySymbol[pos.symbol] = 0;
      bySymbol[pos.symbol] += pos.unrealizedPnL;
    });

    const returnOnCapital = startingBalance > 0 ? (totalPnL / startingBalance) * 100 : 0;

    return {
      reportId: `PNL_${Date.now()}`,
      reportDate: Date.now(),
      startDate,
      endDate,
      startingBalance,
      endingBalance,
      realizedPnL,
      unrealizedPnL,
      totalPnL,
      dailyPnL,
      monthlyPnL,
      bySymbol,
      returnOnCapital,
    };
  }

  generateRiskReport(
    positions: Position[],
    riskMetrics: RiskMetrics,
    marketPrices: Map<string, number>,
    stressTestResults: any[]
  ): RiskReport {
    let totalExposure = 0;
    let longExposure = 0;
    let shortExposure = 0;

    positions.forEach(pos => {
      const exposure = Math.abs(pos.marketValue);
      totalExposure += exposure;

      if (pos.side === 'LONG') longExposure += exposure;
      else if (pos.side === 'SHORT') shortExposure += exposure;
    });

    const netExposure = longExposure - shortExposure;
    const leverage = totalExposure > 0 ? totalExposure / (totalExposure - netExposure) : 1;

    const concentrationRisk = positions
      .map(pos => ({
        symbol: pos.symbol,
        exposure: Math.abs(pos.marketValue),
        percentage: totalExposure > 0 ? (Math.abs(pos.marketValue) / totalExposure) * 100 : 0,
      }))
      .sort((a, b) => b.exposure - a.exposure)
      .slice(0, 10);

    const recommendations: string[] = [];

    if (riskMetrics.concentrationRisk > 0.3) {
      recommendations.push('High concentration risk detected. Consider diversifying portfolio.');
    }

    if (riskMetrics.liquidityRisk > 10) {
      recommendations.push('Liquidity risk is elevated. Some positions may be difficult to exit quickly.');
    }

    if (leverage > 2) {
      recommendations.push('Leverage ratio is high. Consider reducing exposure to manage risk.');
    }

    if (riskMetrics.var95 > totalExposure * 0.1) {
      recommendations.push('Value at Risk exceeds 10% of portfolio. Review risk limits.');
    }

    return {
      reportId: `RSK_${Date.now()}`,
      reportDate: Date.now(),
      riskMetrics,
      exposureAnalysis: {
        totalExposure,
        longExposure,
        shortExposure,
        netExposure,
        leverage,
      },
      concentrationRisk,
      stressTestResults,
      recommendations,
    };
  }

  generateRegulatoryReport(
    trades: Trade[],
    orders: Order[],
    reportType: 'MIFID_II' | 'CAT' | 'EMIR' | 'REGULATORY_SUMMARY',
    startDate: number,
    endDate: number
  ): RegulatoryReport {
    const filteredTrades = this.filterByDateRange(trades, startDate, endDate);

    let reportData: any = {};
    const issues: string[] = [];
    const warnings: string[] = [];

    switch (reportType) {
      case 'MIFID_II':
        reportData = this.generateMiFIDReport(filteredTrades, orders);
        break;
      case 'CAT':
        reportData = this.generateCATReport(filteredTrades, orders);
        break;
      case 'EMIR':
        reportData = this.generateEMIRReport(filteredTrades);
        break;
      case 'REGULATORY_SUMMARY':
        reportData = this.generateRegulatorySummary(filteredTrades, orders);
        break;
    }

    const complianceStatus = issues.length === 0 ? 'COMPLIANT' : 'NON_COMPLIANT';

    return {
      reportId: `REG_${Date.now()}`,
      reportDate: Date.now(),
      reportType,
      period: { start: startDate, end: endDate },
      data: reportData,
      compliance: {
        status: complianceStatus,
        issues,
        warnings,
      },
    };
  }

  private generateMiFIDReport(trades: Trade[], orders: Order[]): any {
    return {
      reportingEntity: 'TRADEFLOW_SIMULATOR',
      tradingVenue: 'SIMULATED_EXCHANGE',
      totalTransactions: trades.length,
      totalOrders: orders.length,
      bestExecutionAnalysis: {
        averageSlippage: 0.05,
        priceImprovements: trades.filter((_, i) => i % 3 === 0).length,
      },
      clientIdentification: 'CLIENT_001',
      instrumentReports: trades.map(trade => ({
        tradeId: trade.id,
        instrumentId: trade.symbol,
        quantity: trade.quantity,
        price: trade.price,
        timestamp: trade.timestamp,
        venue: 'SIMULATED_EXCHANGE',
      })),
    };
  }

  private generateCATReport(trades: Trade[], orders: Order[]): any {
    return {
      reportingFirm: 'TRADEFLOW_SIM',
      reportDate: Date.now(),
      orderEvents: orders.map(order => ({
        orderId: order.id,
        eventType: 'NEW_ORDER',
        timestamp: order.timestamp,
        symbol: order.symbol,
        quantity: order.quantity,
        price: order.price,
        side: order.side,
      })),
      tradeReports: trades.map(trade => ({
        tradeId: trade.id,
        orderId: trade.orderId,
        executionTimestamp: trade.timestamp,
        symbol: trade.symbol,
        quantity: trade.quantity,
        price: trade.price,
      })),
    };
  }

  private generateEMIRReport(trades: Trade[]): any {
    return {
      reportingCounterparty: 'TRADEFLOW',
      reportDate: Date.now(),
      derivatives: [],
      nonDerivatives: trades.map(trade => ({
        tradeId: trade.id,
        assetClass: 'EQUITY',
        instrument: trade.symbol,
        notionalAmount: trade.quantity * trade.price,
        executionTimestamp: trade.timestamp,
      })),
    };
  }

  private generateRegulatorySummary(trades: Trade[], orders: Order[]): any {
    return {
      totalOrders: orders.length,
      totalTrades: trades.length,
      totalVolume: trades.reduce((sum, t) => sum + t.quantity, 0),
      totalValue: trades.reduce((sum, t) => sum + t.quantity * t.price, 0),
      uniqueInstruments: new Set(trades.map(t => t.symbol)).size,
      averageTradeSize: trades.length > 0 ? trades.reduce((sum, t) => sum + t.quantity, 0) / trades.length : 0,
    };
  }

  private filterByDateRange<T extends { timestamp: number }>(
    items: T[],
    startDate?: number,
    endDate?: number
  ): T[] {
    if (!startDate && !endDate) return items;

    return items.filter(item => {
      if (startDate && item.timestamp < startDate) return false;
      if (endDate && item.timestamp > endDate) return false;
      return true;
    });
  }

  private calculateDailyPnL(
    trades: Trade[],
    startDate: number,
    endDate: number
  ): Array<{ date: number; pnl: number }> {
    const dailyMap = new Map<string, number>();

    trades.forEach(trade => {
      const dateKey = new Date(trade.timestamp).toISOString().split('T')[0];
      const pnl = (trade.side === 'BUY' ? -1 : 1) * trade.quantity * trade.price;

      dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + pnl);
    });

    return Array.from(dailyMap.entries())
      .map(([date, pnl]) => ({ date: new Date(date).getTime(), pnl }))
      .sort((a, b) => a.date - b.date);
  }

  private calculateMonthlyPnL(dailyPnL: Array<{ date: number; pnl: number }>): Array<{ month: string; pnl: number }> {
    const monthlyMap = new Map<string, number>();

    dailyPnL.forEach(day => {
      const monthKey = new Date(day.date).toISOString().slice(0, 7);
      monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + day.pnl);
    });

    return Array.from(monthlyMap.entries())
      .map(([month, pnl]) => ({ month, pnl }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  exportReportToJSON(report: any): string {
    return JSON.stringify(report, null, 2);
  }

  exportReportToCSV(report: any, dataKey: string): string {
    const data = report[dataKey];
    if (!Array.isArray(data) || data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const rows = data.map(item =>
      headers.map(header => {
        const value = item[header];
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      }).join(',')
    );

    return [headers.join(','), ...rows].join('\n');
  }
}

export const reportingService = new ReportingService();
