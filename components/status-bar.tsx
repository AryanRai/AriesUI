"use client"

import { Badge } from "@/components/ui/badge"
import { useComms } from "@/components/comms-context"
import { useState, useEffect } from "react"

export function StatusBar() {
  const { state } = useComms()
  const [widgetCount, setWidgetCount] = useState(0)

  // Listen for widget count updates from main content
  useEffect(() => {
    const handleWidgetCountUpdate = (event: CustomEvent) => {
      setWidgetCount(event.detail.count)
    }

    window.addEventListener("widgetCountUpdate", handleWidgetCountUpdate as EventListener)
    return () => window.removeEventListener("widgetCountUpdate", handleWidgetCountUpdate as EventListener)
  }, [])

  const connectedStreams = state.streams.filter((s) => s.status === "connected").length
  const totalStreams = state.streams.length

  return (
    <div className="h-6 bg-muted/50 border-t border-border/40 flex items-center justify-between px-4 text-xs">
      <div className="flex items-center gap-4">
        <span>Ready</span>
        <Badge variant="outline" className="text-xs">
          Streams: {connectedStreams}/{totalStreams}
        </Badge>
        <Badge variant="outline" className="text-xs">
          Widgets: {widgetCount}
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">v1.0.0</span>
      </div>
    </div>
  )
}
