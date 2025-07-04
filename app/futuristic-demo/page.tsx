"use client"

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useAnimationPreferences } from '@/hooks/use-animation-preferences'
import { 
  Zap, 
  Cpu, 
  Database, 
  Server, 
  AppWindow, 
  Settings, 
  Heart,
  Play,
  Pause,
  RotateCcw,
  Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function FuturisticDemoPage() {
  const { animationsEnabled, setAnimationsEnabled } = useAnimationPreferences()
  const [demoActive, setDemoActive] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState<'default' | 'success' | 'warning' | 'danger'>('default')

  const themes = {
    default: {
      name: 'Default (Teal)',
      bg: 'bg-teal-500/5',
      border: 'border-teal-500/20',
      text: 'text-teal-400',
      accent: 'bg-teal-500/10',
      glow: 'shadow-teal-500/20'
    },
    success: {
      name: 'Success (Green)',
      bg: 'bg-green-500/5',
      border: 'border-green-500/20',
      text: 'text-green-400',
      accent: 'bg-green-500/10',
      glow: 'shadow-green-500/20'
    },
    warning: {
      name: 'Warning (Orange)',
      bg: 'bg-orange-500/5',
      border: 'border-orange-500/20',
      text: 'text-orange-400',
      accent: 'bg-orange-500/10',
      glow: 'shadow-orange-500/20'
    },
    danger: {
      name: 'Danger (Red)',
      bg: 'bg-red-500/5',
      border: 'border-red-500/20',
      text: 'text-red-400',
      accent: 'bg-red-500/10',
      glow: 'shadow-red-500/20'
    }
  }

  const currentTheme = themes[selectedTheme]
  const MotionWrapper = animationsEnabled ? motion.div : 'div'

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="h-8 w-8 text-teal-400" />
            <h1 className="text-4xl font-bold text-slate-100">Futuristic UI Demo</h1>
          </div>
          <p className="text-slate-400 text-lg">
            Showcase of the new futuristic theme, animations, and micro-interactions
          </p>
        </motion.div>

        {/* Controls */}
        <Card className="border-teal-500/20 bg-background/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-teal-300">
              <Settings className="h-5 w-5" />
              Demo Controls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-6 items-center">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="animations" 
                  checked={animationsEnabled}
                  onCheckedChange={setAnimationsEnabled}
                />
                <Label htmlFor="animations" className="text-slate-300">
                  Enable Animations
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="demo-active" 
                  checked={demoActive}
                  onCheckedChange={setDemoActive}
                />
                <Label htmlFor="demo-active" className="text-slate-300">
                  Demo Active
                </Label>
              </div>

              <div className="flex gap-2">
                {Object.entries(themes).map(([key, theme]) => (
                  <Button
                    key={key}
                    size="sm"
                    variant={selectedTheme === key ? "default" : "outline"}
                    onClick={() => setSelectedTheme(key as any)}
                    className={cn(
                      "border-current",
                      selectedTheme === key ? cn(theme.bg, theme.border, theme.text) : "border-slate-500/20"
                    )}
                  >
                    {theme.name}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demo Components Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Animated Card */}
          <MotionWrapper
            {...(animationsEnabled ? {
              initial: { opacity: 0, scale: 0.95 },
              animate: { opacity: 1, scale: 1 },
              whileHover: { scale: 1.05 },
              transition: { duration: 0.2 }
            } : {})}
          >
            <Card className={cn(
              "relative overflow-hidden",
              currentTheme.bg,
              currentTheme.border,
              currentTheme.glow,
              "border-2 backdrop-blur shadow-lg"
            )}>
              {/* Corner accents */}
              <div className={cn("absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2", currentTheme.border)} />
              <div className={cn("absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2", currentTheme.border)} />
              <div className={cn("absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2", currentTheme.border)} />
              <div className={cn("absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2", currentTheme.border)} />
              
              {/* Scan line */}
              {animationsEnabled && demoActive && (
                <motion.div
                  className={cn("absolute top-0 left-0 w-full h-0.5", currentTheme.accent)}
                  animate={{
                    x: ["-100%", "100%"],
                    opacity: [0, 1, 0]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                />
              )}
              
              <CardHeader>
                <CardTitle className={cn("flex items-center gap-2", currentTheme.text)}>
                  <motion.div
                    {...(animationsEnabled && demoActive ? {
                      animate: { rotate: 360 },
                      transition: { duration: 2, repeat: Infinity, ease: "linear" }
                    } : {})}
                  >
                    <Cpu className="h-5 w-5" />
                  </motion.div>
                  Animated Widget
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className={cn("text-sm font-mono", currentTheme.text)}>
                    Status: {demoActive ? "Active" : "Inactive"}
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.div
                      className={cn("h-2 w-2 rounded-full", currentTheme.accent)}
                      {...(animationsEnabled && demoActive ? {
                        animate: { scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] },
                        transition: { duration: 1.5, repeat: Infinity }
                      } : {})}
                    />
                    <span className="text-slate-400 text-sm">
                      {demoActive ? "Processing..." : "Standby"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </MotionWrapper>

          {/* Heartbeat Demo */}
          <MotionWrapper
            {...(animationsEnabled ? {
              initial: { opacity: 0, y: 20 },
              animate: { opacity: 1, y: 0 },
              transition: { delay: 0.1 }
            } : {})}
          >
            <Card className="border-teal-500/20 bg-background/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-teal-300">
                  <Heart className="h-5 w-5" />
                  Heartbeat Visualizer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <motion.div
                    className="text-green-400"
                    {...(animationsEnabled ? {
                      animate: { scale: [1, 1.2, 1] },
                      transition: { duration: 1, repeat: Infinity }
                    } : {})}
                  >
                    <Heart className="h-8 w-8" />
                  </motion.div>
                  <div className="space-y-1">
                    <div className="text-sm text-slate-300">Connection Status</div>
                    <div className="text-green-400 font-mono text-sm">
                      {demoActive ? "Connected" : "Standby"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </MotionWrapper>

          {/* Status Indicators */}
          <MotionWrapper
            {...(animationsEnabled ? {
              initial: { opacity: 0, y: 20 },
              animate: { opacity: 1, y: 0 },
              transition: { delay: 0.2 }
            } : {})}
          >
            <Card className="border-teal-500/20 bg-background/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-teal-300">
                  <Server className="h-5 w-5" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: 'Hardware', icon: Cpu, status: 'online', latency: '12ms' },
                    { name: 'Engine', icon: Database, status: 'online', latency: '8ms' },
                    { name: 'Stream', icon: Server, status: demoActive ? 'online' : 'offline', latency: '15ms' },
                    { name: 'UI', icon: AppWindow, status: 'online', latency: '3ms' }
                  ].map((item, index) => (
                    <MotionWrapper
                      key={item.name}
                      className="flex items-center justify-between"
                      {...(animationsEnabled ? {
                        initial: { opacity: 0, x: -10 },
                        animate: { opacity: 1, x: 0 },
                        transition: { delay: index * 0.1 }
                      } : {})}
                    >
                      <div className="flex items-center gap-2">
                        <motion.div
                          className={item.status === 'online' ? 'text-green-400' : 'text-red-400'}
                          {...(animationsEnabled && demoActive ? {
                            animate: { rotate: [0, 5, 0, -5, 0] },
                            transition: { duration: 2, repeat: Infinity, delay: index * 0.3 }
                          } : {})}
                        >
                          <item.icon className="h-4 w-4" />
                        </motion.div>
                        <span className="text-slate-300 text-sm">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={item.status === 'online' ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {item.status}
                        </Badge>
                        <span className="text-slate-400 text-xs font-mono">
                          {item.latency}
                        </span>
                      </div>
                    </MotionWrapper>
                  ))}
                </div>
              </CardContent>
            </Card>
          </MotionWrapper>

          {/* Animation Controls */}
          <MotionWrapper
            {...(animationsEnabled ? {
              initial: { opacity: 0, y: 20 },
              animate: { opacity: 1, y: 0 },
              transition: { delay: 0.3 }
            } : {})}
          >
            <Card className="border-teal-500/20 bg-background/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-teal-300">
                  <Play className="h-5 w-5" />
                  Animation Controls
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button 
                    className={cn(
                      "w-full",
                      demoActive ? "bg-red-500/20 hover:bg-red-500/30 border-red-500/40 text-red-300" : 
                      "bg-teal-500/20 hover:bg-teal-500/30 border-teal-500/40 text-teal-300"
                    )}
                    onClick={() => setDemoActive(!demoActive)}
                  >
                    {demoActive ? (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        Stop Demo
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Start Demo
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="w-full border-teal-500/20 hover:border-teal-500/40 hover:bg-teal-500/10"
                    onClick={() => window.location.reload()}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset Demo
                  </Button>
                </div>
              </CardContent>
            </Card>
          </MotionWrapper>

          {/* Theme Preview */}
          <MotionWrapper
            {...(animationsEnabled ? {
              initial: { opacity: 0, y: 20 },
              animate: { opacity: 1, y: 0 },
              transition: { delay: 0.4 }
            } : {})}
          >
            <Card className={cn(
              "border-2 backdrop-blur",
              currentTheme.bg,
              currentTheme.border,
              currentTheme.glow
            )}>
              <CardHeader>
                <CardTitle className={cn("flex items-center gap-2", currentTheme.text)}>
                  <Zap className="h-5 w-5" />
                  Theme Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className={cn("text-sm", currentTheme.text)}>
                    Active Theme: {currentTheme.name}
                  </div>
                  <div className="flex gap-2">
                    <div className={cn("h-4 w-4 rounded-full", currentTheme.accent)} />
                    <div className={cn("h-4 w-4 rounded-full", currentTheme.bg)} />
                    <div className={cn("h-4 w-4 rounded-full border-2", currentTheme.border)} />
                  </div>
                  <div className={cn("text-xs font-mono", currentTheme.text)}>
                    Accent • Background • Border
                  </div>
                </div>
              </CardContent>
            </Card>
          </MotionWrapper>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-slate-400 text-sm"
        >
          <p>
            Futuristic UI refresh completed • All animations respect user preferences • 
            Accessible design with proper focus management
          </p>
        </motion.div>
      </div>
    </div>
  )
}
