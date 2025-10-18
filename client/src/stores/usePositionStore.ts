import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Position } from '@/types/trading';
import { getLocalStorage, setLocalStorage } from '@/lib/utils';

interface PositionState {
  positions: Map<string, Position>;
  totalPnL: number;
  totalMarketValue: number;
  
  // Actions
  updatePosition: (symbol: string, quantity: number, price: number) => void;
  getPosition: (symbol: string) => Position | undefined;
  getAllPositions: () => Position[];
  calculatePnL: () => void;
  saveToStorage: () => void;
  loadFromStorage: () => void;
}

export const usePositionStore = create<PositionState>()(
  subscribeWithSelector((set, get) => ({
    positions: new Map(),
    totalPnL: 0,
    totalMarketValue: 0,
    
    updatePosition: (symbol, quantity, price) => {
      const positions = new Map(get().positions);
      const existingPosition = positions.get(symbol);
      
      if (existingPosition) {
        // Update existing position
        const newQuantity = existingPosition.quantity + quantity;
        const newAvgPrice = newQuantity === 0 
          ? 0 
          : ((existingPosition.averagePrice * existingPosition.quantity) + (price * quantity)) / newQuantity;
        
        const updatedPosition: Position = {
          ...existingPosition,
          quantity: newQuantity,
          averagePrice: newAvgPrice,
          side: newQuantity > 0 ? 'LONG' : newQuantity < 0 ? 'SHORT' : 'FLAT',
          lastUpdateTime: Date.now(),
        };
        
        if (newQuantity === 0) {
          positions.delete(symbol);
        } else {
          positions.set(symbol, updatedPosition);
        }
      } else {
        // Create new position
        const newPosition: Position = {
          symbol,
          quantity,
          averagePrice: price,
          marketValue: 0,
          unrealizedPnL: 0,
          realizedPnL: 0,
          side: quantity > 0 ? 'LONG' : quantity < 0 ? 'SHORT' : 'FLAT',
          lastUpdateTime: Date.now(),
        };
        
        positions.set(symbol, newPosition);
      }
      
      set({ positions });
      get().calculatePnL();
      get().saveToStorage();
    },
    
    getPosition: (symbol) => {
      return get().positions.get(symbol);
    },
    
    getAllPositions: () => {
      return Array.from(get().positions.values());
    },
    
    calculatePnL: () => {
      const positions = Array.from(get().positions.values());
      const totalPnL = positions.reduce((sum, pos) => sum + pos.unrealizedPnL + pos.realizedPnL, 0);
      const totalMarketValue = positions.reduce((sum, pos) => sum + Math.abs(pos.marketValue), 0);
      
      set({ totalPnL, totalMarketValue });
    },
    
    saveToStorage: () => {
      const positionsArray = Array.from(get().positions.entries());
      setLocalStorage('positions', positionsArray);
    },
    
    loadFromStorage: () => {
      const stored = getLocalStorage('positions') || [];
      const positions = new Map(stored);
      set({ positions });
      get().calculatePnL();
    },
  }))
);
