"use client"

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Heart, Cpu, Database, Server, AppWindow, ChevronRight, ChevronLeft, Repeat } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './ui/button'
import { useCommsSocket } from '@/hooks/use-comms-socket'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import ConnectionControls from './connection-controls'

const HeartbeatVisualizer = () => {
  const { latency: shLatency, connectionStatus: shStatus } = useCommsSocket('sh')  // StreamHandler connection
  const { latency: enLatency, connectionStatus: enStatus } = useCommsSocket('en')  // Engine connection
  const [isReversed, setIsReversed] = useState(false)

  // Calculate UI latency (time between state updates)
  const [uiLatency, setUiLatency] = useState(0)
  useEffect(() => {
    let lastUpdate = performance.now()
    const interval = setInterval(() => {
      const now = performance.now()
      setUiLatency(Math.round(now - lastUpdate))
      lastUpdate = now
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const stages = [
    { 
      name: 'Hardware', 
      icon: <Cpu className="h-4 w-4" />, 
      latency: null,
      status: 'unknown'
    },
    { 
      name: 'EN', 
      icon: <Database className="h-4 h-4" />, 
      latency: enLatency,
      status: enStatus
    },
    { 
      name: 'SH', 
      icon: <Server className="h-4 w-4" />, 
      latency: shLatency,
      status: shStatus
    },
    { 
      name: 'AriesUI', 
      icon: <AppWindow className="h-4 w-4" />, 
      latency: uiLatency,
      status: 'connected'  // Always connected since we're running
    },
    { 
      name: 'UI', 
      icon: <AppWindow className="h-4 w-4" />, 
      latency: Math.round(performance.now() % 10),  // Simulated UI render time
      status: 'connected'
    },
  ]

  const displayedStages = isReversed ? [...stages].reverse() : stages
  const totalLatency = stages
    .filter(stage => stage.latency !== null)
    .reduce((a, stage) => a + (stage.latency || 0), 0)
  const ArrowIcon = isReversed ? ChevronLeft : ChevronRight

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono cursor-pointer hover:bg-accent/50 px-2 py-1 rounded-md transition-colors">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
            className={cn(
              "transition-colors",
              stages.every(s => s.status === 'connected' || s.status === 'unknown') 
                ? "text-teal-500" 
                : "text-orange-500"
            )}
          >
            <Heart className="h-5 w-5" />
          </motion.div>
          <div className="flex items-center bg-background/50 px-2 py-1 rounded-md border border-border/50">
            {displayedStages.map((stage, index) => (
              <React.Fragment key={stage.name}>
                <div className="flex flex-col items-center text-center px-2">
                  <div className="flex items-center gap-1">
                    {stage.icon}
                    <span>{stage.name}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className={cn(
                      "text-xs",
                      stage.status === 'connected' ? (
                        stage.latency && stage.latency > 30 ? 'text-orange-400' : 'text-green-400'
                      ) : stage.status === 'unknown' ? 'text-muted-foreground' : 'text-red-400'
                    )}>
                      {stage.latency !== null ? `${stage.latency}ms` : '-'}
                    </span>
                    {stage.status !== 'unknown' && (
                      <span className={cn(
                        "text-[10px]",
                        stage.status === 'connected' ? 'text-green-400' : 'text-red-400'
                      )}>
                        {stage.status}
                      </span>
                    )}
                  </div>
                </div>
                {index < displayedStages.length - 1 && (
                  <motion.div
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear', delay: index * 0.2 }}
                  >
                    <ArrowIcon className="h-4 w-4" />
                  </motion.div>
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="flex flex-col items-center pl-2">
            <span>Total</span>
            <span className={cn(
              totalLatency > 100 ? 'text-red-500' : 'text-green-400',
              stages.some(s => s.status === 'disconnected') && 'text-red-500'
            )}>
              {totalLatency}ms
            </span>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onMouseEnter={() => setIsReversed(true)}
            onMouseLeave={() => setIsReversed(false)}
          >
            <Repeat className="h-4 w-4" />
          </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="end">
        <ConnectionControls />
      </PopoverContent>
    </Popover>
  )
}

export default HeartbeatVisualizer 