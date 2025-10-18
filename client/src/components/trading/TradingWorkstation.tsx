import React from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { OrderEntry } from './OrderEntry';
import { MarketDepth } from './MarketDepth';
import { OrderBlotter } from './OrderBlotter';
import { TradeBlotter } from './TradeBlotter';
import { PositionBlotter } from './PositionBlotter';
import { TradingChart } from '@/components/charts/TradingChart';
import { Watchlist } from '@/components/market/Watchlist';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTradingStore } from '@/stores/useTradingStore';

export const TradingWorkstation: React.FC = () => {
  const { layoutConfig } = useTradingStore();

  return (
    <div className="h-full flex flex-col bg-background">
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Left Panel - Order Entry & Market Data */}
        <ResizablePanel defaultSize={25} minSize={20}>
          <ResizablePanelGroup direction="vertical">
            {/* Order Entry */}
            {layoutConfig.showOrderEntry && (
              <>
                <ResizablePanel defaultSize={40} minSize={30}>
                  <div className="h-full border-r border-border">
                    <OrderEntry />
                  </div>
                </ResizablePanel>
                <ResizableHandle />
              </>
            )}
            
            {/* Market Depth */}
            {layoutConfig.showMarketDepth && (
              <>
                <ResizablePanel defaultSize={35} minSize={25}>
                  <div className="h-full border-r border-border">
                    <MarketDepth />
                  </div>
                </ResizablePanel>
                <ResizableHandle />
              </>
            )}

            {/* Watchlist */}
            <ResizablePanel defaultSize={25} minSize={20}>
              <div className="h-full border-r border-border">
                <Watchlist />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>

        <ResizableHandle />

        {/* Center Panel - Charts */}
        {layoutConfig.showCharts && (
          <>
            <ResizablePanel defaultSize={50} minSize={40}>
              <div className="h-full">
                <TradingChart />
              </div>
            </ResizablePanel>
            <ResizableHandle />
          </>
        )}

        {/* Right Panel - Blotters */}
        {layoutConfig.showBlotters && (
          <ResizablePanel defaultSize={25} minSize={20}>
            <div className="h-full flex flex-col">
              <Tabs defaultValue="orders" className="flex-1 flex flex-col">
                <TabsList className="grid w-full grid-cols-3 bg-muted/50 border-b">
                  <TabsTrigger value="orders" className="text-xs">Orders</TabsTrigger>
                  <TabsTrigger value="trades" className="text-xs">Trades</TabsTrigger>
                  <TabsTrigger value="positions" className="text-xs">Positions</TabsTrigger>
                </TabsList>
                
                <TabsContent value="orders" className="flex-1 p-0 m-0">
                  <OrderBlotter />
                </TabsContent>
                
                <TabsContent value="trades" className="flex-1 p-0 m-0">
                  <TradeBlotter />
                </TabsContent>
                
                <TabsContent value="positions" className="flex-1 p-0 m-0">
                  <PositionBlotter />
                </TabsContent>
              </Tabs>
            </div>
          </ResizablePanel>
        )}
      </ResizablePanelGroup>
    </div>
  );
};
