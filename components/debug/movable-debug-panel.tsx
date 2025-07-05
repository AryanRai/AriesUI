"use client"

import React, { useState, useRef, useEffect } from 'react'
import { X, GripVertical, Terminal, Minimize2, Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useLocalStorage } from '@/hooks/use-local-storage'

interface MovableDebugPanelProps {
  isVisible: boolean
  onToggleVisibility: (visible: boolean) => void
  viewport: { x: number; y: number; zoom: number }
  gridState: any
  dragState: any
  isPanning: boolean
  hardwareConnectionStatus: string
  isAutoSaveEnabled: boolean
  hasUnsavedChanges: boolean
}

export function MovableDebugPanel({
  isVisible,
  onToggleVisibility,
  viewport,
  gridState,
  dragState,
  isPanning,
  hardwareConnectionStatus,
  isAutoSaveEnabled,
  hasUnsavedChanges
}: MovableDebugPanelProps) {
  const [position, setPosition] = useLocalStorage("aries-debug-panel-pos", { top: 20, left: 20 })
  const [isMinimized, setIsMinimized] = useLocalStorage("aries-debug-panel-minimized", false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, top: 0, left: 0 })
  const panelRef = useRef<HTMLDivElement>(null)

  // Handle dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      top: position.top,
      left: position.left,
    })
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return

      const deltaX = e.clientX - dragStart.x
      const deltaY = e.clientY - dragStart.y

      const newTop = Math.max(0, Math.min(window.innerHeight - 100, dragStart.top + deltaY))
      const newLeft = Math.max(0, Math.min(window.innerWidth - 300, dragStart.left + deltaX))

      setPosition({ top: newTop, left: newLeft })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragStart, setPosition])

  if (!isVisible) {
    return (
      <Button
        onClick={() => onToggleVisibility(true)}
        size="sm"
        variant="ghost"
        className="fixed top-4 left-4 z-[100] h-8 w-8 p-0 bg-black/20 hover:bg-black/40 border border-green-500/50"
        title="Show debug panel (Ctrl+D)"
      >
        <Terminal className="h-4 w-4 text-green-400" />
      </Button>
    )
  }

  return (
    <Card
      ref={panelRef}
      className="fixed z-[100] bg-black/95 text-green-400 border-green-500/30 shadow-2xl font-mono text-xs min-w-[320px]"
      style={{
        top: position.top,
        left: position.left,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
    >
      <CardHeader className="py-2 px-3">
        <div className="flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-grab active:cursor-grabbing flex-1"
            onMouseDown={handleMouseDown}
          >
            <GripVertical className="h-4 w-4 text-green-400" />
            <CardTitle className="text-green-300 font-bold text-sm">
              ⚡ HARDWARE ACCELERATION ACTIVE
            </CardTitle>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              onClick={() => setIsMinimized(!isMinimized)}
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 text-yellow-400 hover:text-yellow-300"
              title={isMinimized ? "Expand panel" : "Minimize panel"}
            >
              {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
            </Button>
            
            <Button
              onClick={() => onToggleVisibility(false)}
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
              title="Hide debug panel (Ctrl+D)"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {!isMinimized && (
        <CardContent className="py-2 px-3 space-y-1">
          {/* Viewport Information */}
          <div className="text-cyan-400 font-semibold">VIEWPORT</div>
          <div>Position: ({viewport.x.toFixed(0)}, {viewport.y.toFixed(0)})</div>
          <div>Zoom: {(viewport.zoom * 100).toFixed(0)}%</div>
          
          {/* Widget Counts */}
          <div className="text-cyan-400 font-semibold mt-2">WIDGETS</div>
          <div>Main: {gridState.mainWidgets?.length || 0} | Nests: {gridState.nestContainers?.length || 0}</div>
          <div>AriesWidgets: {gridState.mainAriesWidgets?.length || 0}</div>
          <div>Enhanced Sensors: {gridState.mainWidgets?.filter((w: any) => w.type === 'enhanced-sensor').length || 0}</div>
          
          {/* System Status */}
          <div className="text-cyan-400 font-semibold mt-2">STATUS</div>
          <div>
            Interaction: {' '}
            <Badge variant="outline" className="text-xs">
              {dragState.isDragging ? 'DRAGGING' : isPanning ? 'PANNING' : 'READY'}
            </Badge>
          </div>
          
          {/* Performance Indicators */}
          <div className="text-cyan-400 font-semibold mt-2">PERFORMANCE</div>
          <div className="text-green-400">GPU Layers: ENABLED</div>
          <div className="text-green-400">RAF: ACTIVE</div>
          
          {/* Hardware Connection */}
          <div className="text-cyan-400 font-semibold mt-2">HARDWARE</div>
          <div className={`${hardwareConnectionStatus === 'connected' ? 'text-green-400' : 'text-red-400'}`}>
            Backend: {hardwareConnectionStatus.toUpperCase()}
          </div>
          
          {/* Auto-save Status */}
          <div className="text-cyan-400 font-semibold mt-2">DATA</div>
          <div>Auto-save: {isAutoSaveEnabled ? 'ON' : 'OFF'}</div>
          <div>Unsaved: {hasUnsavedChanges ? 'YES' : 'NO'}</div>
          
          {/* Keyboard Shortcuts */}
          <div className="text-cyan-400 font-semibold mt-2">SHORTCUTS</div>
          <div className="text-xs opacity-75">
            Ctrl+D: Toggle Panel | Ctrl+S: Save | Ctrl+Z: Undo
          </div>
          <div className="text-xs opacity-75">
            Ctrl+Wheel: Zoom | Middle Click: Pan
          </div>
        </CardContent>
      )}
    </Card>
  )
} 