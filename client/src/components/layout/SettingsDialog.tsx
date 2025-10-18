import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Settings } from 'lucide-react';
import { useTradingStore } from '@/stores/useTradingStore';

export const SettingsDialog: React.FC = () => {
  const { settings, updateSettings } = useTradingStore();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure your trading platform preferences
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* General Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">General</h3>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifications">Notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Show notifications for trades and alerts
                </p>
              </div>
              <Switch
                id="notifications"
                checked={settings.showNotifications}
                onCheckedChange={(checked) =>
                  updateSettings({ showNotifications: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="autoRefresh">Auto Refresh</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically refresh market data
                </p>
              </div>
              <Switch
                id="autoRefresh"
                checked={settings.autoRefresh}
                onCheckedChange={(checked) =>
                  updateSettings({ autoRefresh: checked })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="refreshInterval">Refresh Interval (ms)</Label>
              <Input
                id="refreshInterval"
                type="number"
                value={settings.refreshInterval}
                onChange={(e) =>
                  updateSettings({ refreshInterval: parseInt(e.target.value) || 1000 })
                }
                min={100}
                max={10000}
                step={100}
              />
              <p className="text-xs text-muted-foreground">
                How often to refresh market data (100-10000ms)
              </p>
            </div>
          </div>

          <Separator />

          {/* Trading Defaults */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Trading Defaults</h3>

            <div className="space-y-2">
              <Label htmlFor="defaultQuantity">Default Quantity</Label>
              <Input
                id="defaultQuantity"
                type="number"
                value={settings.defaultQuantity}
                onChange={(e) =>
                  updateSettings({ defaultQuantity: parseInt(e.target.value) || 100 })
                }
                min={1}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultOrderType">Default Order Type</Label>
              <select
                id="defaultOrderType"
                value={settings.defaultOrderType}
                onChange={(e) =>
                  updateSettings({ defaultOrderType: e.target.value })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="LIMIT">Limit</option>
                <option value="MARKET">Market</option>
                <option value="STOP">Stop</option>
                <option value="STOP_LIMIT">Stop Limit</option>
              </select>
            </div>
          </div>

          <Separator />

          {/* Risk Limits */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Risk Limits</h3>

            <div className="space-y-2">
              <Label htmlFor="maxPositionSize">Max Position Size</Label>
              <Input
                id="maxPositionSize"
                type="number"
                value={settings.riskLimits.maxPositionSize}
                onChange={(e) =>
                  updateSettings({
                    riskLimits: {
                      ...settings.riskLimits,
                      maxPositionSize: parseInt(e.target.value) || 10000,
                    },
                  })
                }
                min={100}
                step={100}
              />
              <p className="text-xs text-muted-foreground">
                Maximum number of shares per position
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxDailyLoss">Max Daily Loss</Label>
              <Input
                id="maxDailyLoss"
                type="number"
                value={settings.riskLimits.maxDailyLoss}
                onChange={(e) =>
                  updateSettings({
                    riskLimits: {
                      ...settings.riskLimits,
                      maxDailyLoss: parseInt(e.target.value) || 5000,
                    },
                  })
                }
                min={100}
                step={100}
              />
              <p className="text-xs text-muted-foreground">
                Maximum daily loss allowed in dollars
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxOrderSize">Max Order Size</Label>
              <Input
                id="maxOrderSize"
                type="number"
                value={settings.riskLimits.maxOrderSize}
                onChange={(e) =>
                  updateSettings({
                    riskLimits: {
                      ...settings.riskLimits,
                      maxOrderSize: parseInt(e.target.value) || 1000,
                    },
                  })
                }
                min={1}
                step={10}
              />
              <p className="text-xs text-muted-foreground">
                Maximum number of shares per order
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
