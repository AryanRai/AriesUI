"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Cpu, Database, Server, AppWindow, ChevronRight, ChevronLeft, Repeat } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './ui/button'
import { usePingMonitor } from '@/hooks/use-ping-monitor'
import { useAnimationPreferences } from '@/hooks/use-animation-preferences'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import ConnectionControls from './connection-controls'

const HeartbeatVisualizer = () => {
  const { pingData, pingIntervals, isConnected, reconnect } = usePingMonitor()
  const { animationsEnabled } = useAnimationPreferences()
  const [isReversed, setIsReversed] = useState(false)
  const [renderLatency, setRenderLatency] = useState(0)

  // Calculate UI latency (time between state updates)
  const [uiLatency, setUiLatency] = useState(0)
  useEffect(() => {
    console.log('🔄 UI latency effect restarting with interval:', pingIntervals.ui + 'ms')
    
    let lastUpdate = performance.now()
    
    const updateLatency = () => {
      const now = performance.now()
      setUiLatency(Math.round(now - lastUpdate))
      lastUpdate = now
    }
    
    const interval = setInterval(updateLatency, pingIntervals.ui)
    
    // Initial update
    updateLatency()
    
    return () => {
      console.log('🔄 UI latency effect cleanup')
      clearInterval(interval)
    }
  }, [pingIntervals.ui])

  // Measure actual render performance
  useEffect(() => {
    console.log('🎨 Render latency effect restarting with interval:', Math.max(pingIntervals.ui * 2, 100) + 'ms')
    
    const measureRender = () => {
      const start = performance.now()
      requestAnimationFrame(() => {
        const end = performance.now()
        setRenderLatency(Math.round(end - start))
      })
    }
    
    const interval = setInterval(measureRender, Math.max(pingIntervals.ui * 2, 100)) // Measure every 2x UI update interval, min 100ms
    
    // Initial measurement
    measureRender()
    
    return () => {
      console.log('🎨 Render latency effect cleanup')
      clearInterval(interval)
    }
  }, [pingIntervals.ui])

  const stages = [
    { 
      name: 'Hardware', 
      icon: <Cpu className="h-4 w-4" />, 
      latency: null,
      status: 'unknown'
    },
    { 
      name: 'EN', 
      icon: <Database className="h-4 w-4" />, 
      latency: pingData.en.latency,
      status: pingData.en.status
    },
    { 
      name: 'SH', 
      icon: <Server className="h-4 w-4" />, 
      latency: pingData.sh.latency,
      status: pingData.sh.status
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
      latency: renderLatency,  // Use actual render latency measurement
      status: 'connected'
    },
  ]

  const displayedStages = isReversed ? [...stages].reverse() : stages
  const totalLatency = stages
    .filter(stage => stage.latency !== null)
    .reduce((a, stage) => a + (stage.latency || 0), 0)
  const ArrowIcon = isReversed ? ChevronLeft : ChevronRight
  const MotionWrapper = animationsEnabled ? motion.div : 'div'

  return (
    <Popover>
      <PopoverTrigger asChild>
        <MotionWrapper 
          className="flex items-center gap-2 text-xs text-muted-foreground font-mono cursor-pointer hover:bg-teal-500/10 px-2 py-1 rounded-md transition-colors border border-transparent hover:border-teal-500/20"
          {...(animationsEnabled ? {
            whileHover: { scale: 1.02 },
            whileTap: { scale: 0.98 }
          } : {})}
        >
          <MotionWrapper
            {...(animationsEnabled ? {
              animate: { scale: [1, 1.2, 1] },
              transition: { duration: 1, repeat: Infinity, ease: "easeInOut" }
            } : {})}
            className={cn(
              "transition-colors",
              isConnected && stages.every(s => s.status === 'connected' || s.status === 'unknown') 
                ? "text-green-400" 
                : stages.some(s => s.status === 'disconnected')
                ? "text-red-400"
                : "text-orange-400"
            )}
          >
            <Heart className="h-5 w-5" />
          </MotionWrapper>
          <div className="flex items-center bg-background/50 px-2 py-1 rounded-md border border-teal-500/20 backdrop-blur">
            <div className="flex items-center gap-1 pr-2 border-r border-teal-500/20">
              <motion.div 
                className={cn(
                  "h-2 w-2 rounded-full",
                  isConnected 
                    ? stages.every(s => s.status === 'connected' || s.status === 'unknown') 
                      ? "bg-green-400" 
                      : "bg-orange-400"
                    : "bg-red-500"
                )} 
                {...(animationsEnabled ? {
                  animate: isConnected ? { 
                    scale: [1, 1.2, 1],
                    opacity: [0.7, 1, 0.7] 
                  } : {
                    scale: [1, 1.1, 1],
                    opacity: [0.5, 0.8, 0.5]
                  },
                  transition: { duration: 1.5, repeat: Infinity }
                } : {})}
              />
              <span className="text-xs text-teal-300">
                {isConnected 
                  ? stages.every(s => s.status === 'connected' || s.status === 'unknown')
                    ? "Nominal Link"
                    : "Degraded Link"
                  : "Disconnected"}
              </span>
            </div>
            {displayedStages.map((stage, index) => (
              <React.Fragment key={stage.name}>
                <MotionWrapper 
                  className="flex flex-col items-center text-center px-2"
                  {...(animationsEnabled ? {
                    initial: { opacity: 0, y: 5 },
                    animate: { opacity: 1, y: 0 },
                    transition: { delay: index * 0.1 }
                  } : {})}
                >
                  <div className="flex items-center gap-1">
                    <motion.div
                      {...(animationsEnabled ? {
                        animate: stage.status === 'connected' ? {
                          rotate: [0, 5, 0, -5, 0]
                        } : {},
                        transition: { duration: 2, repeat: Infinity, delay: index * 0.3 }
                      } : {})}
                    >
                      {stage.icon}
                    </motion.div>
                    <span className="text-slate-300">{stage.name}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className={cn(
                      "text-xs font-mono",
                      stage.status === 'connected' ? (
                        !stage.latency || stage.latency <= 10 ? 'text-green-400' :
                        stage.latency <= 30 ? 'text-teal-400' :
                        stage.latency <= 100 ? 'text-orange-400' : 'text-red-400'
                      ) : stage.status === 'unknown' ? 'text-slate-500' : 'text-red-400'
                    )}>
                      {stage.latency !== null ? `${stage.latency}ms` : '-'}
                    </span>
                    {stage.status !== 'unknown' && (
                      <span className={cn(
                        "text-[10px]",
                        stage.status === 'connected' ? 
                          (!stage.latency || stage.latency <= 30 ? 'text-green-400' : 
                           stage.latency <= 100 ? 'text-orange-400' : 'text-red-400') : 
                          'text-red-400'
                      )}>
                        {stage.status}
                      </span>
                    )}
                  </div>
                </MotionWrapper>
                {index < displayedStages.length - 1 && (
                  <MotionWrapper
                    {...(animationsEnabled ? {
                      animate: { 
                        opacity: [0.3, 1, 0.3],
                        x: [0, 2, 0] 
                      },
                      transition: { duration: 1.5, repeat: Infinity, ease: 'linear', delay: index * 0.2 }
                    } : {})}
                  >
                    <ArrowIcon className="h-4 w-4 text-teal-400" />
                  </MotionWrapper>
                )}
              </React.Fragment>
            ))}
          </div>
          <MotionWrapper 
            className="flex flex-col items-center pl-2"
            {...(animationsEnabled ? {
              initial: { opacity: 0, scale: 0.9 },
              animate: { opacity: 1, scale: 1 },
              transition: { delay: 0.5 }
            } : {})}
          >
            <span className="text-slate-300">Total</span>
            <motion.span 
              className={cn(
                "font-mono",
                stages.some(s => s.status === 'disconnected') ? 'text-red-400' :
                totalLatency <= 50 ? 'text-green-400' :
                totalLatency <= 100 ? 'text-teal-400' :
                totalLatency <= 200 ? 'text-orange-400' : 'text-red-400'
              )}
              {...(animationsEnabled ? {
                animate: totalLatency > 100 ? {
                  color: ["rgb(251, 146, 60)", "rgb(239, 68, 68)", "rgb(251, 146, 60)"]
                } : totalLatency > 50 ? {
                  color: ["rgb(20, 184, 166)", "rgb(251, 146, 60)", "rgb(20, 184, 166)"]
                } : {},
                transition: { duration: 2, repeat: Infinity }
              } : {})}
            >
              {totalLatency}ms
            </motion.span>
          </MotionWrapper>
          <MotionWrapper
            {...(animationsEnabled ? {
              whileHover: { scale: 1.1, rotate: 180 },
              whileTap: { scale: 0.9 }
            } : {})}
          >
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 hover:bg-teal-500/10 border border-transparent hover:border-teal-500/20 transition-all"
              onMouseEnter={() => setIsReversed(true)}
              onMouseLeave={() => setIsReversed(false)}
            >
              <Repeat className="h-4 w-4" />
            </Button>
          </MotionWrapper>
        </MotionWrapper>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0 border-teal-500/20 bg-background/95 backdrop-blur" align="end">
        <ConnectionControls />
      </PopoverContent>
    </Popover>
  )
}

export default HeartbeatVisualizer 