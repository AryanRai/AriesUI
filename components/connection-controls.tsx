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
import { cn } from '@/lib/utils'
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
      <div className="absolute inset-0 bg-[linear-gradient(rgba(var(--theme-primary),0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(var(--theme-primary),0.05)_1px,transparent_1px)] bg-[size:30px_30px] rounded-lg" />
      
      {/* Corner indicators */}
      <div className="absolute top-2 right-2 w-2 h-2 bg-[rgba(var(--theme-primary),0.5)] rounded-full" />
      <div className="absolute bottom-2 left-2 w-2 h-2 bg-[rgba(var(--theme-secondary),0.5)] rounded-full" />
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
    updatePingInterval({
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
    <motion.div
      initial={animationsEnabled ? { opacity: 0, y: 20 } : {}}
      animate={animationsEnabled ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
    >
      <div className="relative p-4 space-y-4 overflow-hidden">
        {/* Futuristic Background */}
        <ConnectionBackground animationsEnabled={animationsEnabled} />
        
        <div className="relative z-10">
          <motion.div
            className="flex items-center justify-between mb-4"
            initial={animationsEnabled ? { opacity: 0, x: -20 } : {}}
            animate={animationsEnabled ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-[rgba(var(--theme-primary),0.1)] rounded-md border border-[rgba(var(--theme-primary),0.2)]">
                <Settings className="h-4 w-4 text-[rgb(var(--theme-primary))]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold bg-gradient-to-r from-[rgb(var(--theme-primary))] via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  Connection Hub
                </h2>
                <p className="text-xs text-muted-foreground font-medium">
                  Network configuration and monitoring
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <motion.div
                whileHover={animationsEnabled ? { scale: 1.05 } : {}}
                whileTap={animationsEnabled ? { scale: 0.95 } : {}}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <Button 
                  onClick={() => reconnect()} 
                  variant="outline" 
                  size="sm"
                  className="gap-1.5 theme-outline-primary hover:bg-[rgba(var(--theme-primary),0.1)] transition-all text-xs"
                >
                  <motion.div
                    animate={animationsEnabled ? { rotate: 360 } : {}}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </motion.div>
                  Reconnect
                </Button>
              </motion.div>
              <motion.div
                animate={animationsEnabled ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Badge 
                  variant={isConnected ? "default" : "destructive"} 
                  className={cn(
                    "px-2 py-0.5 text-xs font-semibold",
                    isConnected ? "bg-[rgb(var(--theme-primary))] hover:bg-[rgba(var(--theme-primary),0.8)] text-white" : ""
                  )}
                >
                  {isConnected ? "● ONLINE" : "● OFFLINE"}
                </Badge>
              </motion.div>
            </div>
          </motion.div>

          <Accordion type="single" collapsible className="w-full space-y-3">
            {/* Ping Settings */}
            <AccordionItem value="ping-settings" className="theme-outline-primary bg-[rgba(var(--theme-primary),0.02)] rounded-lg overflow-hidden">
              <AccordionTrigger className="hover:no-underline hover:bg-[rgba(var(--theme-primary),0.05)] transition-all px-3 py-2">
                <motion.div
                  className="flex items-center gap-2"
                  whileHover={animationsEnabled ? { x: 4 } : {}}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <div className="p-1.5 bg-[rgba(var(--theme-primary),0.1)] rounded-md">
                    <Clock className="h-3.5 w-3.5 text-[rgb(var(--theme-primary))]" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-sm text-foreground">Ping Configuration</h3>
                    <p className="text-xs text-muted-foreground">Network timing and intervals</p>
                  </div>
                  <Badge variant="outline" className="ml-auto border-[rgba(var(--theme-primary),0.3)] text-[rgb(var(--theme-primary))] text-xs font-medium">
                    ADVANCED
                  </Badge>
                </motion.div>
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-3">
                <Card className="theme-outline-primary bg-background/80 backdrop-blur-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold text-[rgb(var(--theme-primary))]">Network Intervals</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                      Configure how often the system checks connection status and updates the UI
                    </CardDescription>
                    <div className="text-xs text-muted-foreground mt-2 p-2 bg-[rgba(var(--theme-primary),0.05)] rounded border border-[rgba(var(--theme-primary),0.1)]">
                      <div className="font-mono text-xs">
                        <span className="font-medium">Active:</span> 
                        <span className="text-[rgb(var(--theme-primary))] ml-1">SH: {pingIntervals.sh}ms</span>
                        <span className="text-[rgb(var(--theme-primary))] ml-1">EN: {pingIntervals.en}ms</span>
                        <span className="text-[rgb(var(--theme-primary))] ml-1">UI: {pingIntervals.ui}ms</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <motion.div
                        className="space-y-2"
                        initial={animationsEnabled ? { opacity: 0, x: -20 } : {}}
                        animate={animationsEnabled ? { opacity: 1, x: 0 } : {}}
                        transition={{ delay: 0.2 }}
                      >
                        <Label htmlFor="sh-ping" className="text-sm font-medium text-[rgb(var(--theme-primary))]">StreamHandler Ping</Label>
                        <Input
                          id="sh-ping"
                          type="number"
                          value={shPingInterval}
                          onChange={(e) => setShPingInterval(Number(e.target.value))}
                          min="100"
                          max="10000"
                          step="100"
                          className="text-sm bg-background/80 theme-outline-primary focus:border-[rgba(var(--theme-primary),0.5)] transition-all font-mono"
                        />
                        <div className="text-xs text-muted-foreground">
                          <div className="flex items-center justify-between">
                            <span>Current:</span>
                            <span className="text-[rgb(var(--theme-primary))] font-mono font-medium">{pingData.sh.latency}ms</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Active:</span>
                            <span className="text-[rgb(var(--theme-primary))] font-mono font-medium">{pingIntervals.sh}ms</span>
                          </div>
                        </div>
                      </motion.div>
                      <motion.div
                        className="space-y-2"
                        initial={animationsEnabled ? { opacity: 0, x: 20 } : {}}
                        animate={animationsEnabled ? { opacity: 1, x: 0 } : {}}
                        transition={{ delay: 0.3 }}
                      >
                        <Label htmlFor="en-ping" className="text-sm font-medium text-[rgb(var(--theme-secondary))]">Engine Ping</Label>
                        <Input
                          id="en-ping"
                          type="number"
                          value={enPingInterval}
                          onChange={(e) => setEnPingInterval(Number(e.target.value))}
                          min="100"
                          max="10000"
                          step="100"
                          className="text-sm bg-background/80 theme-outline-primary focus:border-[rgba(var(--theme-primary),0.5)] transition-all font-mono"
                        />
                        <div className="text-xs text-muted-foreground">
                          <div className="flex items-center justify-between">
                            <span>Current:</span>
                            <span className="text-[rgb(var(--theme-primary))] font-mono font-medium">{pingData.en.latency}ms</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Active:</span>
                            <span className="text-[rgb(var(--theme-primary))] font-mono font-medium">{pingIntervals.en}ms</span>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                    <motion.div
                      className="space-y-2"
                      initial={animationsEnabled ? { opacity: 0, y: 20 } : {}}
                      animate={animationsEnabled ? { opacity: 1, y: 0 } : {}}
                      transition={{ delay: 0.4 }}
                    >
                      <Label htmlFor="ui-update" className="text-sm font-medium text-[rgb(var(--theme-primary))]">UI Update Rate</Label>
                      <Input
                        id="ui-update"
                        type="number"
                        value={uiUpdateInterval}
                        onChange={(e) => setUiUpdateInterval(Number(e.target.value))}
                        min="50"
                        max="5000"
                        step="50"
                        className="text-sm bg-background/80 theme-outline-primary focus:border-[rgba(var(--theme-primary),0.5)] transition-all font-mono"
                      />
                      <p className="text-xs text-muted-foreground">
                        Controls UI refresh rate. Active: <span className="text-[rgb(var(--theme-primary))] font-mono font-medium">{pingIntervals.ui}ms</span>
                      </p>
                    </motion.div>
                    <motion.div
                      whileHover={animationsEnabled ? { scale: 1.02 } : {}}
                      whileTap={animationsEnabled ? { scale: 0.98 } : {}}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    >
                      <Button 
                        onClick={handleSavePingSettings} 
                        className={cn(
                          "w-full text-sm font-medium py-2 transition-all duration-200",
                          saveStatus === 'saving' ? "bg-blue-600 hover:bg-blue-700 animate-pulse" :
                          saveStatus === 'saved' ? "bg-green-600 hover:bg-green-700" :
                          "bg-[rgb(var(--theme-primary))] hover:bg-[rgba(var(--theme-primary),0.8)]"
                        )}
                        disabled={saveStatus === 'saving'}
                      >
                        <Save className="h-3.5 w-3.5 mr-1.5" />
                        {saveStatus === 'saving' ? 'Applying...' : 
                         saveStatus === 'saved' ? 'Saved!' : 
                         'Apply Settings'}
                      </Button>
                    </motion.div>
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>

            {/* StreamHandler Status */}
            <AccordionItem value="sh" className="theme-outline-primary bg-[rgba(var(--theme-primary),0.02)] rounded-lg overflow-hidden">
              <AccordionTrigger className="hover:no-underline hover:bg-[rgba(var(--theme-primary),0.05)] transition-all px-3 py-2">
                <motion.div
                  className="flex items-center gap-2 w-full"
                  whileHover={animationsEnabled ? { x: 4 } : {}}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <div className="p-1.5 bg-[rgba(var(--theme-primary),0.1)] rounded-md">
                    <Server className="h-3.5 w-3.5 text-[rgb(var(--theme-primary))]" />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="font-semibold text-sm text-foreground">StreamHandler</h3>
                    <p className="text-xs text-muted-foreground">Backend data streaming service</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <motion.div
                      animate={animationsEnabled ? { scale: [1, 1.05, 1] } : {}}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Badge 
                        variant={pingData.sh.status === 'connected' ? "default" : "destructive"} 
                        className={cn(
                          "text-xs font-medium",
                          pingData.sh.status === 'connected' ? "bg-[rgb(var(--theme-primary))] hover:bg-[rgba(var(--theme-primary),0.8)] text-white" : ""
                        )}
                      >
                        {pingData.sh.status === 'connected' ? '● ONLINE' : '● OFFLINE'}
                      </Badge>
                    </motion.div>
                    {pingData.sh.latency > 0 && (
                      <Badge 
                        variant={pingData.sh.latency > 30 ? "secondary" : "outline"} 
                        className={cn(
                          "border-[rgba(var(--theme-primary),0.3)] text-[rgb(var(--theme-primary))] font-mono text-xs font-medium",
                          pingData.sh.latency > 30 ? "bg-orange-500/20 border-orange-500/30 text-orange-400" : ""
                        )}
                      >
                        {pingData.sh.latency}ms
                      </Badge>
                    )}
                  </div>
                </motion.div>
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-3">
                <Card className="border-[rgba(var(--theme-primary),0.2)] bg-background/80 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="p-3 bg-[rgba(var(--theme-primary),0.05)] rounded border border-[rgba(var(--theme-primary),0.1)]">
                        <Server className="h-6 w-6 text-[rgb(var(--theme-primary))] mx-auto mb-1" />
                        <h4 className="text-sm font-semibold text-[rgb(var(--theme-primary))] mb-1">StreamHandler Service</h4>
                        <p className="text-xs text-muted-foreground">
                          Advanced streaming controls and diagnostics will be available here
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>

            {/* Engine Status */}
            <AccordionItem value="en" className="theme-outline-primary bg-[rgba(var(--theme-primary),0.02)] rounded-lg overflow-hidden">
              <AccordionTrigger className="hover:no-underline hover:bg-[rgba(var(--theme-primary),0.05)] transition-all px-3 py-2">
                <motion.div
                  className="flex items-center gap-2 w-full"
                  whileHover={animationsEnabled ? { x: 4 } : {}}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <div className="p-1.5 bg-[rgba(var(--theme-primary),0.1)] rounded-md">
                    <Database className="h-3.5 w-3.5 text-[rgb(var(--theme-primary))]" />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="font-semibold text-sm text-foreground">Engine Core</h3>
                    <p className="text-xs text-muted-foreground">Processing engine and data handler</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <motion.div
                      animate={animationsEnabled ? { scale: [1, 1.05, 1] } : {}}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Badge 
                        variant={pingData.en.status === 'connected' ? "default" : "destructive"} 
                        className={cn(
                          "text-xs font-medium",
                          pingData.en.status === 'connected' ? "bg-[rgb(var(--theme-primary))] hover:bg-[rgba(var(--theme-primary),0.8)] text-white" : ""
                        )}
                      >
                        {pingData.en.status === 'connected' ? '● ONLINE' : '● OFFLINE'}
                      </Badge>
                    </motion.div>
                    {pingData.en.latency > 0 && (
                      <Badge 
                        variant={pingData.en.latency > 30 ? "secondary" : "outline"} 
                        className={cn(
                          "border-[rgba(var(--theme-primary),0.3)] text-[rgb(var(--theme-primary))] font-mono text-xs font-medium",
                          pingData.en.latency > 30 ? "bg-orange-500/20 border-orange-500/30 text-orange-400" : ""
                        )}
                      >
                        {pingData.en.latency}ms
                      </Badge>
                    )}
                  </div>
                </motion.div>
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-3">
                <Card className="theme-outline-primary bg-background/80 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="p-3 bg-[rgba(var(--theme-primary),0.05)] rounded border border-[rgba(var(--theme-primary),0.1)]">
                        <Database className="h-6 w-6 text-[rgb(var(--theme-primary))] mx-auto mb-1" />
                        <h4 className="text-sm font-semibold text-[rgb(var(--theme-primary))] mb-1">Engine Core</h4>
                        <p className="text-xs text-muted-foreground">
                          Engine diagnostics and configuration options will be available here
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </motion.div>
  )
}

export default ConnectionControls
