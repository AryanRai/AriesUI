"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useComms } from "@/components/comms-context"

export function PerformanceModal() {
  const { dispatch } = useComms()
  const [cpuUsage, setCpuUsage] = useState(45)
  const [memoryUsage, setMemoryUsage] = useState(62)
  const [cpuHistory, setCpuHistory] = useState<number[]>([])
  const [memoryHistory, setMemoryHistory] = useState<number[]>([])

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate performance data
      const newCpu = Math.max(0, Math.min(100, cpuUsage + (Math.random() - 0.5) * 10))
      const newMemory = Math.max(0, Math.min(100, memoryUsage + (Math.random() - 0.5) * 5))

      setCpuUsage(newCpu)
      setMemoryUsage(newMemory)

      setCpuHistory((prev) => [...prev.slice(-19), newCpu])
      setMemoryHistory((prev) => [...prev.slice(-19), newMemory])
    }, 2000)

    return () => clearInterval(interval)
  }, [cpuUsage, memoryUsage])

  return (
    <Dialog open={true} onOpenChange={() => dispatch({ type: "SET_MODAL", payload: null })}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Performance Monitor</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">CPU Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cpuUsage.toFixed(1)}%</div>
              <div className="w-full bg-muted rounded-full h-2 mt-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-500"
                  style={{ width: `${cpuUsage}%` }}
                />
              </div>
              <div className="mt-4 h-16 flex items-end gap-1">
                {cpuHistory.map((value, index) => (
                  <div
                    key={index}
                    className="bg-primary/60 w-2 rounded-t"
                    style={{ height: `${(value / 100) * 64}px` }}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Memory Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{memoryUsage.toFixed(1)}%</div>
              <div className="w-full bg-muted rounded-full h-2 mt-2">
                <div
                  className="bg-secondary h-2 rounded-full transition-all duration-500"
                  style={{ width: `${memoryUsage}%` }}
                />
              </div>
              <div className="mt-4 h-16 flex items-end gap-1">
                {memoryHistory.map((value, index) => (
                  <div
                    key={index}
                    className="bg-secondary/60 w-2 rounded-t"
                    style={{ height: `${(value / 100) * 64}px` }}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
