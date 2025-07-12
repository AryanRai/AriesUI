/**
 * PerformanceMonitor Component
 * 
 * Displays performance metrics and hardware acceleration status.
 * Extracted from main-content.tsx for better modularity.
 */

import React from "react"

export interface PerformanceMonitorProps {
  totalWidgets: number
  renderedWidgets: number
  cullingPercentage: number
  isVisible?: boolean
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  totalWidgets,
  renderedWidgets,
  cullingPercentage,
  isVisible = true,
}) => {
  if (!isVisible) return null

  return (
    <div className="absolute bottom-4 right-4 z-50 bg-black/80 text-green-400 px-3 py-1 rounded text-xs font-mono">
      ⚡ Hardware Acceleration: ACTIVE | Virtual Grid: {cullingPercentage.toFixed(2)}% | Rendered: {renderedWidgets}/{totalWidgets}
    </div>
  )
}