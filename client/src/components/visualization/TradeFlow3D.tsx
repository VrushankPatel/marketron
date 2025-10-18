import React, { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Line, Sphere, Box, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Play, Pause, RotateCcw, Maximize2, Eye, SkipBack, SkipForward, Camera, Rewind, FastForward } from 'lucide-react';
import { useOrderStore } from '@/stores/useOrderStore';
import { useMarketDataStore } from '@/stores/useMarketDataStore';
import { TradeJourney } from './TradeJourney';

interface TradeFlowNode {
  id: string;
  position: [number, number, number];
  label: string;
  type: 'entry' | 'gateway' | 'matching' | 'execution' | 'clearing' | 'settlement';
  color: string;
}

const tradeFlowNodes: TradeFlowNode[] = [
  {
    id: 'order_entry',
    position: [-6, 2, 0],
    label: 'Order Entry',
    type: 'entry',
    color: '#3b82f6'
  },
  {
    id: 'fix_gateway',
    position: [-3, 3, 0],
    label: 'FIX Gateway',
    type: 'gateway',
    color: '#10b981'
  },
  {
    id: 'ouch_gateway',
    position: [-3, 1, 0],
    label: 'OUCH Gateway',
    type: 'gateway',
    color: '#10b981'
  },
  {
    id: 'matching_engine',
    position: [0, 2, 0],
    label: 'Matching Engine',
    type: 'matching',
    color: '#f59e0b'
  },
  {
    id: 'execution',
    position: [3, 2, 0],
    label: 'Execution',
    type: 'execution',
    color: '#ef4444'
  },
  {
    id: 'clearing',
    position: [6, 3, 0],
    label: 'Clearing House',
    type: 'clearing',
    color: '#8b5cf6'
  },
  {
    id: 'settlement',
    position: [6, 1, 0],
    label: 'Settlement',
    type: 'settlement',
    color: '#06b6d4'
  }
];

const Node: React.FC<{ node: TradeFlowNode; isActive?: boolean }> = ({ node, isActive = false }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current && isActive) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 2;
      const scale = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.1;
      meshRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group position={node.position}>
      <Box
        ref={meshRef}
        args={[1, 1, 1]}
        position={[0, 0, 0]}
      >
        <meshStandardMaterial
          color={node.color}
          emissive={isActive ? node.color : '#000000'}
          emissiveIntensity={isActive ? 0.3 : 0}
          transparent
          opacity={0.8}
        />
      </Box>
      <Text
        position={[0, -1, 0]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
        font="/fonts/inter.json"
      >
        {node.label}
      </Text>
      {isActive && (
        <Sphere args={[1.5, 16, 16]} position={[0, 0, 0]}>
          <meshBasicMaterial
            color={node.color}
            transparent
            opacity={0.1}
            wireframe
          />
        </Sphere>
      )}
    </group>
  );
};

const TradeParticle: React.FC<{ 
  path: [number, number, number][]; 
  progress: number; 
  color: string;
  onComplete?: () => void;
}> = ({ path, progress, color, onComplete }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useEffect(() => {
    if (progress >= 1 && onComplete) {
      onComplete();
    }
  }, [progress, onComplete]);

  const currentPosition = React.useMemo(() => {
    if (path.length < 2) return path[0] || [0, 0, 0];
    
    const segmentIndex = Math.min(Math.floor(progress * (path.length - 1)), path.length - 2);
    const segmentProgress = (progress * (path.length - 1)) - segmentIndex;
    
    const start = path[segmentIndex];
    const end = path[segmentIndex + 1];
    
    return [
      start[0] + (end[0] - start[0]) * segmentProgress,
      start[1] + (end[1] - start[1]) * segmentProgress,
      start[2] + (end[2] - start[2]) * segmentProgress,
    ];
  }, [path, progress]);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 4;
      meshRef.current.rotation.y = state.clock.elapsedTime * 6;
    }
  });

  return (
    <Sphere
      ref={meshRef}
      args={[0.1, 8, 8]}
      position={currentPosition as [number, number, number]}
    >
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.5}
        transparent
        opacity={0.8}
      />
    </Sphere>
  );
};

const ConnectionLines: React.FC = () => {
  const connections = [
    [tradeFlowNodes[0].position, tradeFlowNodes[1].position], // Order Entry -> FIX
    [tradeFlowNodes[0].position, tradeFlowNodes[2].position], // Order Entry -> OUCH
    [tradeFlowNodes[1].position, tradeFlowNodes[3].position], // FIX -> Matching
    [tradeFlowNodes[2].position, tradeFlowNodes[3].position], // OUCH -> Matching
    [tradeFlowNodes[3].position, tradeFlowNodes[4].position], // Matching -> Execution
    [tradeFlowNodes[4].position, tradeFlowNodes[5].position], // Execution -> Clearing
    [tradeFlowNodes[4].position, tradeFlowNodes[6].position], // Execution -> Settlement
  ];

  return (
    <>
      {connections.map((connection, index) => (
        <Line
          key={index}
          points={connection}
          color="#4a5568"
          lineWidth={2}
          transparent
          opacity={0.6}
        />
      ))}
    </>
  );
};

