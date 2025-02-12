import React, { useState, useEffect } from 'react';
import { MarketData as MarketDataType } from '../types/trading';
import { TrendingUp } from 'lucide-react';

const initialMarketData: MarketDataType[] = [
  { symbol: 'AAPL', bid: 173.05, ask: 173.10, lastPrice: 173.05, volume: 1250000, high: 173.50, low: 172.80 },
  { symbol: 'GOOGL', bid: 2719.36, ask: 2719.86, lastPrice: 2719.36, volume: 450000, high: 2725.00, low: 2715.00 },
  { symbol: 'MSFT', bid: 368.30, ask: 368.80, lastPrice: 368.30, volume: 850000, high: 369.50, low: 367.25 },
  { symbol: 'AMZN', bid: 3239.40, ask: 3239.90, lastPrice: 3239.40, volume: 650000, high: 3245.00, low: 3235.00 },
  { symbol: 'TSLA', bid: 796.69, ask: 797.19, lastPrice: 796.69, volume: 750000, high: 800.00, low: 795.00 },
  { symbol: 'META', bid: 270.64, ask: 271.14, lastPrice: 270.64, volume: 550000, high: 272.00, low: 269.50 },
  { symbol: 'NFLX', bid: 455.39, ask: 455.89, lastPrice: 455.39, volume: 350000, high: 457.00, low: 454.00 },
  { symbol: 'NVDA', bid: 441.23, ask: 441.73, lastPrice: 441.23, volume: 950000, high: 443.00, low: 440.00 },
  { symbol: 'AMD', bid: 119.63, ask: 120.13, lastPrice: 119.63, volume: 450000, high: 121.00, low: 119.00 }
];

interface Props {
  darkMode: boolean;
}

const MarketData: React.FC<Props> = ({ darkMode }) => {
  const [marketData, setMarketData] = useState<MarketDataType[]>(initialMarketData);

  useEffect(() => {
    const interval = setInterval(() => {
      setMarketData(prevData => 
        prevData.map(stock => {
          const change = (Math.random() - 0.5) * 2; // Random change between -1 and 1
          const newPrice = Number((stock.lastPrice + change).toFixed(2));
          return {
            ...stock,
            bid: newPrice - 0.05,
            ask: newPrice + 0.05,
            lastPrice: newPrice,
            volume: stock.volume + Math.floor(Math.random() * 1000),
            high: Math.max(stock.high, newPrice),
            low: Math.min(stock.low, newPrice)
          };
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} p-6 rounded-lg shadow-lg`}>
      <div className="flex items-center mb-6">
        <TrendingUp className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'} mr-2`} />
        <h2 className="text-2xl font-bold">Market Data</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bid</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ask</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volume</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">High</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Low</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
            {marketData.map((data) => (
              <tr key={data.symbol} className={darkMode ? 'bg-gray-800' : 'bg-white'}>
                <td className="px-6 py-4 whitespace-nowrap font-medium">{data.symbol}</td>
                <td className="px-6 py-4 whitespace-nowrap text-green-500">{data.bid.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-red-500">{data.ask.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap">{data.lastPrice.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap">{data.volume.toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-green-500">{data.high.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-red-500">{data.low.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MarketData;