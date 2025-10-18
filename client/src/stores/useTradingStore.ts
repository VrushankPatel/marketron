import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Instrument } from '@/types/market';
import { instruments as defaultInstruments } from '@/data/instruments';
import { getLocalStorage, setLocalStorage } from '@/lib/utils';

interface TradingState {
  // UI State
  selectedInstrument: Instrument | null;
  activeTab: string;
  isDarkMode: boolean;
  layoutConfig: {
    showOrderEntry: boolean;
    showMarketDepth: boolean;
    showCharts: boolean;
    showBlotters: boolean;
    show3DVisualization: boolean;
  };
  
  // Instruments
  instruments: Instrument[];
  watchlist: string[];
  
  // Settings
  settings: {
    showNotifications: boolean;
    autoRefresh: boolean;
    refreshInterval: number;
    defaultQuantity: number;
    defaultOrderType: string;
    riskLimits: {
      maxPositionSize: number;
      maxDailyLoss: number;
      maxOrderSize: number;
    };
  };
  
  // Actions
  initialize: () => void;
  setSelectedInstrument: (instrument: Instrument | null) => void;
  setActiveTab: (tab: string) => void;
  toggleTheme: () => void;
  updateLayoutConfig: (config: Partial<TradingState['layoutConfig']>) => void;
  addToWatchlist: (symbol: string) => void;
  removeFromWatchlist: (symbol: string) => void;
  updateSettings: (settings: Partial<TradingState['settings']>) => void;
  saveState: () => void;
}

export const useTradingStore = create<TradingState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    selectedInstrument: null,
    activeTab: 'trading',
    isDarkMode: true,
    layoutConfig: {
      showOrderEntry: true,
      showMarketDepth: true,
      showCharts: true,
      showBlotters: true,
      show3DVisualization: false,
    },
    instruments: defaultInstruments,
    watchlist: ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA'],
    settings: {
      showNotifications: true,
      autoRefresh: true,
      refreshInterval: 1000,
      defaultQuantity: 100,
      defaultOrderType: 'LIMIT',
      riskLimits: {
        maxPositionSize: 10000,
        maxDailyLoss: 5000,
        maxOrderSize: 1000,
      },
    },
    
    // Actions
    initialize: () => {
      const savedState = getLocalStorage('tradingState');
      if (savedState) {
        set({
          selectedInstrument: savedState.selectedInstrument,
          activeTab: savedState.activeTab || 'trading',
          isDarkMode: savedState.isDarkMode ?? true,
          layoutConfig: { ...get().layoutConfig, ...savedState.layoutConfig },
          watchlist: savedState.watchlist || get().watchlist,
          settings: { ...get().settings, ...savedState.settings },
        });
      }
    },
    
    setSelectedInstrument: (instrument) => {
      set({ selectedInstrument: instrument });
      get().saveState();
    },
    
    setActiveTab: (tab) => {
      set({ activeTab: tab });
      get().saveState();
    },
    
    toggleTheme: () => {
      set((state) => {
        const newDarkMode = !state.isDarkMode;
        
        // Update document class synchronously
        if (newDarkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        
        // Save to localStorage
        const newState = {
          ...state,
          isDarkMode: newDarkMode
        };
        
        setLocalStorage('tradingState', {
          selectedInstrument: newState.selectedInstrument,
          activeTab: newState.activeTab,
          isDarkMode: newDarkMode,
          layoutConfig: newState.layoutConfig,
          watchlist: newState.watchlist,
          settings: newState.settings,
        });
        
        return { isDarkMode: newDarkMode };
      });
    },
    
    updateLayoutConfig: (config) => {
      set({ 
        layoutConfig: { ...get().layoutConfig, ...config }
      });
      get().saveState();
    },
    
    addToWatchlist: (symbol) => {
      const currentWatchlist = get().watchlist;
      if (!currentWatchlist.includes(symbol)) {
        set({ watchlist: [...currentWatchlist, symbol] });
        get().saveState();
      }
    },
    
    removeFromWatchlist: (symbol) => {
      set({ 
        watchlist: get().watchlist.filter(s => s !== symbol)
      });
      get().saveState();
    },
    
    updateSettings: (newSettings) => {
      set({
        settings: { ...get().settings, ...newSettings }
      });
      get().saveState();
    },
    
    saveState: () => {
      const state = get();
      setLocalStorage('tradingState', {
        selectedInstrument: state.selectedInstrument,
        activeTab: state.activeTab,
        isDarkMode: state.isDarkMode,
        layoutConfig: state.layoutConfig,
        watchlist: state.watchlist,
        settings: state.settings,
      });
    },
  }))
);
