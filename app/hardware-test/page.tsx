"use client"

import React from 'react'
import { EnhancedSensorWidget } from '@/components/widgets/enhanced-sensor-widget'
import { HardwareAcceleratedWidget } from '@/components/widgets/hardware-accelerated-widget'

export default function HardwareTestPage() {
  const mockStreamMappings = [
    {
      id: 'temp1',
      streamId: 'module1.temperature',
      streamName: 'Chamber Temperature',
      multiplier: 1.0,
      formula: 'x',
      unit: '°C',
      enabled: true
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/80 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">
          🚀 Hardware Widget Test
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Enhanced Sensor Widget */}
          <div className="relative">
            <h2 className="text-lg font-semibold mb-4">Enhanced Sensor Widget</h2>
            <HardwareAcceleratedWidget
              id="test-sensor-1"
              x={0}
              y={0}
              width={250}
              height={180}
              onMouseDown={() => console.log('Sensor 1 clicked')}
              onRemove={() => console.log('Remove sensor 1')}
            >
              <EnhancedSensorWidget
                widgetId="test-sensor-1"
                title="Temperature Sensor"
                sensorType="temperature"
                streamMappings={mockStreamMappings}
                onStreamMappingsChange={(mappings) => console.log('Stream mappings changed:', mappings)}
                className="w-full h-full"
                showTrend={true}
                precision={1}
                thresholds={{
                  warning: { min: 0, max: 50 },
                  critical: { min: -10, max: 70 }
                }}
              />
            </HardwareAcceleratedWidget>
          </div>

          {/* Pressure Sensor */}
          <div className="relative">
            <h2 className="text-lg font-semibold mb-4">Pressure Sensor</h2>
            <HardwareAcceleratedWidget
              id="test-sensor-2"
              x={0}
              y={0}
              width={250}
              height={180}
              onMouseDown={() => console.log('Sensor 2 clicked')}
              onRemove={() => console.log('Remove sensor 2')}
            >
              <EnhancedSensorWidget
                widgetId="test-sensor-2"
                title="Pressure Monitor"
                sensorType="pressure"
                streamMappings={[{
                  id: 'pressure1',
                  streamId: 'module1.pressure',
                  streamName: 'Chamber Pressure',
                  multiplier: 1.0,
                  formula: 'x / 1000',
                  unit: 'kPa',
                  enabled: true
                }]}
                onStreamMappingsChange={(mappings) => console.log('Pressure mappings:', mappings)}
                className="w-full h-full"
                showTrend={true}
                precision={2}
                thresholds={{
                  warning: { min: 100, max: 500 },
                  critical: { min: 50, max: 600 }
                }}
              />
            </HardwareAcceleratedWidget>
          </div>

          {/* Voltage Sensor */}
          <div className="relative">
            <h2 className="text-lg font-semibold mb-4">Voltage Monitor</h2>
            <HardwareAcceleratedWidget
              id="test-sensor-3"
              x={0}
              y={0}
              width={250}
              height={180}
              onMouseDown={() => console.log('Sensor 3 clicked')}
              onRemove={() => console.log('Remove sensor 3')}
            >
              <EnhancedSensorWidget
                widgetId="test-sensor-3"
                title="Power Supply"
                sensorType="voltage"
                streamMappings={[{
                  id: 'voltage1',
                  streamId: 'module1.voltage',
                  streamName: 'Supply Voltage',
                  multiplier: 1.0,
                  formula: 'x',
                  unit: 'V',
                  enabled: true
                }]}
                onStreamMappingsChange={(mappings) => console.log('Voltage mappings:', mappings)}
                className="w-full h-full"
                showTrend={false}
                precision={2}
                thresholds={{
                  warning: { min: 11.5, max: 12.5 },
                  critical: { min: 10, max: 14 }
                }}
              />
            </HardwareAcceleratedWidget>
          </div>

          {/* Current Sensor */}
          <div className="relative">
            <h2 className="text-lg font-semibold mb-4">Current Monitor</h2>
            <HardwareAcceleratedWidget
              id="test-sensor-4"
              x={0}
              y={0}
              width={250}
              height={180}
              onMouseDown={() => console.log('Sensor 4 clicked')}
              onRemove={() => console.log('Remove sensor 4')}
            >
              <EnhancedSensorWidget
                widgetId="test-sensor-4"
                title="Load Current"
                sensorType="current"
                streamMappings={[{
                  id: 'current1',
                  streamId: 'module1.current',
                  streamName: 'Load Current',
                  multiplier: 1000,
                  formula: 'x * 1000',
                  unit: 'mA',
                  enabled: true
                }]}
                onStreamMappingsChange={(mappings) => console.log('Current mappings:', mappings)}
                className="w-full h-full"
                showTrend={true}
                precision={0}
                thresholds={{
                  warning: { min: 100, max: 800 },
                  critical: { min: 50, max: 1000 }
                }}
              />
            </HardwareAcceleratedWidget>
          </div>

          {/* Generic Sensor */}
          <div className="relative">
            <h2 className="text-lg font-semibold mb-4">Generic Sensor</h2>
            <HardwareAcceleratedWidget
              id="test-sensor-5"
              x={0}
              y={0}
              width={250}
              height={180}
              onMouseDown={() => console.log('Sensor 5 clicked')}
              onRemove={() => console.log('Remove sensor 5')}
            >
              <EnhancedSensorWidget
                widgetId="test-sensor-5"
                title="Custom Sensor"
                sensorType="generic"
                streamMappings={[{
                  id: 'custom1',
                  streamId: 'module1.custom',
                  streamName: 'Custom Reading',
                  multiplier: 1.0,
                  formula: 'Math.sin(x * Math.PI / 180)',
                  unit: 'units',
                  enabled: true
                }]}
                onStreamMappingsChange={(mappings) => console.log('Custom mappings:', mappings)}
                className="w-full h-full"
                showTrend={true}
                precision={3}
              />
            </HardwareAcceleratedWidget>
          </div>

          {/* Hardware Status */}
          <div className="relative">
            <h2 className="text-lg font-semibold mb-4">Hardware Status</h2>
            <div className="bg-card border rounded-lg p-4 h-[180px] flex flex-col justify-center items-center">
              <div className="text-2xl mb-2">⚡</div>
              <div className="text-lg font-semibold text-green-500 mb-2">Hardware Acceleration</div>
              <div className="text-sm text-muted-foreground text-center">
                GPU layers active<br/>
                RequestAnimationFrame enabled<br/>
                60fps rendering ready
              </div>
              <div className="mt-4 flex gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <div className="text-xs text-green-500">ACTIVE</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <div className="bg-card border rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">🎯 Hardware Integration Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center justify-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Enhanced Widgets: Ready</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Stream Configurators: Active</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span>Backend Connection: Pending</span>
              </div>
            </div>
            <div className="mt-4 text-muted-foreground">
              All widgets are ready for hardware stream integration. 
              Connect to your StreamHandler to see live data.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 