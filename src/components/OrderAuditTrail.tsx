import React, { useState } from 'react';
import { useMatchingEngine } from '../services/matchingEngine';
import { ClipboardList, X } from 'lucide-react';
import { Order } from '../types/trading';

interface Props {
  darkMode: boolean;
}

interface ExecutionReport {
  orderId: string;
  symbol: string;
  side: string;
  orderQty: number;
  price: number | undefined;
  orderType: string;
  status: string;
  filledQty: number;
  avgPrice: number | undefined;
  timestamp: Date;
}

const OrderAuditTrail: React.FC<Props> = ({ darkMode }) => {
  const orders = useMatchingEngine((state) => state.orders);
  const [selectedReport, setSelectedReport] = useState<ExecutionReport | null>(null);

  const generateExecutionReport = (order: Order): ExecutionReport => ({
    orderId: order.id,
    symbol: order.symbol,
    side: order.side,
    orderQty: order.quantity,
    price: order.price,
    orderType: order.type,
    status: order.status,
    filledQty: order.filledQuantity,
    avgPrice: order.price, // In a real system, this would be the average fill price
    timestamp: order.timestamp
  });

  const ExecutionReportModal = ({ report }: { report: ExecutionReport }) => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl max-w-2xl w-full p-6`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Execution Report</h3>
          <button onClick={() => setSelectedReport(null)} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-500">Order ID</label>
            <p className="font-mono">{report.orderId}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Symbol</label>
            <p className="font-mono">{report.symbol}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Side</label>
            <p className={`font-mono ${report.side === 'BUY' ? 'text-green-500' : 'text-red-500'}`}>
              {report.side}
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Order Type</label>
            <p className="font-mono">{report.orderType}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Quantity</label>
            <p className="font-mono">{report.orderQty}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Price</label>
            <p className="font-mono">{report.price?.toFixed(2) || 'MARKET'}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Status</label>
            <p className="font-mono">{report.status}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Filled Quantity</label>
            <p className="font-mono">{report.filledQty}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Average Price</label>
            <p className="font-mono">{report.avgPrice?.toFixed(2) || 'N/A'}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Timestamp</label>
            <p className="font-mono">{report.timestamp.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Get the most recent orders first
  const recentOrders = [...orders]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 10);

  const MarketronEntry = ({ order }: { order: Order }) => (
    <div className={`p-4 ${darkMode ? 'bg-gray-700/50' : 'bg-gray-100'} rounded-lg mb-2 h-[88px]`}>
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {order.timestamp.toLocaleTimeString()}
          </span>
          <span className={`font-mono ${order.side === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
            {order.symbol} {order.side} {order.quantity} @ {order.price?.toFixed(2) || 'MKT'}
          </span>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${
          order.status === 'NEW' ? 'bg-blue-500' :
          order.status === 'PARTIALLY_FILLED' ? 'bg-yellow-500' :
          order.status === 'FILLED' ? 'bg-green-500' :
          'bg-red-500'
        } text-white`}>
          {order.status}
        </span>
      </div>
      <div className="text-xs text-gray-500 mt-1">
        Order ID: {order.id}
      </div>
    </div>
  );

  const AuditEntry = ({ order }: { order: Order }) => (
    <div className={`p-4 ${darkMode ? 'bg-gray-700/50' : 'bg-gray-100'} rounded-lg mb-2 h-[88px]`}>
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {order.timestamp.toLocaleTimeString()}
          </span>
          <span className={`font-mono ${order.side === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
            {order.symbol} {order.side} {order.quantity} @ {order.price?.toFixed(2) || 'MKT'}
          </span>
        </div>
        <button 
          onClick={() => setSelectedReport(generateExecutionReport(order))}
          className="text-xs px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          VIEW REPORT
        </button>
      </div>
      <div className="text-xs text-gray-500 mt-1">
        Order ID: {order.id}
      </div>
    </div>
  );

  return (
    <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} rounded-lg shadow-lg`}>
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <ClipboardList className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'} mr-2`} />
            <h2 className="text-2xl font-bold">Order Audit Trail Monitor (OATM)</h2>
          </div>
        </div>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-lg font-semibold mb-4">Client</h3>
            <div className="space-y-2">
              {recentOrders.map(order => (
                <AuditEntry key={order.id} order={order} />
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Marketron</h3>
            <div className="space-y-2">
              {recentOrders.map(order => (
                <MarketronEntry key={order.id} order={order} />
              ))}
            </div>
          </div>
        </div>
      </div>
      {selectedReport && <ExecutionReportModal report={selectedReport} />}
    </div>
  );
};

export default OrderAuditTrail; 