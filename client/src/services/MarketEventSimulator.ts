import { useMarketDataStore } from '@/stores/useMarketDataStore';

export type MarketEventType =
  | 'MARKET_CRASH'
  | 'FLASH_CRASH'
  | 'VOLATILITY_SPIKE'
  | 'BULL_RALLY'
  | 'NEWS_EVENT'
  | 'EARNINGS_RELEASE'
  | 'FED_ANNOUNCEMENT'
  | 'SECTOR_ROTATION'
  | 'LIQUIDITY_CRISIS'
  | 'CIRCUIT_BREAKER';

export interface MarketEvent {
  id: string;
  type: MarketEventType;
  name: string;
  description: string;
  timestamp: number;
  duration: number;
  priceImpact: number;
  volatilityMultiplier: number;
  affectedSymbols: string[];
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
}

export interface EventScenario {
  name: string;
  description: string;
  events: Omit<MarketEvent, 'id' | 'timestamp'>[];
}

export class MarketEventSimulator {
  private activeEvents: Map<string, MarketEvent> = new Map();
  private eventHistory: MarketEvent[] = [];
  private simulationInterval: NodeJS.Timeout | null = null;

  private predefinedScenarios: EventScenario[] = [
    {
      name: '2008 Financial Crisis',
      description: 'Simulates the 2008 global financial crisis with cascading market crashes',
      events: [
        {
          type: 'NEWS_EVENT',
          name: 'Lehman Brothers Collapse',
          description: 'Major investment bank files for bankruptcy',
          duration: 0,
          priceImpact: -0.05,
          volatilityMultiplier: 1.5,
          affectedSymbols: ['ALL'],
          severity: 'HIGH',
        },
        {
          type: 'MARKET_CRASH',
          name: 'Global Market Crash',
          description: 'Widespread panic selling across all markets',
          duration: 5000,
          priceImpact: -0.30,
          volatilityMultiplier: 3.0,
          affectedSymbols: ['ALL'],
          severity: 'EXTREME',
        },
        {
          type: 'LIQUIDITY_CRISIS',
          name: 'Credit Freeze',
          description: 'Severe liquidity constraints in financial markets',
          duration: 10000,
          priceImpact: -0.10,
          volatilityMultiplier: 2.5,
          affectedSymbols: ['ALL'],
          severity: 'EXTREME',
        },
      ],
    },
    {
      name: 'Flash Crash 2010',
      description: 'Rapid intraday market crash followed by quick recovery',
      events: [
        {
          type: 'FLASH_CRASH',
          name: 'Algorithm-Driven Crash',
          description: 'High-frequency trading causes rapid price collapse',
          duration: 2000,
          priceImpact: -0.15,
          volatilityMultiplier: 5.0,
          affectedSymbols: ['ALL'],
          severity: 'EXTREME',
        },
        {
          type: 'CIRCUIT_BREAKER',
          name: 'Trading Halt',
          description: 'Exchange circuit breakers triggered',
          duration: 3000,
          priceImpact: 0,
          volatilityMultiplier: 0.1,
          affectedSymbols: ['ALL'],
          severity: 'HIGH',
        },
      ],
    },
    {
      name: 'Tech Bubble Burst',
      description: 'Technology sector experiences severe correction',
      events: [
        {
          type: 'SECTOR_ROTATION',
          name: 'Tech Selloff',
          description: 'Investors rotate out of overvalued tech stocks',
          duration: 8000,
          priceImpact: -0.25,
          volatilityMultiplier: 2.0,
          affectedSymbols: ['AAPL', 'GOOGL', 'MSFT', 'NVDA', 'TSLA'],
          severity: 'HIGH',
        },
      ],
    },
    {
      name: 'Strong Bull Rally',
      description: 'Sustained market rally driven by positive economic data',
      events: [
        {
          type: 'BULL_RALLY',
          name: 'Economic Recovery',
          description: 'Strong economic indicators drive market higher',
          duration: 10000,
          priceImpact: 0.20,
          volatilityMultiplier: 0.7,
          affectedSymbols: ['ALL'],
          severity: 'LOW',
        },
        {
          type: 'FED_ANNOUNCEMENT',
          name: 'Rate Cut',
          description: 'Federal Reserve announces interest rate cut',
          duration: 0,
          priceImpact: 0.05,
          volatilityMultiplier: 1.2,
          affectedSymbols: ['ALL'],
          severity: 'MEDIUM',
        },
      ],
    },
    {
      name: 'Earnings Season Volatility',
      description: 'Multiple major companies report earnings',
      events: [
        {
          type: 'EARNINGS_RELEASE',
          name: 'Tech Earnings Beat',
          description: 'Major tech companies exceed earnings expectations',
          duration: 1000,
          priceImpact: 0.08,
          volatilityMultiplier: 1.5,
          affectedSymbols: ['AAPL', 'GOOGL', 'MSFT'],
          severity: 'MEDIUM',
        },
        {
          type: 'EARNINGS_RELEASE',
          name: 'Financial Earnings Miss',
          description: 'Banks report disappointing earnings',
          duration: 1000,
          priceImpact: -0.06,
          volatilityMultiplier: 1.4,
          affectedSymbols: ['JPM', 'BAC', 'GS'],
          severity: 'MEDIUM',
        },
      ],
    },
    {
      name: 'Volatility Spike',
      description: 'Sudden increase in market volatility without clear direction',
      events: [
        {
          type: 'VOLATILITY_SPIKE',
          name: 'VIX Explosion',
          description: 'Market uncertainty causes volatility spike',
          duration: 6000,
          priceImpact: 0,
          volatilityMultiplier: 3.5,
          affectedSymbols: ['ALL'],
          severity: 'HIGH',
        },
      ],
    },
  ];

