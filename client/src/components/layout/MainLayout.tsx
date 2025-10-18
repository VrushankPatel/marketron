import React, { useState } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toolbar } from './Toolbar';
import { TradingWorkstation } from '@/components/trading/TradingWorkstation';
import { MarketOverview } from '@/components/market/MarketOverview';
import { RiskDashboard } from '@/components/risk/RiskDashboard';
import { TradeFlow3D } from '@/components/visualization/TradeFlow3D';
import { useTradingStore } from '@/stores/useTradingStore';
import { TutorialOverlay, AchievementNotification } from '@/components/tutorial';
import { cn } from '@/lib/utils';

export const MainLayout: React.FC = () => {
  const { activeTab, setActiveTab, layoutConfig, isDarkMode } = useTradingStore();

  return (
    <div className={cn("h-screen w-full flex flex-col bg-background", isDarkMode && "dark")}>
      <Toolbar />
      
      <div className="flex-1 flex flex-col min-h-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-4 bg-muted/50 border-b" role="tablist">
            <TabsTrigger value="trading" className="text-sm font-medium">
              Trading Workstation
            </TabsTrigger>
            <TabsTrigger value="market" className="text-sm font-medium" data-tutorial="market-tab">
              Market Overview
            </TabsTrigger>
            <TabsTrigger value="risk" className="text-sm font-medium" data-tutorial="risk-tab">
              Risk Dashboard
            </TabsTrigger>
            <TabsTrigger value="3d" className="text-sm font-medium" data-tutorial="3d-toggle">
              3D Visualization
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trading" className="flex-1 p-0 m-0">
            <TradingWorkstation />
          </TabsContent>

          <TabsContent value="market" className="flex-1 p-4">
            <MarketOverview />
          </TabsContent>

          <TabsContent value="risk" className="flex-1 p-4">
            <RiskDashboard />
          </TabsContent>

          <TabsContent value="3d" className="flex-1 p-0 m-0">
            <div className="h-full bg-black" data-tutorial="3d-canvas">
              <TradeFlow3D />
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Tutorial System */}
      <TutorialOverlay />
      <AchievementNotification />
    </div>
  );
};
