"use client"

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Heart, Cpu, Database, Server, AppWindow, ChevronRight, ChevronLeft, Repeat } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './ui/button'

const HeartbeatVisualizer = () => {
  const [latencies, setLatencies] = useState({
    en: 0,
    sh: 0,
    ariesui: 0,
    ui: 0,
  })
  const [isReversed, setIsReversed] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setLatencies({
        en: Math.floor(Math.random() * 20) + 5,   // 5-25ms
        sh: Math.floor(Math.random() * 15) + 3,   // 3-18ms
        ariesui: Math.floor(Math.random() * 50) + 10, // 10-60ms
        ui: Math.floor(Math.random() * 10) + 1,    // 1-11ms
      })
    }, 2000) // Update every 2 seconds

    return () => clearInterval(interval)
  }, [])

  const stages = [
    { name: 'Hardware', icon: <Cpu className="h-4 w-4" />, latency: null },
    { name: 'EN', icon: <Database className="h-4 w-4" />, latency: latencies.en },
    { name: 'SH', icon: <Server className="h-4 w-4" />, latency: latencies.sh },
    { name: 'AriesUI', icon: <AppWindow className="h-4 w-4" />, latency: latencies.ariesui },
    { name: 'UI', icon: <AppWindow className="h-4 w-4" />, latency: latencies.ui },
  ]

  const displayedStages = isReversed ? [...stages].reverse() : stages
  const totalLatency = Object.values(latencies).reduce((a, b) => a + b, 0)
  const ArrowIcon = isReversed ? ChevronLeft : ChevronRight

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
        className="text-teal-500"
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
              <span className={cn("text-xs", stage.latency && stage.latency > 30 ? 'text-orange-400' : 'text-green-400')}>
                {stage.latency !== null ? `${stage.latency}ms` : '-'}
              </span>
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
        <span className={cn(totalLatency > 100 ? 'text-red-500' : 'text-green-400')}>
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
  )
}

export default HeartbeatVisualizer 