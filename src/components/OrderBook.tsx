import React from 'react';
import { Order } from '../types/trading';
import { useMatchingEngine } from '../services/matchingEngine';
import { BookOpen } from 'lucide-react';

interface Props {
  darkMode: boolean;
}

interface OrderLevel {
  price: number;
  quantity: number;
  orders: Order[];
}

/**
 * @author Vrushank Patel
 * @description Component that displays the current order book with bids and asks
 * @param {Props} props - Component properties
 * @param {boolean} props.darkMode - Current theme mode
 * @returns {JSX.Element} The rendered order book
 */
const OrderBook: React.FC<Props> = ({ darkMode }) => {
  const orders = useMatchingEngine((state) => state.orders);

  // Group orders by price level
  const groupOrdersByPrice = (orders: Order[]): OrderLevel[] => {
    const priceMap = new Map<number, OrderLevel>();
    
    orders.forEach(order => {
      if (!order.price) return; // Skip market orders
      const price = order.price;
      const existingLevel = priceMap.get(price);
      
      if (existingLevel) {
        existingLevel.quantity += (order.quantity - order.filledQuantity);
        existingLevel.orders.push(order);
      } else {
        priceMap.set(price, {
          price,
          quantity: order.quantity - order.filledQuantity,
          orders: [order]
        });
      }
    });

    return Array.from(priceMap.values());
  };

  const bids = groupOrdersByPrice(
    orders.filter(order => 
      order.side === 'BUY' && 
      order.status !== 'FILLED' && 
      order.status !== 'CANCELLED' &&
      order.price !== undefined
    )
  ).sort((a, b) => b.price - a.price);

  const asks = groupOrdersByPrice(
    orders.filter(order => 
      order.side === 'SELL' && 
      order.status !== 'FILLED' && 
      order.status !== 'CANCELLED' &&
      order.price !== undefined
    )
  ).sort((a, b) => a.price - b.price);

  const OrderColumn = ({ levels, side }: { levels: OrderLevel[], side: 'Bids' | 'Asks' }) => (
    <div className={`flex-1 p-4 ${side === 'Asks' ? 'bg-red-900/10' : 'bg-green-900/10'}`}>
      <h3 className={`text-lg font-semibold mb-4 ${side === 'Asks' ? 'text-red-400' : 'text-green-400'}`}>
        {side}
      </h3>
      <div className="space-y-2">
        {levels.length > 0 ? (
          levels.map((level) => (
            <div key={level.price} className="flex justify-between items-center text-sm">
              <span className={`font-mono ${side === 'Asks' ? 'text-red-400' : 'text-green-400'}`}>
                {level.price.toFixed(2)}
              </span>
              <span className="font-mono text-gray-400">
                {level.quantity}
              </span>
            </div>
          ))
        ) : (
          <div className="text-gray-500 text-sm italic">No {side.toLowerCase()} available</div>
        )}
      </div>
    </div>
  );

  return (
    <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} rounded-lg shadow-lg`}>
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center">
          <BookOpen className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'} mr-2`} />
          <h2 className="text-2xl font-bold">Order Book</h2>
        </div>
      </div>
      <div className="flex">
        <OrderColumn levels={bids} side="Bids" />
        <OrderColumn levels={asks} side="Asks" />
      </div>
    </div>
  );
};

export default OrderBook;