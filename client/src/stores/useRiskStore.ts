import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface RiskMetrics {
  var95: number;
  var99: number;
  beta: number;
  sharpeRatio: number;
  maxDrawdown: number;
  volatility: number;
}

interface RiskLimits {
  maxPositionSize: number;
  maxDailyLoss: number;
  maxOrderSize: number;
  maxConcentration: number;
  varLimit: number;
}

interface RiskState {
  metrics: RiskMetrics;
  limits: RiskLimits;
  breaches: Array<{
    type: string;
    message: string;
    timestamp: number;
    severity: 'WARNING' | 'CRITICAL';
  }>;
  
  // Actions
  updateMetrics: (metrics: Partial<RiskMetrics>) => void;
  updateLimits: (limits: Partial<RiskLimits>) => void;
  checkLimits: (positionValue: number, dailyPnL: number) => boolean;
  addBreach: (breach: RiskState['breaches'][0]) => void;
  clearBreaches: () => void;
}

export const useRiskStore = create<RiskState>()(
  subscribeWithSelector((set, get) => ({
    metrics: {
      var95: 0,
      var99: 0,
      beta: 1,
      sharpeRatio: 0,
      maxDrawdown: 0,
      volatility: 0,
    },
    
    limits: {
      maxPositionSize: 100000,
      maxDailyLoss: 5000,
      maxOrderSize: 10000,
      maxConcentration: 0.2,
      varLimit: 10000,
    },
    
    breaches: [],
    
    updateMetrics: (newMetrics) => {
      set(state => ({
        metrics: { ...state.metrics, ...newMetrics }
      }));
    },
    
    updateLimits: (newLimits) => {
      set(state => ({
        limits: { ...state.limits, ...newLimits }
      }));
    },
    
    checkLimits: (positionValue, dailyPnL) => {
      const { limits } = get();
      let hasViolation = false;
      
      if (Math.abs(positionValue) > limits.maxPositionSize) {
        get().addBreach({
          type: 'POSITION_SIZE',
          message: `Position size ${positionValue.toLocaleString()} exceeds limit ${limits.maxPositionSize.toLocaleString()}`,
          timestamp: Date.now(),
          severity: 'CRITICAL',
        });
        hasViolation = true;
      }
      
      if (dailyPnL < -limits.maxDailyLoss) {
        get().addBreach({
          type: 'DAILY_LOSS',
          message: `Daily loss ${Math.abs(dailyPnL).toLocaleString()} exceeds limit ${limits.maxDailyLoss.toLocaleString()}`,
          timestamp: Date.now(),
          severity: 'CRITICAL',
        });
        hasViolation = true;
      }
      
      return !hasViolation;
    },
    
    addBreach: (breach) => {
      set(state => ({
        breaches: [...state.breaches, breach].slice(-50) // Keep last 50 breaches
      }));
    },
    
    clearBreaches: () => {
      set({ breaches: [] });
    },
  }))
);
