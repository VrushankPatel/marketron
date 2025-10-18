import { MarketData, Tick, OHLCV, OrderBook, OrderBookLevel } from '@/types/market';
import { useMarketDataStore } from '@/stores/useMarketDataStore';
import { initialMarketData, initialOrderBooks, symbolVolatility, volatilityProfiles } from '@/data/sampleData';

export class MarketDataService {
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private isRunning = false;
  private symbols: string[] = [];

  constructor() {
    this.symbols = Object.keys(initialMarketData);
  }

  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('MarketDataService started');
    
    // Initialize with sample data
    this.initializeData();
    
    // Start real-time updates
    this.startRealTimeUpdates();
  }

  stop(): void {
    this.isRunning = false;
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();
    console.log('MarketDataService stopped');
  }

  private initializeData(): void {
    const { updateMarketData, updateOrderBook } = useMarketDataStore.getState();
    
    // Initialize market data
    Object.entries(initialMarketData).forEach(([symbol, data]) => {
      updateMarketData(symbol, data);
    });
    
    // Initialize order books
    Object.entries(initialOrderBooks).forEach(([symbol, orderBook]) => {
      updateOrderBook(symbol, orderBook);
    });
  }

  private startRealTimeUpdates(): void {
    // Market data updates (every 1 second)
    const marketDataInterval = setInterval(() => {
      this.updateAllMarketData();
    }, 1000);
    this.intervals.set('marketData', marketDataInterval);

    // Order book updates (every 1 second)
    const orderBookInterval = setInterval(() => {
      this.updateAllOrderBooks();
    }, 1000);
    this.intervals.set('orderBook', orderBookInterval);

    // Tick generation (every 1 second)
    const tickInterval = setInterval(() => {
      this.generateTicks();
    }, 1000);
    this.intervals.set('ticks', tickInterval);

    // OHLCV updates (every 5 seconds)
    const ohlcvInterval = setInterval(() => {
      this.updateOHLCV();
    }, 5000);
    this.intervals.set('ohlcv', ohlcvInterval);
  }

  private updateAllMarketData(): void {
    const { marketData, updateMarketData, addTick } = useMarketDataStore.getState();
    
    this.symbols.forEach(symbol => {
      const current = marketData.get(symbol);
      if (!current) return;
      
      const volatilityLevel = symbolVolatility[symbol as keyof typeof symbolVolatility] || 'medium';
      const volatility = volatilityProfiles[volatilityLevel];
      
      // Generate price movement using random walk
      const randomChange = (Math.random() - 0.5) * 2; // -1 to 1
      const priceChange = current.price * volatility * randomChange;
      const newPrice = Math.max(0.01, current.price + priceChange);
      
      // Update bid/ask spread
      const spread = current.price * 0.0001; // 0.01% spread
      const newBid = newPrice - spread / 2;
      const newAsk = newPrice + spread / 2;
      
      // Calculate volume with U-shaped pattern (higher at open/close)
      const hour = new Date().getHours();
      const volumeMultiplier = this.getVolumeMultiplier(hour);
      const baseVolume = Math.floor(Math.random() * 1000 + 100);
      const newVolume = current.volume + Math.floor(baseVolume * volumeMultiplier);
      
      const updatedData: MarketData = {
        ...current,
        price: Math.round(newPrice * 100) / 100,
        bid: Math.round(newBid * 100) / 100,
        ask: Math.round(newAsk * 100) / 100,
        high: Math.max(current.high, newPrice),
        low: Math.min(current.low, newPrice),
        volume: newVolume,
        change: newPrice - current.open,
        changePercent: ((newPrice - current.open) / current.open) * 100,
        timestamp: Date.now(),
        bidSize: Math.floor(Math.random() * 1000) + 100,
        askSize: Math.floor(Math.random() * 1000) + 100,
      };
      
      updateMarketData(symbol, updatedData);
      
      // Generate tick
      if (Math.random() > 0.7) { // 30% chance of tick
        const tick: Tick = {
          symbol,
          price: newPrice,
          size: Math.floor(Math.random() * 500) + 100,
          timestamp: Date.now(),
          side: Math.random() > 0.5 ? 'BUY' : 'SELL',
        };
        addTick(tick);
      }
    });
  }

  private updateAllOrderBooks(): void {
    const { orderBooks, updateOrderBook, marketData } = useMarketDataStore.getState();
    
    this.symbols.forEach(symbol => {
      const currentOrderBook = orderBooks.get(symbol);
      const currentMarketData = marketData.get(symbol);
      
      if (!currentOrderBook || !currentMarketData) return;
      
      // Update order book levels with some randomness
      const updatedBids = this.updateOrderBookLevels(
        currentOrderBook.bids,
        currentMarketData.bid,
        false
      );
      const updatedAsks = this.updateOrderBookLevels(
        currentOrderBook.asks,
        currentMarketData.ask,
        true
      );
      
      const updatedOrderBook: OrderBook = {
        ...currentOrderBook,
        bids: updatedBids,
        asks: updatedAsks,
        timestamp: Date.now(),
      };
      
      updateOrderBook(symbol, updatedOrderBook);
    });
  }

  private updateOrderBookLevels(
    levels: OrderBookLevel[],
    referencePrice: number,
    isAsk: boolean
  ): OrderBookLevel[] {
    return levels.map((level, index) => {
      // Small random changes to quantities
      const quantityChange = (Math.random() - 0.5) * 200;
      const newQuantity = Math.max(50, level.quantity + quantityChange);
      
      // Occasional price level changes
      let newPrice = level.price;
      if (Math.random() > 0.95) { // 5% chance of price change
        const priceIncrement = referencePrice * 0.0001;
        newPrice = isAsk 
          ? referencePrice + (priceIncrement * (index + 1))
          : referencePrice - (priceIncrement * (index + 1));
        newPrice = Math.round(newPrice * 100) / 100;
      }
      
      return {
        ...level,
        price: newPrice,
        quantity: Math.floor(newQuantity),
        orderCount: Math.max(1, Math.floor(newQuantity / 100)),
      };
    });
  }

  private generateTicks(): void {
    const { marketData, addTick } = useMarketDataStore.getState();
    
    // Generate ticks for random symbols
    const symbolsToTick = this.symbols.filter(() => Math.random() > 0.8);
    
    symbolsToTick.forEach(symbol => {
      const current = marketData.get(symbol);
      if (!current) return;
      
      const tick: Tick = {
        symbol,
        price: current.price + (Math.random() - 0.5) * current.price * 0.0001,
        size: Math.floor(Math.random() * 1000) + 50,
        timestamp: Date.now(),
        side: Math.random() > 0.5 ? 'BUY' : 'SELL',
      };
      
      addTick(tick);
    });
  }

  private updateOHLCV(): void {
    const { marketData, addOHLCV } = useMarketDataStore.getState();
    
    this.symbols.forEach(symbol => {
      const current = marketData.get(symbol);
      if (!current) return;
      
      const ohlcv: OHLCV = {
        symbol,
        open: current.open,
        high: current.high,
        low: current.low,
        close: current.price,
        volume: current.volume,
        timestamp: Date.now(),
        vwap: current.vwap,
      };
      
      addOHLCV(ohlcv);
    });
  }

  private getVolumeMultiplier(hour: number): number {
    // U-shaped volume pattern: higher at market open (9:30) and close (16:00)
    if (hour >= 9 && hour <= 10) return 2.0; // Market open
    if (hour >= 15 && hour <= 16) return 1.8; // Market close
    if (hour >= 11 && hour <= 14) return 0.8; // Midday lull
    return 1.0; // Normal hours
  }

  // Public methods for external use
  subscribeToSymbol(symbol: string): void {
    if (!this.symbols.includes(symbol)) {
      this.symbols.push(symbol);
      console.log(`Subscribed to ${symbol}`);
    }
  }

  unsubscribeFromSymbol(symbol: string): void {
    const index = this.symbols.indexOf(symbol);
    if (index > -1) {
      this.symbols.splice(index, 1);
      console.log(`Unsubscribed from ${symbol}`);
    }
  }
}
