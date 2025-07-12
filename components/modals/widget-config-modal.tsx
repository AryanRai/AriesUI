"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useComms } from "@/components/comms-context"
import { motion } from "framer-motion"
import { useAnimationPreferences } from "@/hooks/use-animation-preferences"
import { Settings, Zap } from "lucide-react"

export function WidgetConfigModal() {
  const { state, dispatch } = useComms()
  const { animationsEnabled } = useAnimationPreferences()

  const MotionWrapper = animationsEnabled ? motion.div : 'div'

  return (
    <Dialog open={true} onOpenChange={() => dispatch({ type: "SET_MODAL", payload: null })}>
      <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur border-teal-500/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-teal-300">
            <Settings className="h-5 w-5" />
            Widget Configuration
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <MotionWrapper
            {...(animationsEnabled ? {
              initial: { opacity: 0, y: 10 },
              animate: { opacity: 1, y: 0 },
              transition: { delay: 0.1 }
            } : {})}
          >
            <div className="space-y-2">
              <Label htmlFor="grid-select" className="text-slate-300">Target Grid</Label>
              <Select>
                <SelectTrigger className="border-teal-500/20 bg-background/50 backdrop-blur hover:border-teal-500/40">
                  <SelectValue placeholder="Select grid" />
                </SelectTrigger>
                <SelectContent className="border-teal-500/20 bg-background/95 backdrop-blur">
                  <SelectItem value="main">Main Grid</SelectItem>
                  <SelectItem value="nested-1">Nested Grid 1</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </MotionWrapper>

          <MotionWrapper
            {...(animationsEnabled ? {
              initial: { opacity: 0, y: 10 },
              animate: { opacity: 1, y: 0 },
              transition: { delay: 0.2 }
            } : {})}
          >
            <div className="space-y-2">
              <Label htmlFor="widget-type" className="text-slate-300">Widget Type</Label>
              <Select>
                <SelectTrigger className="border-teal-500/20 bg-background/50 backdrop-blur hover:border-teal-500/40">
                  <SelectValue placeholder="Select widget type" />
                </SelectTrigger>
                <SelectContent className="border-teal-500/20 bg-background/95 backdrop-blur">
                  <SelectItem value="sensor">Sensor Display</SelectItem>
                  <SelectItem value="chart">Chart Widget</SelectItem>
                  <SelectItem value="status">Status Indicator</SelectItem>
                  <SelectItem value="gauge">Gauge Widget</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </MotionWrapper>

          <MotionWrapper
            {...(animationsEnabled ? {
              initial: { opacity: 0, y: 10 },
              animate: { opacity: 1, y: 0 },
              transition: { delay: 0.3 }
            } : {})}
          >
            <div className="space-y-2">
              <Label htmlFor="stream-select" className="text-slate-300">Data Stream</Label>
              <Select>
                <SelectTrigger className="border-teal-500/20 bg-background/50 backdrop-blur hover:border-teal-500/40">
                  <SelectValue placeholder="Select data stream" />
                </SelectTrigger>
                <SelectContent className="border-teal-500/20 bg-background/95 backdrop-blur">
                  {state.streams.map((stream) => (
                    <SelectItem key={stream.id} value={stream.id}>
                      {stream.name} ({stream.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </MotionWrapper>
        </div>
        
        <MotionWrapper
          {...(animationsEnabled ? {
            initial: { opacity: 0, y: 10 },
            animate: { opacity: 1, y: 0 },
            transition: { delay: 0.4 }
          } : {})}
        >
          <div className="flex justify-end gap-2 mt-6">
            <Button 
              variant="outline" 
              onClick={() => dispatch({ type: "SET_MODAL", payload: null })}
              className="border-teal-500/20 hover:border-teal-500/40 hover:bg-teal-500/10"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => dispatch({ type: "SET_MODAL", payload: null })}
              className="bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 text-teal-300"
            >
              <Zap className="h-4 w-4 mr-2" />
              Save Configuration
            </Button>
          </div>
        </MotionWrapper>
      </DialogContent>
    </Dialog>
  )
}
