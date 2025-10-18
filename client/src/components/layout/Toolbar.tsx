import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Activity, 
  Settings, 
  Moon, 
  Sun, 
  Wifi, 
  WifiOff, 
  Bell, 
  BellOff,
  Monitor 
} from 'lucide-react';
import { useTradingStore } from '@/stores/useTradingStore';
import { useMarketDataStore } from '@/stores/useMarketDataStore';
import { useOrderStore } from '@/stores/useOrderStore';
import { usePositionStore } from '@/stores/usePositionStore';
import { formatCurrency } from '@/utils/formatters';
import { TutorialMenu } from '@/components/tutorial';
import { SettingsDialog } from './SettingsDialog';

export const Toolbar: React.FC = () => {
  const { 
    isDarkMode, 
    toggleTheme, 
    selectedInstrument, 
    setSelectedInstrument,
    instruments,
    settings,
    updateSettings 
  } = useTradingStore();
  
  const { isConnected, lastUpdate } = useMarketDataStore();
  const { orders } = useOrderStore();
  const { totalPnL, getAllPositions } = usePositionStore();

  const activeOrders = orders.filter(order => 
    order.status === 'NEW' || order.status === 'PARTIALLY_FILLED'
  ).length;

  const positions = getAllPositions();

  const handleInstrumentSelect = (symbol: string) => {
    const instrument = instruments.find(inst => inst.symbol === symbol);
    setSelectedInstrument(instrument || null);
  };

  return (
    <div className="h-12 bg-card border-b border-border flex items-center px-4 gap-4 shrink-0">
      {/* Logo and Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <span className="font-semibold text-foreground">TradeFlow 3D</span>
        </div>
        <Badge variant="secondary" className="text-xs">
          v1.0.0
        </Badge>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Instrument Selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Instrument:</span>
        <Select
          value={selectedInstrument?.symbol || ""}
          onValueChange={handleInstrumentSelect}
        >
          <SelectTrigger className="w-32 h-8">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {instruments.slice(0, 10).map((instrument) => (
              <SelectItem key={instrument.symbol} value={instrument.symbol}>
                {instrument.symbol}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Status Indicators */}
      <div className="flex items-center gap-4">
        {/* Connection Status */}
        <div className="flex items-center gap-1">
          {isConnected ? (
            <Wifi className="h-4 w-4 text-green-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-500" />
          )}
          <span className="text-xs text-muted-foreground">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        {/* Active Orders */}
        <div className="flex items-center gap-1">
          <Badge variant={activeOrders > 0 ? "default" : "secondary"} className="text-xs">
            {activeOrders} Orders
          </Badge>
        </div>

        {/* Position Count */}
        <div className="flex items-center gap-1">
          <Badge variant={positions.length > 0 ? "default" : "secondary"} className="text-xs">
            {positions.length} Positions
          </Badge>
        </div>

        {/* P&L */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">P&L:</span>
          <span className={`text-xs font-mono ${
            totalPnL > 0 ? 'text-green-500' : totalPnL < 0 ? 'text-red-500' : 'text-muted-foreground'
          }`}>
            {formatCurrency(totalPnL)}
          </span>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Controls */}
      <div className="flex items-center gap-2">
        {/* Tutorial Menu */}
        <TutorialMenu />

        {/* Notifications Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => updateSettings({ showNotifications: !settings.showNotifications })}
          className="h-8 w-8 p-0"
        >
          {settings.showNotifications ? (
            <Bell className="h-4 w-4" />
          ) : (
            <BellOff className="h-4 w-4" />
          )}
        </Button>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="h-8 w-8 p-0"
          data-tutorial="theme-toggle"
        >
          {isDarkMode ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>

        {/* Settings */}
        <SettingsDialog />
      </div>

      {/* Last Update Timestamp */}
      <div className="text-xs text-muted-foreground">
        Updated: {new Date(lastUpdate).toLocaleTimeString()}
      </div>
    </div>
  );
};
