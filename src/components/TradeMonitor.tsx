import React, { useState } from 'react';
import { useMatchingEngine } from '../services/matchingEngine';
import { Activity, X } from 'lucide-react';
import { Trade } from '../types/trading';

interface Props {
  darkMode: boolean;
}

interface TCRDetails {
  trade: Trade;
  buyOrder: any;  // Will be populated from matching engine
  sellOrder: any; // Will be populated from matching engine
}

/**
 * @author Vrushank Patel
 * @description Component that displays executed trades and trade capture reports
 * @param {Props} props - Component properties
 * @param {boolean} props.darkMode - Current theme mode
 * @returns {JSX.Element} The rendered trade monitor
 */
const TradeMonitor: React.FC<Props> = ({ darkMode }) => {
  const trades = useMatchingEngine((state) => state.trades);
  const orders = useMatchingEngine((state) => state.orders);
  const [selectedTCR, setSelectedTCR] = useState<TCRDetails | null>(null);

  const generateTCR = (trade: Trade): TCRDetails => {
    const relatedOrders = orders.filter(order => 
      order.symbol === trade.symbol && 
      Math.abs(order.timestamp.getTime() - trade.timestamp.getTime()) < 1000
    );
    
    const buyOrder = relatedOrders.find(order => order.side === 'BUY');
    const sellOrder = relatedOrders.find(order => order.side === 'SELL');

    return {
      trade,
      buyOrder,
      sellOrder
    };
  };

  const TCRModal = ({ details }: { details: TCRDetails }) => (
    <div className="fixed inset-0 z-50" onClick={() => setSelectedTCR(null)}>
      <div className="absolute inset-0 bg-black/50" />
      
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div 
            className={`${darkMode ? 'bg-gray-900' : 'bg-gray-800'} rounded-lg shadow-xl max-w-2xl w-full my-8 relative`}
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-gray-900 p-4 rounded-t-lg border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Trade Capture Report</h3>
              <button 
                onClick={() => setSelectedTCR(null)}
                className="text-gray-400 hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h4 className="text-lg font-semibold mb-4 text-white">Trade Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400">Symbol:</label>
                    <p className="font-mono text-white">{details.trade.symbol}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Quantity:</label>
                    <p className="font-mono text-white">{details.trade.quantity}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Price:</label>
                    <p className="font-mono text-white">{details.trade.price.toFixed(8)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Time:</label>
                    <p className="font-mono text-white">{details.trade.timestamp.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4">
                <h4 className="text-lg font-semibold mb-4 text-white">Buy Order Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400">Order ID:</label>
                    <p className="font-mono text-white">{details.buyOrder?.id}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Order Type:</label>
                    <p className="font-mono text-white">{details.buyOrder?.type}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Original Quantity:</label>
                    <p className="font-mono text-white">{details.buyOrder?.quantity}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Limit Price:</label>
                    <p className="font-mono text-white">{details.buyOrder?.price?.toFixed(2) || 'MARKET'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Stop Price:</label>
                    <p className="font-mono text-white">N/A</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Order Time:</label>
                    <p className="font-mono text-white">{details.buyOrder?.timestamp.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Sender Comp ID:</label>
                    <p className="font-mono text-white">SIM000001</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Client Order ID:</label>
                    <p className="font-mono text-white">ORD{Math.random().toString(36).substr(2, 16)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Sender Sub ID:</label>
                    <p className="font-mono text-white">AUTO</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Target Comp ID:</label>
                    <p className="font-mono text-white">MKT000001</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4">
                <h4 className="text-lg font-semibold mb-4 text-white">Sell Order Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400">Order ID:</label>
                    <p className="font-mono text-white">{details.sellOrder?.id}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Order Type:</label>
                    <p className="font-mono text-white">{details.sellOrder?.type}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Original Quantity:</label>
                    <p className="font-mono text-white">{details.sellOrder?.quantity}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Limit Price:</label>
                    <p className="font-mono text-white">{details.sellOrder?.price?.toFixed(2) || 'MARKET'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Stop Price:</label>
                    <p className="font-mono text-white">N/A</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Order Time:</label>
                    <p className="font-mono text-white">{details.sellOrder?.timestamp.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Sender Comp ID:</label>
                    <p className="font-mono text-white">SIM000001</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Client Order ID:</label>
                    <p className="font-mono text-white">ORD{Math.random().toString(36).substr(2, 16)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Sender Sub ID:</label>
                    <p className="font-mono text-white">AUTO</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Target Comp ID:</label>
                    <p className="font-mono text-white">MKT000001</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} p-6 rounded-lg shadow-lg`}>
      <div className="flex items-center mb-6">
        <Activity className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'} mr-2`} />
        <h2 className="text-2xl font-bold">Trade Monitor</h2>
      </div>

      <div className="space-y-2">
        {trades.map((trade) => (
          <div key={trade.id} className={`p-4 ${darkMode ? 'bg-gray-700/50' : 'bg-gray-100'} rounded-lg`}>
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <span className="font-mono">{trade.symbol}</span>
                <span className="font-mono">{trade.quantity} @</span>
                <span className="font-mono">{trade.price.toFixed(2)}</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  {trade.timestamp.toLocaleTimeString()}
                </span>
                <button
                  onClick={() => setSelectedTCR(generateTCR(trade))}
                  className="text-xs px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  TCR
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedTCR && <TCRModal details={selectedTCR} />}
    </div>
  );
};

export default TradeMonitor; 