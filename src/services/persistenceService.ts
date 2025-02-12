import { create } from 'zustand';
import { Order, Trade } from '../types/trading';
import { useMatchingEngine } from './matchingEngine';

/**
 * @author Vrushank Patel
 * @description Service to handle state persistence using localStorage with encryption
 */

interface StoredState {
  orders: Order[];
  trades: Trade[];
}

const STORAGE_KEY = 'trading_simulator_state';

// Encryption key (you can make this more secure)
const ENCRYPTION_KEY = 'your-secret-key-123';

const encrypt = (data: string): string => {
  // Simple XOR encryption (you can use a more secure method)
  return data
    .split('')
    .map(char => 
      String.fromCharCode(char.charCodeAt(0) ^ ENCRYPTION_KEY.charCodeAt(0))
    )
    .join('');
};

const decrypt = (data: string): string => {
  // XOR encryption is reversible with the same key
  return encrypt(data);
};

export const saveState = (state: StoredState) => {
  try {
    const serializedState = JSON.stringify(state);
    const encryptedState = encrypt(serializedState);
    localStorage.setItem(STORAGE_KEY, encryptedState);
  } catch (err) {
    console.error('Error saving state:', err);
  }
};

export const loadState = (): StoredState | undefined => {
  try {
    const encryptedState = localStorage.getItem(STORAGE_KEY);
    if (!encryptedState) return undefined;
    
    const serializedState = decrypt(encryptedState);
    const state = JSON.parse(serializedState);
    
    // Convert stored date strings back to Date objects
    state.orders = state.orders.map((order: any) => ({
      ...order,
      timestamp: new Date(order.timestamp)
    }));
    
    state.trades = state.trades.map((trade: any) => ({
      ...trade,
      timestamp: new Date(trade.timestamp)
    }));
    
    return state;
  } catch (err) {
    console.error('Error loading state:', err);
    return undefined;
  }
};

interface PersistenceStore {
  initialized: boolean;
  initialize: () => void;
}

export const usePersistence = create<PersistenceStore>((set) => {
  let unsubscribe: (() => void) | undefined;

  return {
    initialized: false,
    initialize: () => {
      const savedState = loadState();
      if (savedState) {
        useMatchingEngine.setState({ 
          orders: savedState.orders,
          trades: savedState.trades
        });
      }

      if (!unsubscribe) {
        unsubscribe = useMatchingEngine.subscribe((state) => {
          saveState({
            orders: state.orders,
            trades: state.trades
          });
        });
      }

      set({ initialized: true });
    }
  };
}); 