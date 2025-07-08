import React from "react"
import { ViewportState } from "../types"

interface ViewportInfoProps {
  viewport: ViewportState
}

export const ViewportInfo: React.FC<ViewportInfoProps> = ({ viewport }) => {
  return (
    <div className="absolute top-4 left-4 z-30 text-xs text-muted-foreground bg-background/80 px-3 py-2 rounded backdrop-blur border border-border/50">
      <div>Zoom: {(viewport.zoom * 100).toFixed(0)}%</div>
      <div>
        Position: ({Math.round(viewport.x)}, {Math.round(viewport.y)})
      </div>
      <div className="text-xs opacity-75 mt-1">Ctrl+Wheel: Zoom • Middle Click: Pan • Ctrl+Click: Pan</div>
    </div>
  )
}