const Scene3D: React.FC<{ 
  isPlaying: boolean; 
  speed: number; 
  viewMode: string;
  activeOrders: any[];
}> = ({ isPlaying, speed, viewMode, activeOrders }) => {
  const [activeNodes, setActiveNodes] = useState<Set<string>>(new Set());
  const [particles, setParticles] = useState<Array<{
    id: string;
    path: [number, number, number][];
    progress: number;
    color: string;
  }>>([]);

  // Simulate trade flow based on active orders
  useEffect(() => {
    if (!isPlaying || activeOrders.length === 0) return;

    const interval = setInterval(() => {
      const randomOrder = activeOrders[Math.floor(Math.random() * activeOrders.length)];
      const particleColor = randomOrder.side === 'BUY' ? '#10b981' : '#ef4444';
      
      // Create particle path
      const path: [number, number, number][] = [
        tradeFlowNodes[0].position, // Order Entry
        tradeFlowNodes[Math.random() > 0.5 ? 1 : 2].position, // Random Gateway
        tradeFlowNodes[3].position, // Matching Engine
        tradeFlowNodes[4].position, // Execution
        tradeFlowNodes[Math.random() > 0.5 ? 5 : 6].position, // Random final destination
      ];

      const newParticle = {
        id: `particle_${Date.now()}_${Math.random()}`,
        path,
        progress: 0,
        color: particleColor,
      };

      setParticles(prev => [...prev, newParticle]);

      // Animate particle
      let progress = 0;
      const animationInterval = setInterval(() => {
        progress += 0.02 * speed;
        
        setParticles(prev =>
          prev.map(p =>
            p.id === newParticle.id
              ? { ...p, progress: Math.min(progress, 1) }
              : p
          )
        );

        // Update active nodes based on particle position
        const currentNodeIndex = Math.floor(progress * (path.length - 1));
        if (currentNodeIndex < tradeFlowNodes.length) {
          setActiveNodes(prev => new Set([...prev, tradeFlowNodes[currentNodeIndex].id]));
          setTimeout(() => {
            setActiveNodes(prev => {
              const next = new Set(prev);
              next.delete(tradeFlowNodes[currentNodeIndex].id);
              return next;
            });
          }, 1000);
        }

        if (progress >= 1) {
          clearInterval(animationInterval);
          setParticles(prev => prev.filter(p => p.id !== newParticle.id));
        }
      }, 50);
    }, 2000 / speed);

    return () => clearInterval(interval);
  }, [isPlaying, speed, activeOrders]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={0.8} />
      <pointLight position={[-10, -10, -10]} intensity={0.4} />
      
      {/* Nodes */}
      {tradeFlowNodes.map(node => (
        <Node
          key={node.id}
          node={node}
          isActive={activeNodes.has(node.id)}
        />
      ))}
      
      {/* Connection Lines */}
      <ConnectionLines />
      
      {/* Trade Particles */}
      {particles.map(particle => (
        <TradeParticle
          key={particle.id}
          path={particle.path}
          progress={particle.progress}
          color={particle.color}
        />
      ))}
      
      {/* Grid */}
      <gridHelper args={[20, 20]} position={[0, -3, 0]} />
      
      {/* Camera Controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        maxDistance={20}
        minDistance={5}
      />
    </>
  );
};

type CameraPreset = 'overview' | 'top' | 'side' | 'front' | 'closeup' | 'orbit';

export const TradeFlow3D: React.FC = () => {
  const { orders } = useOrderStore();
  const { isConnected } = useMarketDataStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState([1]);
  const [viewMode, setViewMode] = useState('overview');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('overview');
  const [replayMode, setReplayMode] = useState(false);
  const [replayProgress, setReplayProgress] = useState(0);
  const [recordedTrades, setRecordedTrades] = useState<any[]>([]);

  const activeOrders = orders.filter(order => 
    order.status === 'NEW' || order.status === 'PARTIALLY_FILLED'
  );

  const stats = {
    totalOrders: orders.length,
    activeOrders: activeOrders.length,
    completedOrders: orders.filter(order => order.status === 'FILLED').length,
  };

  const cameraPositions: Record<CameraPreset, [number, number, number]> = {
    overview: [0, 5, 10],
    top: [0, 15, 0],
    side: [15, 5, 0],
    front: [0, 5, -10],
    closeup: [0, 3, 5],
    orbit: [10, 10, 10],
  };

  const handleReplayStart = () => {
    setReplayMode(true);
    setReplayProgress(0);
    setRecordedTrades(orders.filter(o => o.status === 'FILLED').slice(-10));
  };

  const handleReplayStop = () => {
    setReplayMode(false);
    setReplayProgress(0);
  };

  const handleSeek = (value: number[]) => {
    setReplayProgress(value[0]);
  };

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50' : 'h-full'} bg-black`}>
      {/* Controls */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 max-w-[240px]">
        <Card className="bg-black/80 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white">Trade Flow Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Playback Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPlaying(!isPlaying)}
                className="bg-black/50 border-gray-600 text-white hover:bg-gray-800"
              >
                {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsPlaying(false);
                }}
                className="bg-black/50 border-gray-600 text-white hover:bg-gray-800"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="bg-black/50 border-gray-600 text-white hover:bg-gray-800"
              >
                {isFullscreen ? <Eye className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
              </Button>
            </div>

            {/* Replay Controls */}
            <div className="space-y-2 pt-2 border-t border-gray-700">
              <Label className="text-xs">Replay Controls</Label>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReplayStart}
                  disabled={replayMode}
                  className="bg-black/50 border-gray-600 text-white hover:bg-gray-800 text-xs"
                >
                  <Rewind className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReplayProgress(Math.max(0, replayProgress - 10))}
                  disabled={!replayMode}
                  className="bg-black/50 border-gray-600 text-white hover:bg-gray-800 text-xs"
                >
                  <SkipBack className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReplayProgress(Math.min(100, replayProgress + 10))}
                  disabled={!replayMode}
                  className="bg-black/50 border-gray-600 text-white hover:bg-gray-800 text-xs"
                >
                  <SkipForward className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReplayStop}
                  disabled={!replayMode}
                  className="bg-black/50 border-gray-600 text-white hover:bg-gray-800 text-xs"
                >
                  <FastForward className="h-3 w-3" />
                </Button>
              </div>
              {replayMode && (
                <div className="space-y-1">
                  <label className="text-xs text-gray-300">Progress: {replayProgress}%</label>
                  <Slider
                    value={[replayProgress]}
                    onValueChange={handleSeek}
                    min={0}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>
              )}
            </div>

            {/* Camera Presets */}
            <div className="space-y-2 pt-2 border-t border-gray-700">
              <Label className="text-xs flex items-center gap-1">
                <Camera className="h-3 w-3" />
                Camera Preset
              </Label>
              <div className="grid grid-cols-2 gap-1">
                {(['overview', 'top', 'side', 'front', 'closeup', 'orbit'] as CameraPreset[]).map((preset) => (
                  <Button
                    key={preset}
                    variant={cameraPreset === preset ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCameraPreset(preset)}
                    className="text-xs capitalize"
                  >
                    {preset}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Speed Control */}
            <div className="space-y-1">
              <label className="text-xs text-gray-300">Speed: {speed[0]}x</label>
              <Slider
                value={speed}
                onValueChange={setSpeed}
                min={0.1}
                max={5}
                step={0.1}
                className="w-32"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistics */}
      <div className="absolute top-4 right-4 z-10">
        <Card className="bg-black/80 border-gray-700">
          <CardContent className="p-3">
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="text-center">
                <div className="text-gray-400">Total Orders</div>
                <div className="text-white font-bold">{stats.totalOrders}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400">Active</div>
                <div className="text-yellow-400 font-bold">{stats.activeOrders}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400">Completed</div>
                <div className="text-green-400 font-bold">{stats.completedOrders}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Connection Status */}
      <div className="absolute bottom-4 left-4 z-10">
        <Badge variant={isConnected ? "default" : "destructive"} className="bg-black/80">
          {isConnected ? "Connected" : "Disconnected"}
        </Badge>
      </div>

      {/* 3D Canvas */}
      <Canvas
        camera={{ position: cameraPositions[cameraPreset], fov: 45 }}
        gl={{ antialias: true, alpha: false }}
        key={cameraPreset}
      >
        <color attach="background" args={['#000000']} />
        <Suspense fallback={null}>
          <Scene3D
            isPlaying={isPlaying}
            speed={speed[0]}
            viewMode={viewMode}
            activeOrders={activeOrders}
          />
        </Suspense>
      </Canvas>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 z-10">
        <Card className="bg-black/80 border-gray-700">
          <CardContent className="p-3">
            <div className="text-xs text-white space-y-1">
              <div className="font-semibold mb-2">Legend</div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Buy Orders</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span>Sell Orders</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span>Order Entry</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span>Matching Engine</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
