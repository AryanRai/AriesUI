"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePingMonitor } from '@/hooks/use-ping-monitor'
import { useCommsSocket } from '@/hooks/use-comms-socket'
import { useAnimationPreferences } from '@/hooks/use-animation-preferences'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion'
import { Badge } from './ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Separator } from './ui/separator'
import { 
  Power, 
  RefreshCw, 
  Settings, 
  Database, 
  Server, 
  Cpu, 
  Puzzle, 
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Save
} from 'lucide-react'

// Futuristic background component
const ConnectionBackground = ({ animationsEnabled }: { animationsEnabled: boolean }) => {
  if (!animationsEnabled) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-background/95 to-background/85 backdrop-blur-sm rounded-lg" />
    )
  }

  return (
    <div className="absolute inset-0 overflow-hidden rounded-lg">
      <div className="absolute inset-0 bg-gradient-to-br from-background/95 to-background/85 backdrop-blur-sm" />
      
      {/* Animated data flow lines */}
      <motion.div
        className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[rgba(var(--theme-primary),0.3)] to-transparent"
        animate={{
          x: [-200, 200],
          opacity: [0, 1, 0]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(20,184,166,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(20,184,166,0.05)_1px,transparent_1px)] bg-[size:30px_30px] rounded-lg" />
      
      {/* Corner indicators */}
      <div className="absolute top-2 right-2 w-2 h-2 bg-[rgba(var(--theme-primary),0.5)] rounded-full" />
      <div className="absolute bottom-2 left-2 w-2 h-2 bg-purple-400/50 rounded-full" />
    </div>
  )
}

