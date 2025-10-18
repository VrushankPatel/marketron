import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line, Text, Sphere, Box } from '@react-three/drei';
import * as THREE from 'three';
import { Order, Trade } from '@/types/trading';

interface TradeJourneyProps {
  order: Order;
  trades?: Trade[];
  isActive?: boolean;
  onComplete?: () => void;
}

interface JourneyStep {
  id: string;
  position: [number, number, number];
  label: string;
  status: 'pending' | 'active' | 'completed';
  timestamp?: number;
}

export const TradeJourney: React.FC<TradeJourneyProps> = ({
  order,
  trades = [],
  isActive = false,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [journeyProgress, setJourneyProgress] = useState(0);
  const particleRef = useRef<THREE.Mesh>(null);

  // Define journey steps based on order lifecycle
  const journeySteps: JourneyStep[] = React.useMemo(() => {
    const baseSteps = [
      {
        id: 'entry',
        position: [-6, 2, 0] as [number, number, number],
        label: 'Order Entry',
        status: 'completed' as const,
        timestamp: order.timestamp
      },
      {
        id: 'validation',
        position: [-4, 2.5, 0] as [number, number, number],
        label: 'Validation',
        status: 'completed' as const,
        timestamp: order.timestamp + 10
      },
      {
        id: 'gateway',
        position: [-2, order.gatewayType === 'FIX' ? 3 : 1, 0] as [number, number, number],
        label: `${order.gatewayType} Gateway`,
        status: 'completed' as const,
        timestamp: order.timestamp + 50
      },
      {
        id: 'matching',
        position: [0, 2, 0] as [number, number, number],
        label: 'Matching Engine',
        status: order.status === 'NEW' ? 'active' : 'completed' as const,
        timestamp: order.timestamp + 100
      }
    ];

    // Add execution steps if order has fills
    if (order.filledQuantity > 0 || trades.length > 0) {
      baseSteps.push({
        id: 'execution',
        position: [2, 2, 0] as [number, number, number],
        label: 'Execution',
        status: order.status === 'FILLED' ? 'completed' : 'active' as const,
        timestamp: trades[0]?.timestamp || order.lastUpdateTime
      });

      baseSteps.push({
        id: 'clearing',
        position: [4, 2.5, 0] as [number, number, number],
        label: 'Clearing',
        status: order.status === 'FILLED' ? 'completed' : 'pending' as const,
        timestamp: (trades[0]?.timestamp || order.lastUpdateTime) + 1000
      });

      baseSteps.push({
        id: 'settlement',
        position: [6, 2, 0] as [number, number, number],
        label: 'Settlement',
        status: order.status === 'FILLED' ? 'completed' : 'pending' as const,
        timestamp: (trades[0]?.timestamp || order.lastUpdateTime) + 5000
      });
    }

    return baseSteps;
  }, [order, trades]);

  // Animate journey progress
  useFrame((state, delta) => {
    if (!isActive) return;

    setJourneyProgress(prev => {
      const newProgress = Math.min(prev + delta * 0.3, 1);
      
      const newStep = Math.floor(newProgress * (journeySteps.length - 1));
      if (newStep !== currentStep) {
        setCurrentStep(newStep);
      }

      if (newProgress >= 1 && onComplete) {
        onComplete();
      }

      return newProgress;
    });
  });

  // Calculate particle position along the journey path
  const particlePosition = React.useMemo(() => {
    if (journeySteps.length < 2) return journeySteps[0]?.position || [0, 0, 0];

    const segmentIndex = Math.min(Math.floor(journeyProgress * (journeySteps.length - 1)), journeySteps.length - 2);
    const segmentProgress = (journeyProgress * (journeySteps.length - 1)) - segmentIndex;

    const start = journeySteps[segmentIndex].position;
    const end = journeySteps[segmentIndex + 1].position;

    return [
      start[0] + (end[0] - start[0]) * segmentProgress,
      start[1] + (end[1] - start[1]) * segmentProgress,
      start[2] + (end[2] - start[2]) * segmentProgress,
    ] as [number, number, number];
  }, [journeySteps, journeyProgress]);

  const getStepColor = (step: JourneyStep, index: number) => {
    if (index < currentStep) return '#10b981'; // Completed - green
    if (index === currentStep) return '#f59e0b'; // Active - yellow
    return '#6b7280'; // Pending - gray
  };

  const getStepStatus = (step: JourneyStep, index: number) => {
    if (index < currentStep) return 'completed';
    if (index === currentStep) return 'active';
    return 'pending';
  };

  // Order color based on side
  const orderColor = order.side === 'BUY' ? '#10b981' : '#ef4444';

  return (
    <group>
      {/* Journey Steps */}
      {journeySteps.map((step, index) => {
        const stepColor = getStepColor(step, index);
        const stepStatus = getStepStatus(step, index);
        const isStepActive = stepStatus === 'active';

        return (
          <group key={step.id} position={step.position}>
            {/* Step Node */}
            <Box args={[0.8, 0.8, 0.8]}>
              <meshStandardMaterial
                color={stepColor}
                emissive={isStepActive ? stepColor : '#000000'}
                emissiveIntensity={isStepActive ? 0.3 : 0}
                transparent
                opacity={0.8}
              />
            </Box>

            {/* Step Label */}
            <Text
              position={[0, -0.8, 0]}
              fontSize={0.2}
              color="white"
              anchorX="center"
              anchorY="middle"
              font="/fonts/inter.json"
            >
              {step.label}
            </Text>

            {/* Status Indicator */}
            {stepStatus === 'completed' && (
              <Text
                position={[0, 0.6, 0]}
                fontSize={0.15}
                color="#10b981"
                anchorX="center"
                anchorY="middle"
                font="/fonts/inter.json"
              >
                ✓
              </Text>
            )}

            {stepStatus === 'active' && (
              <Sphere args={[1.2, 16, 16]} position={[0, 0, 0]}>
                <meshBasicMaterial
                  color={stepColor}
                  transparent
                  opacity={0.1}
                  wireframe
                />
              </Sphere>
            )}
          </group>
        );
      })}

      {/* Connection Lines */}
      {journeySteps.length > 1 && (
        <>
          {journeySteps.slice(0, -1).map((step, index) => {
            const nextStep = journeySteps[index + 1];
            const lineColor = index < currentStep ? '#10b981' : '#4a5568';
            
            return (
              <Line
                key={`line-${index}`}
                points={[step.position, nextStep.position]}
                color={lineColor}
                lineWidth={3}
                transparent
                opacity={index < currentStep ? 0.8 : 0.4}
              />
            );
          })}
        </>
      )}

      {/* Moving Particle */}
      {isActive && (
        <Sphere
          ref={particleRef}
          args={[0.15, 12, 12]}
          position={particlePosition}
        >
          <meshStandardMaterial
            color={orderColor}
            emissive={orderColor}
            emissiveIntensity={0.6}
            transparent
            opacity={0.9}
          />
        </Sphere>
      )}

      {/* Order Info Display */}
      <group position={[journeySteps[0]?.position[0] || 0, (journeySteps[0]?.position[1] || 0) + 1.5, 0]}>
        <Text
          fontSize={0.25}
          color="white"
          anchorX="center"
          anchorY="middle"
          font="/fonts/inter.json"
        >
          {order.symbol} {order.side} {order.quantity}
        </Text>
        <Text
          position={[0, -0.4, 0]}
          fontSize={0.18}
          color="#9ca3af"
          anchorX="center"
          anchorY="middle"
          font="/fonts/inter.json"
        >
          {order.orderType} {order.price && `@ ${order.price.toFixed(2)}`}
        </Text>
      </group>

      {/* Progress Indicator */}
      {isActive && (
        <group position={[(journeySteps[0]?.position[0] || 0) - 2, (journeySteps[0]?.position[1] || 0) - 2, 0]}>
          <Text
            fontSize={0.2}
            color="white"
            anchorX="left"
            anchorY="middle"
            font="/fonts/inter.json"
          >
            Progress: {(journeyProgress * 100).toFixed(0)}%
          </Text>
        </group>
      )}

      {/* Trade Execution Effects */}
      {trades.map((trade, index) => (
        <group key={trade.id} position={[2 + index * 0.2, 2.5, 0]}>
          <Sphere args={[0.1, 8, 8]}>
            <meshStandardMaterial
              color={trade.side === 'BUY' ? '#10b981' : '#ef4444'}
              emissive={trade.side === 'BUY' ? '#10b981' : '#ef4444'}
              emissiveIntensity={0.8}
            />
          </Sphere>
          <Text
            position={[0, -0.3, 0]}
            fontSize={0.12}
            color="white"
            anchorX="center"
            anchorY="middle"
            font="/fonts/inter.json"
          >
            {trade.quantity}@{trade.price.toFixed(2)}
          </Text>
        </group>
      ))}
    </group>
  );
};
