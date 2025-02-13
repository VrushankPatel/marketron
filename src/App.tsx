import React, { useState, useEffect } from 'react';
import MarketData from './components/MarketData';
import OrderEntry from './components/OrderEntry';
import OrderBook from './components/OrderBook';
import TradeMonitor from './components/TradeMonitor';
import OrderAuditTrail from './components/OrderAuditTrail';
import { Moon, Sun } from 'lucide-react';
import { useSimulation } from './services/simulationService';
import { usePersistence } from './services/persistenceService';
import logo from './assets/logo.png';
/**
 * @author Vrushank Patel
 * @description Global type declaration for window.setDarkMode function
 */
declare global {
  interface Window {
    setDarkMode?: (value: boolean) => void;
  }
}

/**
 * @author Vrushank Patel
 * @description Main application component that handles the layout and state management
 * @returns {JSX.Element} The rendered application
 */
function App() {
  const [darkMode, setDarkMode] = useState(() => {
    // Initialize from localStorage or default to false (light mode)
    const savedMode = localStorage.getItem('currentMode');
    return savedMode ? savedMode === 'dark' : false;
  });
  
  const { initialize, initialized } = usePersistence();
  const { isRunning, startSimulation, stopSimulation } = useSimulation();

  /**
   * @description Initializes the persistence service and applies the theme
   */
  useEffect(() => {
    // Apply theme class on mount and when darkMode changes
    document.documentElement.classList.toggle('dark', darkMode);
    // Save current mode to localStorage
    localStorage.setItem('currentMode', darkMode ? 'dark' : 'light');
    
    window.setDarkMode = setDarkMode;
    initialize();

    return () => {
      delete window.setDarkMode;
    };
  }, [darkMode, initialize]);

  /**
   * @description Handles dark mode toggle
   */
  const handleDarkModeToggle = () => {
    setDarkMode(!darkMode);
  };

  if (!initialized) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-100'} p-8 transition-colors duration-200`}>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-8`}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
            }}>
            <img src={logo} style={{
              width: '80px',
              height: '100px',
              borderRadius: '100%',
              objectFit: 'cover',
              transition: 'transform 0.3s ease',
              marginRight: '-15px',
            }}/>arketron
            </div>
          </h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => isRunning ? stopSimulation() : startSimulation()}
              className={`px-4 py-2 rounded-lg ${
                isRunning 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-green-500 hover:bg-green-600'
              } text-white`}
            >
              {isRunning ? 'Stop Simulation' : 'Start Simulation'}
            </button>
            <button
              onClick={handleDarkModeToggle}
              className={`p-2 rounded-lg ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} shadow-lg`}
            >
              {darkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-8">
          <MarketData darkMode={darkMode} />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <OrderEntry darkMode={darkMode} />
            <OrderBook darkMode={darkMode} />
          </div>

          <OrderAuditTrail darkMode={darkMode} />
          <TradeMonitor darkMode={darkMode} />
        </div>
      </div>
    </div>
  );
}

export default App;