const ConnectionControls = () => {
  const { animationsEnabled } = useAnimationPreferences()
  const { 
    pingData, 
    isConnected, 
    reconnect,
    updatePingInterval,
    pingIntervals
  } = usePingMonitor()

  const { 
    modules: shModules,
    sendCommand: shSendCommand
  } = useCommsSocket()

  // Local state for ping interval inputs - initialize with current values
  const [shPingInterval, setShPingInterval] = useState(pingIntervals.sh)
  const [enPingInterval, setEnPingInterval] = useState(pingIntervals.en)
  const [uiUpdateInterval, setUiUpdateInterval] = useState(pingIntervals.ui)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

  // Update local state when pingIntervals change
  useEffect(() => {
    setShPingInterval(pingIntervals.sh)
    setEnPingInterval(pingIntervals.en)
    setUiUpdateInterval(pingIntervals.ui)
  }, [pingIntervals])

  const handleSavePingSettings = () => {
    setSaveStatus('saving')
    
    // Update ping intervals
    if (shPingInterval !== pingIntervals.sh) {
      updatePingInterval('sh', shPingInterval)
    }
    if (enPingInterval !== pingIntervals.en) {
      updatePingInterval('en', enPingInterval)
    }
    if (uiUpdateInterval !== pingIntervals.ui) {
      updatePingInterval('ui', uiUpdateInterval)
    }
    
    // Update the pingIntervals object
    Object.assign(pingIntervals, {
      sh: shPingInterval,
      en: enPingInterval,
      ui: uiUpdateInterval
    })
    
    // Show success feedback
    setTimeout(() => {
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    }, 100)
  }

  const MotionWrapper = animationsEnabled ? motion.div : 'div'

  return (
    <MotionWrapper
      {...(animationsEnabled ? {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5 }
      } : {})}
    >
      <div className="relative p-4 space-y-4 overflow-hidden">
        {/* Futuristic Background */}
        <ConnectionBackground animationsEnabled={animationsEnabled} />
        
        <div className="relative z-10">
          <MotionWrapper
            className="flex items-center justify-between"
            {...(animationsEnabled ? {
              initial: { opacity: 0, x: -20 },
              animate: { opacity: 1, x: 0 },
              transition: { delay: 0.1 }
            } : {})}
          >
            <h2 className="text-lg font-semibold bg-gradient-to-r from-[rgb(var(--theme-primary))] to-slate-200 bg-clip-text text-transparent">
              Connection Controls
            </h2>
            <div className="flex items-center gap-2">
              <MotionWrapper
                {...(animationsEnabled ? {
                  whileHover: { scale: 1.05 },
                  whileTap: { scale: 0.95 }
                } : {})}
              >
                <Button 
                  onClick={() => reconnect()} 
                  variant="outline" 
                  size="sm"
                  className="gap-2 border-[rgba(var(--theme-primary),0.3)] hover:border-[rgba(var(--theme-primary),0.5)] hover:bg-[rgba(var(--theme-primary),0.1)] transition-all"
                >
                  <motion.div
                    {...(animationsEnabled ? {
                      animate: { rotate: 360 },
                      transition: { duration: 2, repeat: Infinity, ease: "linear" }
                    } : {})}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </motion.div>
                  Reconnect
                </Button>
              </MotionWrapper>
              <motion.div
                {...(animationsEnabled ? {
                  animate: { scale: [1, 1.1, 1] },
                  transition: { duration: 2, repeat: Infinity }
                } : {})}
              >
                <Badge variant={isConnected ? "default" : "destructive"} className={isConnected ? "bg-[rgb(var(--theme-primary))] hover:bg-[rgba(var(--theme-primary),0.8)]" : ""}>
                  {isConnected ? "Connected" : "Disconnected"}
                </Badge>
              </motion.div>
            </div>
          </MotionWrapper>

          <Accordion type="single" collapsible className="w-full">
            {/* Ping Settings */}
            <AccordionItem value="ping-settings" className="border-[rgba(var(--theme-primary),0.3)]">
              <AccordionTrigger className="hover:no-underline hover:bg-[rgba(var(--theme-primary),0.05)] transition-all">
                <MotionWrapper
                  className="flex items-center gap-2"
                  {...(animationsEnabled ? {
                    whileHover: { x: 4 }
                  } : {})}
                >
                  <Clock className="h-4 w-4 text-[rgb(var(--theme-primary))]" />
                  <span>Ping Settings</span>
                  <Badge variant="outline" className="ml-2 border-[rgba(var(--theme-primary),0.3)] text-[rgb(var(--theme-primary))]">
                    Configuration
                  </Badge>
                </MotionWrapper>
              </AccordionTrigger>
              <AccordionContent>
                <Card className="border-[rgba(var(--theme-primary),0.3)] bg-background/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-sm text-[rgb(var(--theme-primary))]">Ping & Update Intervals</CardTitle>
                    <CardDescription>
                      Configure how often the system checks connection status and updates the UI
                    </CardDescription>
                    <div className="text-xs text-muted-foreground mt-2">
                      Active intervals: SH: {pingIntervals.sh}ms | EN: {pingIntervals.en}ms | UI: {pingIntervals.ui}ms
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <MotionWrapper
                        className="space-y-2"
                        {...(animationsEnabled ? {
                          initial: { opacity: 0, x: -20 },
                          animate: { opacity: 1, x: 0 },
                          transition: { delay: 0.2 }
                        } : {})}
                      >
                        <Label htmlFor="sh-ping" className="text-[rgb(var(--theme-primary))]">StreamHandler Ping (ms)</Label>
                        <Input
                          id="sh-ping"
                          type="number"
                          value={shPingInterval}
                          onChange={(e) => setShPingInterval(Number(e.target.value))}
                          min="100"
                          max="10000"
                          step="100"
                          className="bg-background/50 border-[rgba(var(--theme-primary),0.3)] focus:border-[rgba(var(--theme-primary),0.5)] transition-all"
                        />
                        <p className="text-xs text-muted-foreground">
                          Current: <span className="text-[rgb(var(--theme-primary))]">{pingData.sh.latency}ms</span> | Active: {pingIntervals.sh}ms
                        </p>
                      </MotionWrapper>
                      <MotionWrapper
                        className="space-y-2"
                        {...(animationsEnabled ? {
                          initial: { opacity: 0, x: 20 },
                          animate: { opacity: 1, x: 0 },
                          transition: { delay: 0.3 }
                        } : {})}
                      >
                        <Label htmlFor="en-ping" className="text-[rgb(var(--theme-primary))]">Engine Ping (ms)</Label>
                        <Input
                          id="en-ping"
                          type="number"
                          value={enPingInterval}
                          onChange={(e) => setEnPingInterval(Number(e.target.value))}
                          min="100"
                          max="10000"
                          step="100"
                          className="bg-background/50 border-[rgba(var(--theme-primary),0.3)] focus:border-[rgba(var(--theme-primary),0.5)] transition-all"
                        />
                        <p className="text-xs text-muted-foreground">
                          Current: <span className="text-[rgb(var(--theme-primary))]">{pingData.en.latency}ms</span> | Active: {pingIntervals.en}ms
                        </p>
                      </MotionWrapper>
                    </div>
                    <MotionWrapper
                      className="space-y-2"
                      {...(animationsEnabled ? {
                        initial: { opacity: 0, y: 20 },
                        animate: { opacity: 1, y: 0 },
                        transition: { delay: 0.4 }
                      } : {})}
                    >
                      <Label htmlFor="ui-update" className="text-[rgb(var(--theme-primary))]">UI Update Rate (ms)</Label>
                      <Input
                        id="ui-update"
                        type="number"
                        value={uiUpdateInterval}
                        onChange={(e) => setUiUpdateInterval(Number(e.target.value))}
                        min="50"
                        max="5000"
                        step="50"
                        className="bg-background/50 border-[rgba(var(--theme-primary),0.3)] focus:border-[rgba(var(--theme-primary),0.5)] transition-all"
                      />
                      <p className="text-xs text-muted-foreground">
                        How often the UI updates its display | Active: {pingIntervals.ui}ms
                      </p>
                    </MotionWrapper>
                    <MotionWrapper
                      {...(animationsEnabled ? {
                        whileHover: { scale: 1.02 },
                        whileTap: { scale: 0.98 }
                      } : {})}
                    >
                      <Button 
                        onClick={handleSavePingSettings} 
                        className="w-full bg-[rgb(var(--theme-primary))] hover:bg-[rgba(var(--theme-primary),0.8)] border-[rgba(var(--theme-primary),0.3)] transition-all"
                        disabled={saveStatus === 'saving'}
                        variant={saveStatus === 'saved' ? 'default' : 'default'}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {saveStatus === 'saving' ? 'Saving...' : 
                         saveStatus === 'saved' ? 'Saved!' : 
                         'Save Ping Settings'}
                      </Button>
                    </MotionWrapper>
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>

            {/* StreamHandler Status */}
            <AccordionItem value="sh" className="border-[rgba(var(--theme-primary),0.3)]">
              <AccordionTrigger className="hover:no-underline hover:bg-[rgba(var(--theme-primary),0.05)] transition-all">
                <MotionWrapper
                  className="flex items-center gap-2"
                  {...(animationsEnabled ? {
                    whileHover: { x: 4 }
                  } : {})}
                >
                  <Server className="h-4 w-4 text-[rgb(var(--theme-primary))]" />
                  <span>StreamHandler Status</span>
                  <motion.div
                    {...(animationsEnabled ? {
                      animate: { scale: [1, 1.1, 1] },
                      transition: { duration: 2, repeat: Infinity }
                    } : {})}
                  >
                    <Badge variant={pingData.sh.status === 'connected' ? "default" : "destructive"} className={pingData.sh.status === 'connected' ? "bg-[rgb(var(--theme-primary))] hover:bg-[rgba(var(--theme-primary),0.8)] ml-2" : "ml-2"}>
                      {pingData.sh.status}
                    </Badge>
                  </motion.div>
                  {pingData.sh.latency > 0 && (
                    <Badge variant={pingData.sh.latency > 30 ? "secondary" : "outline"} className="ml-2 border-[rgba(var(--theme-primary),0.3)] text-[rgb(var(--theme-primary))]">
                      {pingData.sh.latency}ms
                    </Badge>
                  )}
                </MotionWrapper>
              </AccordionTrigger>
              <AccordionContent>
                <Card className="border-[rgba(var(--theme-primary),0.3)] bg-background/50 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="text-center text-sm text-muted-foreground">
                      StreamHandler connection details and controls would go here
                    </div>
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>

            {/* Engine Status */}
            <AccordionItem value="en" className="border-[rgba(var(--theme-primary),0.3)]">
              <AccordionTrigger className="hover:no-underline hover:bg-[rgba(var(--theme-primary),0.05)] transition-all">
                <MotionWrapper
                  className="flex items-center gap-2"
                  {...(animationsEnabled ? {
                    whileHover: { x: 4 }
                  } : {})}
                >
                  <Database className="h-4 w-4 text-[rgb(var(--theme-primary))]" />
                  <span>Engine Status</span>
                  <motion.div
                    {...(animationsEnabled ? {
                      animate: { scale: [1, 1.1, 1] },
                      transition: { duration: 2, repeat: Infinity }
                    } : {})}
                  >
                    <Badge variant={pingData.en.status === 'connected' ? "default" : "destructive"} className={pingData.en.status === 'connected' ? "bg-[rgb(var(--theme-primary))] hover:bg-[rgba(var(--theme-primary),0.8)] ml-2" : "ml-2"}>
                      {pingData.en.status}
                    </Badge>
                  </motion.div>
                  {pingData.en.latency > 0 && (
                    <Badge variant={pingData.en.latency > 30 ? "secondary" : "outline"} className="ml-2 border-[rgba(var(--theme-primary),0.3)] text-[rgb(var(--theme-primary))]">
                      {pingData.en.latency}ms
                    </Badge>
                  )}
                </MotionWrapper>
              </AccordionTrigger>
              <AccordionContent>
                <Card className="border-[rgba(var(--theme-primary),0.3)] bg-background/50 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="text-center text-sm text-muted-foreground">
                      Engine connection details and controls would go here
                    </div>
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </MotionWrapper>
  )
}

export default ConnectionControls
