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

  // Use conditional wrapper for motion vs regular div
  const Wrapper = animationsEnabled ? motion.div : 'div'
  const MotionDiv = animationsEnabled ? motion.div : 'div'
  const MotionSpan = animationsEnabled ? motion.span : 'span'

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Wrapper 
          className="flex items-center gap-2 text-xs text-muted-foreground font-mono cursor-pointer hover:bg-[rgba(var(--theme-primary),0.1)] px-3 py-2 rounded-lg transition-all theme-outline-primary bg-background/50 backdrop-blur-sm shadow-sm"
          {...(animationsEnabled ? {
            whileHover: { scale: 1.01 }, // Reduced from 1.02
            whileTap: { scale: 0.99 }, // Reduced from 0.98
            transition: { type: "spring", stiffness: 200, damping: 20 } // Reduced from 400, 25
          } : {})}
        >
          <MotionDiv
            {...(animationsEnabled ? {
              animate: { scale: [1, 1.1, 1] }, // Reduced from 1.2
              transition: { duration: 2, repeat: Infinity, ease: "easeInOut" } // Increased duration from 1
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
          </MotionDiv>
          <div className="flex items-center bg-background/50 px-2 py-1 rounded-md theme-outline-primary backdrop-blur">
            <div className="flex items-center gap-1 pr-2 border-r border-[rgba(var(--theme-primary),0.2)]">
              <MotionDiv 
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
                    scale: [1, 1.1, 1], // Reduced from 1.2
                    opacity: [0.8, 1, 0.8] // Increased min opacity from 0.7
                  } : {
                    scale: [1, 1.05, 1], // Reduced from 1.1
                    opacity: [0.6, 0.8, 0.6] // Increased min opacity from 0.5
                  },
                  transition: { duration: 2, repeat: Infinity } // Increased from 1.5
                } : {})}
              />
              <span className="text-xs text-[rgb(var(--theme-primary))]">
                {isConnected 
                  ? stages.every(s => s.status === 'connected' || s.status === 'unknown')
                    ? "Nominal Link"
                    : "Degraded Link"
                  : "Disconnected"}
              </span>
            </div>
            {displayedStages.map((stage, index) => (
              <React.Fragment key={stage.name}>
                <MotionDiv 
                  className="flex flex-col items-center text-center px-2"
                  {...(animationsEnabled ? {
                    initial: { opacity: 0, y: 5 },
                    animate: { opacity: 1, y: 0 },
                    transition: { delay: index * 0.1 }
                  } : {})}
                >
                  <div className="flex items-center gap-1">
                    <MotionDiv
                      {...(animationsEnabled && stage.status === 'connected' ? {
                        animate: { rotate: [0, 3, 0, -3, 0] }, // Reduced from 5, -5
                        transition: { duration: 3, repeat: Infinity, delay: index * 0.5 } // Increased duration and delay
                      } : {})}
                    >
                      {stage.icon}
                    </MotionDiv>
                    <span className="text-slate-300 font-medium">{stage.name}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className={cn(
                      "text-xs font-mono font-bold",
                      stage.status === 'connected' ? (
                        !stage.latency || stage.latency <= 10 ? 'text-green-400' :
                        stage.latency <= 30 ? 'text-[rgb(var(--theme-primary))]' :
                        stage.latency <= 100 ? 'text-orange-400' : 'text-red-400'
                      ) : stage.status === 'unknown' ? 'text-slate-500' : 'text-red-400'
                    )}>
                      {stage.latency !== null ? `${stage.latency}ms` : '-'}
                    </span>
                    {stage.status !== 'unknown' && (
                      <span className={cn(
                        "text-[10px] font-semibold uppercase tracking-wider",
                        stage.status === 'connected' ? 
                          (!stage.latency || stage.latency <= 30 ? 'text-green-400' : 
                           stage.latency <= 100 ? 'text-orange-400' : 'text-red-400') : 
                          'text-red-400'
                      )}>
                        {stage.status}
                      </span>
                    )}
                  </div>
                </MotionDiv>
                {index < displayedStages.length - 1 && (
                  <MotionDiv
                    {...(animationsEnabled ? {
                      animate: { 
                        opacity: [0.4, 1, 0.4], // Increased min opacity from 0.3
                        x: [0, 1, 0] // Reduced from 2
                      },
                      transition: { duration: 2, repeat: Infinity, ease: 'linear', delay: index * 0.3 } // Increased duration and delay
                    } : {})}
                  >
                    <ArrowIcon className="h-4 w-4 text-[rgb(var(--theme-primary))]" />
                  </MotionDiv>
                )}
              </React.Fragment>
            ))}
          </div>
          <MotionDiv 
            className="flex flex-col items-center pl-2"
            {...(animationsEnabled ? {
              initial: { opacity: 0, scale: 0.9 },
              animate: { opacity: 1, scale: 1 },
              transition: { delay: 0.5 }
            } : {})}
          >
            <span className="text-slate-300 font-medium">Total</span>
            <MotionSpan 
              className={cn(
                "font-mono font-bold",
                stages.some(s => s.status === 'disconnected') ? 'text-red-400' :
                totalLatency <= 50 ? 'text-green-400' :
                totalLatency <= 100 ? 'text-[rgb(var(--theme-primary))]' :
                totalLatency <= 200 ? 'text-orange-400' : 'text-red-400'
              )}
              {...(animationsEnabled ? (
                totalLatency > 100 ? {
                  animate: { color: ["rgb(251, 146, 60)", "rgb(239, 68, 68)", "rgb(251, 146, 60)"] },
                  transition: { duration: 2, repeat: Infinity }
                } : totalLatency > 50 ? {
                  animate: { color: [`rgb(var(--theme-primary))`, "rgb(251, 146, 60)", `rgb(var(--theme-primary))`] },
                  transition: { duration: 2, repeat: Infinity }
                } : {}
              ) : {})}
            >
              {totalLatency}ms
            </MotionSpan>
          </MotionDiv>
          <MotionDiv
            {...(animationsEnabled ? {
              whileHover: { scale: 1.05, rotate: 90 }, // Reduced scale and rotation
              whileTap: { scale: 0.95 }, // Reduced from 0.9
              transition: { type: "spring", stiffness: 200, damping: 20 } // Reduced from 400, 25
            } : {})}
          >
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 hover:bg-[rgba(var(--theme-primary),0.1)] theme-outline-primary transition-all"
              onMouseEnter={() => setIsReversed(true)}
              onMouseLeave={() => setIsReversed(false)}
            >
              <Repeat className="h-4 w-4" />
            </Button>
          </MotionDiv>
        </Wrapper>
      </PopoverTrigger>
      <PopoverContent className="w-[450px] p-0 theme-outline-primary bg-background/98 backdrop-blur-xl shadow-2xl" align="end">
        <ConnectionControls />
      </PopoverContent>
    </Popover>
  )
}

export default HeartbeatVisualizer 