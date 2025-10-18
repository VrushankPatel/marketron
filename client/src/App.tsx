import { useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useTradingStore } from "@/stores/useTradingStore";
import { useMarketDataStore } from "@/stores/useMarketDataStore";
import { useTutorialStore } from "@/stores/useTutorialStore";
import { MarketDataService } from "@/services/MarketDataService";
import { OrderService } from "@/services/OrderService";
import { achievements } from "@/data/tutorials";

function App() {
  const { initialize } = useTradingStore();
  const { startDataFeed } = useMarketDataStore();

  // Watch for theme changes
  useEffect(() => {
    const unsubscribe = useTradingStore.subscribe(
      (state) => state.isDarkMode,
      (isDarkMode) => {
        if (isDarkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },
      { fireImmediately: true }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Initialize the trading platform
    initialize();

    // Initialize tutorial system with achievements
    const tutorialStore = useTutorialStore.getState();
    tutorialStore.initializeAchievements(achievements);
    
    // Start market data feeds
    const marketDataService = new MarketDataService();
    const orderService = new OrderService();
    
    // Start real-time data simulation
    startDataFeed();
    
    // Initialize services
    marketDataService.start();
    orderService.initialize();
    
    // Session time tracking
    const sessionStartTime = Date.now();
    const sessionTimer = setInterval(() => {
      const minutesElapsed = Math.floor((Date.now() - sessionStartTime) / 60000);
      if (minutesElapsed > 0) {
        tutorialStore.updateSessionTime(1);
      }
    }, 60000); // Update every minute
    
    return () => {
      marketDataService.stop();
      clearInterval(sessionTimer);
    };
  }, [initialize, startDataFeed]);

  return <MainLayout />;
}

export default App;
