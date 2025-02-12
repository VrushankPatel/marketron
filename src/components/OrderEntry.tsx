import React, { useState } from 'react';
import { Order, Side, OrderType } from '../types/trading';
import { useMatchingEngine } from '../services/matchingEngine';
import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

interface Props {
  darkMode: boolean;
}

/**
 * @author Vrushank Patel
 * @description Component for entering new trading orders
 * @param {Props} props - Component properties
 * @param {boolean} props.darkMode - Current theme mode
 * @returns {JSX.Element} The rendered order entry form
 */
const OrderEntry: React.FC<Props> = ({ darkMode }) => {
  const addOrder = useMatchingEngine((state) => state.addOrder);
  const [symbol, setSymbol] = useState('AAPL');
  const [side, setSide] = useState<Side>('BUY');
  const [type, setType] = useState<OrderType>('LIMIT');
  const [quantity, setQuantity] = useState(100);
  const [price, setPrice] = useState(150.00);
  const [notification, setNotification] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (quantity <= 0) {
      setNotification('Quantity must be greater than 0');
      return;
    }

    if (type === 'LIMIT' && price <= 0) {
      setNotification('Price must be greater than 0');
      return;
    }

    const order: Order = {
      id: Math.random().toString(36).substr(2, 9),
      symbol,
      side,
      type,
      quantity,
      price: type === 'LIMIT' ? price : undefined,
      status: 'NEW',
      filledQuantity: 0,
      timestamp: new Date(),
    };

    addOrder(order);
    setNotification(`${side} order placed successfully`);

    // Clear notification after 3 seconds
    setTimeout(() => setNotification(null), 3000);
  };

  const inputClasses = `mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
    darkMode 
      ? 'bg-gray-700 border-gray-600 text-white' 
      : 'bg-white border-gray-300 text-gray-900'
  }`;

  return (
    <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} p-6 rounded-lg shadow-lg`}>
      <h2 className="text-2xl font-bold mb-6">Order Entry</h2>
      {notification && (
        <div className={`mb-4 p-3 rounded ${
          notification.includes('error')
            ? 'bg-red-100 text-red-700'
            : 'bg-green-100 text-green-700'
        }`}>
          {notification}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <div className="col-span-2 sm:col-span-1">
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-1`}>Symbol</label>
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className={`${inputClasses} h-10`}
            >
              <option value="AAPL">AAPL</option>
              <option value="GOOGL">GOOGL</option>
              <option value="MSFT">MSFT</option>
              <option value="AMZN">AMZN</option>
              <option value="TSLA">TSLA</option>
              <option value="META">META</option>
              <option value="NFLX">NFLX</option>
              <option value="NVDA">NVDA</option>
              <option value="AMD">AMD</option>
            </select>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-1`}>Side</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setSide('BUY')}
                className={`h-10 flex items-center justify-center px-4 rounded-md ${
                  side === 'BUY'
                    ? 'bg-green-500 text-white'
                    : darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'
                }`}
              >
                <ArrowUpCircle className="w-4 h-4 mr-2" />
                Buy
              </button>
              <button
                type="button"
                onClick={() => setSide('SELL')}
                className={`h-10 flex items-center justify-center px-4 rounded-md ${
                  side === 'SELL'
                    ? 'bg-red-500 text-white'
                    : darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'
                }`}
              >
                <ArrowDownCircle className="w-4 h-4 mr-2" />
                Sell
              </button>
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-1`}>Order Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as OrderType)}
              className={`${inputClasses} h-10`}
            >
              <option value="LIMIT">Limit</option>
              <option value="MARKET">Market</option>
            </select>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-1`}>Quantity</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              min="1"
              step="1"
              className={`${inputClasses} h-10`}
            />
          </div>

          {type === 'LIMIT' && (
            <div className="col-span-2 sm:col-span-1">
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-1`}>Price</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                min="0.01"
                step="0.01"
                className={`${inputClasses} h-10`}
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          className={`w-full h-10 px-4 rounded-md ${
            side === 'BUY'
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-red-600 hover:bg-red-700'
          } text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            side === 'BUY' ? 'focus:ring-green-500' : 'focus:ring-red-500'
          }`}
        >
          Submit {side} Order
        </button>
      </form>
    </div>
  );
};

export default OrderEntry;