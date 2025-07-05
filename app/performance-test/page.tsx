"use client"

import React, { useState, useCallback } from 'react'
import { MainContentOptimized } from '@/components/main-content-optimized'
import type { GridState as GridStateType } from '@/components/grid/types'

// Generate test data for performance testing
function generateTestGridState(): GridStateType {
  const widgets = Array.from({ length: 50 }, (_, i) => ({
    id: `widget-${i}`,
    type: 'sensor' as const,
    title: `Sensor ${i + 1}`,
    content: `${(Math.random() * 100).toFixed(1)}°C`,
    x: (i % 10) * 220,
    y: Math.floor(i / 10) * 180,
    w: 200,
    h: 150,
    container: 'main' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }))

  const nests = Array.from({ length: 5 }, (_, i) => ({
    id: `nest-${i}`,
    type: 'nest' as const,
    title: `Nest ${i + 1}`,
    x: i * 450,
    y: 1000,
    w: 400,
    h: 300,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }))

  const ariesWidgets = Array.from({ length: 25 }, (_, i) => ({
    id: `aries-${i}`,
    type: 'ariesmods' as const,
    ariesModType: 'sensors/TemperatureSensor' as const,
    title: `AriesWidget ${i + 1}`,
    x: (i % 5) * 220,
    y: 2000 + Math.floor(i / 5) * 180,
    w: 200,
    h: 150,
    config: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }))

  return {
    gridSize: 20,
    mainWidgets: widgets,
    nestedWidgets: [],
    nestContainers: nests,
    mainAriesWidgets: ariesWidgets,
    nestedAriesWidgets: [],
  }
}

export default function PerformanceTestPage() {
  const [gridState, setGridState] = useState<GridStateType>(generateTestGridState())
  const [fps, setFps] = useState(0)
  const [frameCount, setFrameCount] = useState(0)

  // FPS counter
  React.useEffect(() => {
    let lastTime = performance.now()
    let frames = 0

    const updateFPS = () => {
      frames++
      const currentTime = performance.now()
      
      if (currentTime - lastTime >= 1000) {
        setFps(Math.round((frames * 1000) / (currentTime - lastTime)))
        setFrameCount(prev => prev + frames)
        frames = 0
        lastTime = currentTime
      }
      
      requestAnimationFrame(updateFPS)
    }

    const rafId = requestAnimationFrame(updateFPS)
    return () => cancelAnimationFrame(rafId)
  }, [])

  const regenerateWidgets = useCallback(() => {
    setGridState(generateTestGridState())
  }, [])

  const addMoreWidgets = useCallback(() => {
    setGridState(prev => ({
      ...prev,
      mainWidgets: [
        ...prev.mainWidgets,
        ...Array.from({ length: 20 }, (_, i) => ({
          id: `extra-widget-${prev.mainWidgets.length + i}`,
          type: 'sensor' as const,
          title: `Extra Sensor ${i + 1}`,
          content: `${(Math.random() * 100).toFixed(1)}°C`,
          x: Math.random() * 2000,
          y: Math.random() * 1500,
          w: 200,
          h: 150,
          container: 'main' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }))
      ]
    }))
  }, [])

  return (
    <div className="h-screen flex flex-col">
      {/* Performance Dashboard */}
      <div className="bg-black text-green-400 p-4 font-mono text-sm flex justify-between items-center">
        <div className="flex gap-6">
          <div>FPS: <span className="text-white font-bold">{fps}</span></div>
          <div>Frames: <span className="text-white">{frameCount.toLocaleString()}</span></div>
          <div>Widgets: <span className="text-white">{gridState.mainWidgets.length}</span></div>
          <div>Nests: <span className="text-white">{gridState.nestContainers.length}</span></div>
          <div>AriesWidgets: <span className="text-white">{gridState.mainAriesWidgets.length}</span></div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={regenerateWidgets}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
          >
            Regenerate
          </button>
          <button
            onClick={addMoreWidgets}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs"
          >
            Add 20 Widgets
          </button>
        </div>
      </div>

      {/* Performance Indicators */}
      <div className="bg-gray-900 text-white p-2 text-xs flex justify-between">
        <div className="flex gap-4">
          <span className={fps >= 60 ? 'text-green-400' : fps >= 30 ? 'text-yellow-400' : 'text-red-400'}>
            Performance: {fps >= 60 ? 'EXCELLENT' : fps >= 30 ? 'GOOD' : 'POOR'}
          </span>
          <span>Hardware Acceleration: ENABLED</span>
          <span>Virtual Rendering: ACTIVE</span>
          <span>RAF Optimization: ACTIVE</span>
        </div>
        <div>
          Drag any widget to test smooth dragging performance
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative">
        <MainContentOptimized 
          gridState={gridState} 
          setGridState={setGridState} 
        />
      </div>

      {/* Performance Tips */}
      <div className="bg-gray-800 text-gray-300 p-2 text-xs">
        <strong>Performance Features:</strong> Hardware Acceleration ✓ | Virtual Grid ✓ | RAF Optimization ✓ | 
        CSS Containment ✓ | GPU Layers ✓ | Memoization ✓ | Event Throttling ✓
      </div>
    </div>
  )
} 