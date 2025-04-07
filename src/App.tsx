import React, { useState, useEffect } from 'react';
import MarketData from './components/MarketData';
import OrderEntry from './components/OrderEntry';
import OrderBook from './components/OrderBook';
import TradeMonitor from './components/TradeMonitor';
import OrderAuditTrail from './components/OrderAuditTrail';
import { Moon, Sun, LineChart, X, Rocket, PlayCircle, StopCircle } from 'lucide-react';
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
  const [showFixionary, setShowFixionary] = useState(false);

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
              className={`group h-10 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white flex items-center justify-center transition-all duration-200 overflow-hidden w-[42px] hover:w-[135px]`}
              onClick={() => setShowFixionary(true)}
            >
              <LineChart className="w-5 h-5 min-w-[20px]" />
              <span className="ml-0 whitespace-nowrap overflow-hidden">&nbsp;Fixionary</span>
            </button>
            
            <button
              onClick={() => window.location.href = "/v2/index.html"}
              className={`group h-10 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition-all duration-200 overflow-hidden w-[42px] hover:w-[165px]`}
            >
              <Rocket className="w-5 h-5 min-w-[20px]" />
              <span className="ml-0 whitespace-nowrap overflow-hidden"> &nbsp;Advance Mode</span>
            </button>
            
            <button
              onClick={() => isRunning ? stopSimulation() : startSimulation()}
              className={`group h-10 px-4 py-2 rounded-lg ${
                isRunning 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-green-500 hover:bg-green-600'
              } text-white flex items-center justify-center transition-all duration-200 overflow-hidden w-[42px] hover:w-[175px]`}
            >
              {isRunning ? (
                <>
                  <StopCircle className="w-5 h-5 min-w-[20px]" />
                  <span className="ml-0 whitespace-nowrap overflow-hidden">&nbsp;Stop Simulation</span>
                </>
              ) : (
                <>
                  <PlayCircle className="w-5 h-5 min-w-[20px]" />
                  <span className="ml-0 whitespace-nowrap overflow-hidden">&nbsp;Start Simulation</span>
                </>
              )}
            </button>
            
            <button
              onClick={handleDarkModeToggle}
              className={`h-10 w-10 flex items-center justify-center rounded-lg ${
                darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
              } shadow-lg`}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
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

      {showFixionary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-full flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-bold text-gray-800">Fixionary</h2>
              <button
                onClick={() => setShowFixionary(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden flex">
              <iframe
                src="https://thefixionary.web.app"
                className="w-full h-full"
                title="Fixionary"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;