  triggerEvent(event: Omit<MarketEvent, 'id' | 'timestamp'>): string {
    const eventId = `EVT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const fullEvent: MarketEvent = {
      ...event,
      id: eventId,
      timestamp: Date.now(),
    };

    this.activeEvents.set(eventId, fullEvent);
    this.eventHistory.push(fullEvent);

    console.log(`Market event triggered: ${fullEvent.name} (${fullEvent.type})`);

    this.applyEventImpact(fullEvent);

    if (fullEvent.duration > 0) {
      setTimeout(() => {
        this.endEvent(eventId);
      }, fullEvent.duration);
    }

    return eventId;
  }

  triggerScenario(scenarioName: string): string[] {
    const scenario = this.predefinedScenarios.find((s) => s.name === scenarioName);
    if (!scenario) {
      console.error(`Scenario not found: ${scenarioName}`);
      return [];
    }

    console.log(`Triggering scenario: ${scenario.name}`);
    console.log(`Description: ${scenario.description}`);

    const eventIds: string[] = [];
    let delay = 0;

    scenario.events.forEach((event, index) => {
      setTimeout(() => {
        const eventId = this.triggerEvent(event);
        eventIds.push(eventId);
      }, delay);

      delay += 2000;
    });

    return eventIds;
  }

  private applyEventImpact(event: MarketEvent): void {
    const marketDataStore = useMarketDataStore.getState();

    const affectAllSymbols = event.affectedSymbols.includes('ALL');

    marketDataStore.marketData.forEach((data, symbol) => {
      if (!affectAllSymbols && !event.affectedSymbols.includes(symbol)) {
        return;
      }

      const currentPrice = data.price;
      const impactedPrice = currentPrice * (1 + event.priceImpact);

      marketDataStore.updateMarketData(symbol, {
        price: Math.max(0.01, impactedPrice),
        bid: Math.max(0.01, impactedPrice * 0.999),
        ask: impactedPrice * 1.001,
        change: event.priceImpact * 100,
        changePercent: event.priceImpact * 100,
        volume: data.volume * (1 + Math.random() * 2),
      });
    });
  }

  private endEvent(eventId: string): void {
    const event = this.activeEvents.get(eventId);
    if (!event) return;

    console.log(`Market event ended: ${event.name}`);

    this.activeEvents.delete(eventId);

    this.applyRecovery(event);
  }

  private applyRecovery(event: MarketEvent): void {
    const marketDataStore = useMarketDataStore.getState();

    const recoveryFactor = event.priceImpact > 0 ? 0.7 : 0.5;

    const affectAllSymbols = event.affectedSymbols.includes('ALL');

    marketDataStore.marketData.forEach((data, symbol) => {
      if (!affectAllSymbols && !event.affectedSymbols.includes(symbol)) {
        return;
      }

      const currentPrice = data.price;
      const recoveryImpact = -event.priceImpact * recoveryFactor;
      const recoveredPrice = currentPrice * (1 + recoveryImpact);

      marketDataStore.updateMarketData(symbol, {
        price: Math.max(0.01, recoveredPrice),
        bid: Math.max(0.01, recoveredPrice * 0.999),
        ask: recoveredPrice * 1.001,
      });
    });
  }

  startRandomEvents(probabilityPerMinute: number = 0.1): void {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
    }

    this.simulationInterval = setInterval(() => {
      if (Math.random() < probabilityPerMinute / 60) {
        const eventTypes: MarketEventType[] = [
          'NEWS_EVENT',
          'EARNINGS_RELEASE',
          'VOLATILITY_SPIKE',
          'SECTOR_ROTATION',
        ];

        const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)];

        const randomEvent = {
          type: randomType,
          name: `Random ${randomType}`,
          description: `Simulated ${randomType} event`,
          duration: Math.random() * 5000 + 2000,
          priceImpact: (Math.random() - 0.5) * 0.1,
          volatilityMultiplier: Math.random() * 1.5 + 0.5,
          affectedSymbols: ['ALL'],
          severity: 'MEDIUM' as const,
        };

        this.triggerEvent(randomEvent);
      }
    }, 1000);
  }

  stopRandomEvents(): void {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
  }

  getActiveEvents(): MarketEvent[] {
    return Array.from(this.activeEvents.values());
  }

  getEventHistory(): MarketEvent[] {
    return this.eventHistory;
  }

  getAvailableScenarios(): EventScenario[] {
    return this.predefinedScenarios;
  }

  clearHistory(): void {
    this.eventHistory = [];
  }

  cancelEvent(eventId: string): void {
    const event = this.activeEvents.get(eventId);
    if (event) {
      this.endEvent(eventId);
    }
  }

  shutdown(): void {
    this.stopRandomEvents();
    this.activeEvents.clear();
  }
}

export const marketEventSimulator = new MarketEventSimulator();
