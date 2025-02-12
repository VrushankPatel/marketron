import { useMatchingEngine } from './matchingEngine';
import { Order, Side, OrderType } from '../types/trading';
import { create } from 'zustand';

interface SimulationStore {
  isRunning: boolean;
  startSimulation: () => void;
  stopSimulation: () => void;
}

const SYMBOLS = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NFLX', 'NVDA', 'AMD'];
const BASE_PRICES = {
  AAPL: 170,
  GOOGL: 2700,
  MSFT: 370,
  AMZN: 3240,
  TSLA: 800,
  META: 270,
  NFLX: 455,
  NVDA: 440,
  AMD: 120
};

export const useSimulation = create<SimulationStore>((set, get) => {
  let intervalId: NodeJS.Timeout | null = null;

  const generateRandomOrder = (): Order => {
    const symbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    const side: Side = Math.random() > 0.5 ? 'BUY' : 'SELL';
    const type: OrderType = Math.random() > 0.3 ? 'LIMIT' : 'MARKET';
    const basePrice = BASE_PRICES[symbol as keyof typeof BASE_PRICES];
    const priceVariation = basePrice * 0.02; // 2% variation
    const price = type === 'LIMIT' ? 
      basePrice + (Math.random() - 0.5) * priceVariation : 
      undefined;
    
    return {
      id: Math.random().toString(36).substr(2, 9),
      symbol,
      side,
      type,
      quantity: Math.floor(Math.random() * 100) + 1,
      price,
      status: 'NEW',
      filledQuantity: 0,
      timestamp: new Date(),
    };
  };

  return {
    isRunning: false,
    startSimulation: () => {
      if (!get().isRunning) {
        set({ isRunning: true });
        intervalId = setInterval(() => {
          const order = generateRandomOrder();
          useMatchingEngine.getState().addOrder(order);
        }, 2000); // Generate a new order every 2 seconds
      }
    },
    stopSimulation: () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      set({ isRunning: false });
    },
  };
}); 