import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Settings, 
  Download, 
  Zap,
  Activity,
  Target,
  TrendingUp
} from 'lucide-react'
import type { AriesModProps, AriesMod, AriesModData } from '@/types/ariesmods'

export interface SpringDamperConfig {
  title: string
  mass: number
  springConstant: number
  dampingCoefficient: number
  initialPosition: number
  initialVelocity: number
  externalForce: number
  forceFrequency: number
  forceAmplitude: number
  simulationSpeed: number
  timeStep: number
  showTrajectory: boolean
  showPhaseSpace: boolean
  showEnergyPlot: boolean
  gridLines: boolean
  autoScale: boolean
  plotLength: number
}

export interface SpringDamperState {
  position: number
  velocity: number
  acceleration: number
  time: number
  energy: {
    kinetic: number
    potential: number
    total: number
    dissipated: number
  }
}

export interface SpringDamperData extends AriesModData {
  currentState: SpringDamperState
  trajectory: Array<{ t: number; x: number; v: number; a: number }>
  phaseSpace: Array<{ x: number; v: number }>
  energyHistory: Array<{ t: number; kinetic: number; potential: number; total: number }>
  isRunning: boolean
  systemType: 'underdamped' | 'overdamped' | 'critically_damped'
  resonanceFrequency: number
  dampingRatio: number
  naturalFrequency: number
  quality: number
}

const SpringDamper: React.FC<AriesModProps> = ({
  id,
  title,
  width = 400,
  height = 300,
  data,
  config,
  onConfigChange,
  onDataRequest
}) => {
  const springConfig = config as SpringDamperConfig
  const springData = data as SpringDamperData

  const [isExpanded, setIsExpanded] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const animationRef = useRef<number | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Dummy data for demo purposes
  const getDummyData = useCallback((): SpringDamperData => {
    const t = Date.now() / 1000
    const omega = Math.sqrt((springConfig?.springConstant || 10) / (springConfig?.mass || 1))
    const zeta = (springConfig?.dampingCoefficient || 0.5) / (2 * Math.sqrt((springConfig?.springConstant || 10) * (springConfig?.mass || 1)))
    
    // Simple harmonic oscillator with damping
    const position = Math.exp(-zeta * omega * t) * Math.cos(omega * Math.sqrt(1 - zeta * zeta) * t) * (springConfig?.initialPosition || 1)
    const velocity = -Math.exp(-zeta * omega * t) * omega * (zeta * Math.cos(omega * Math.sqrt(1 - zeta * zeta) * t) + Math.sqrt(1 - zeta * zeta) * Math.sin(omega * Math.sqrt(1 - zeta * zeta) * t)) * (springConfig?.initialPosition || 1)
    
    const kinetic = 0.5 * (springConfig?.mass || 1) * velocity * velocity
    const potential = 0.5 * (springConfig?.springConstant || 10) * position * position
    
    return {
      value: position,
      timestamp: new Date().toISOString(),
      currentState: {
        position,
        velocity,
        acceleration: -(springConfig?.springConstant || 10) * position / (springConfig?.mass || 1) - (springConfig?.dampingCoefficient || 0.5) * velocity / (springConfig?.mass || 1),
        time: t,
        energy: {
          kinetic,
          potential,
          total: kinetic + potential,
          dissipated: 0.1 * t
        }
      },
      trajectory: springData?.trajectory || Array.from({ length: 100 }, (_, i) => {
        const time = i * 0.1
        const pos = Math.exp(-zeta * omega * time) * Math.cos(omega * Math.sqrt(1 - zeta * zeta) * time) * (springConfig?.initialPosition || 1)
        const vel = -Math.exp(-zeta * omega * time) * omega * (zeta * Math.cos(omega * Math.sqrt(1 - zeta * zeta) * time) + Math.sqrt(1 - zeta * zeta) * Math.sin(omega * Math.sqrt(1 - zeta * zeta) * time)) * (springConfig?.initialPosition || 1)
        return { t: time, x: pos, v: vel, a: -(springConfig?.springConstant || 10) * pos / (springConfig?.mass || 1) }
      }),
      phaseSpace: springData?.phaseSpace || Array.from({ length: 100 }, (_, i) => {
        const time = i * 0.1
        const pos = Math.exp(-zeta * omega * time) * Math.cos(omega * Math.sqrt(1 - zeta * zeta) * time) * (springConfig?.initialPosition || 1)
        const vel = -Math.exp(-zeta * omega * time) * omega * (zeta * Math.cos(omega * Math.sqrt(1 - zeta * zeta) * time) + Math.sqrt(1 - zeta * zeta) * Math.sin(omega * Math.sqrt(1 - zeta * zeta) * time)) * (springConfig?.initialPosition || 1)
        return { x: pos, v: vel }
      }),
      energyHistory: springData?.energyHistory || Array.from({ length: 100 }, (_, i) => {
        const time = i * 0.1
        const k = 0.5 * Math.exp(-2 * zeta * omega * time)
        const p = 0.5 * Math.exp(-2 * zeta * omega * time)
        return { t: time, kinetic: k, potential: p, total: k + p }
      }),
      isRunning: springData?.isRunning ?? false,
      systemType: zeta < 1 ? 'underdamped' : zeta > 1 ? 'overdamped' : 'critically_damped',
      resonanceFrequency: omega,
      dampingRatio: zeta,
      naturalFrequency: omega,
      quality: 1 / (2 * zeta),
      metadata: { source: 'physics', type: 'spring_damper' }
    }
  }, [springConfig, springData])

  const currentData = useMemo(() => {
    if (springData && springData.currentState && springData.trajectory && springData.phaseSpace) {
      return springData as SpringDamperData
    }
    return getDummyData()
  }, [springData, getDummyData])

  const handleConfigChange = (key: keyof SpringDamperConfig, value: any) => {
    onConfigChange?.({
      ...springConfig,
      [key]: value
    })
  }

  const startSimulation = () => {
    onDataRequest?.(id, {
      action: 'start_simulation',
      config: springConfig
    })
  }

  const stopSimulation = () => {
    onDataRequest?.(id, {
      action: 'stop_simulation'
    })
  }

  const resetSimulation = () => {
    onDataRequest?.(id, {
      action: 'reset_simulation',
      initialConditions: {
        position: springConfig?.initialPosition || 0,
        velocity: springConfig?.initialVelocity || 0
      }
    })
  }

  const applyImpulse = (force: number) => {
    onDataRequest?.(id, {
      action: 'apply_impulse',
      force
    })
  }

  // Render spring-mass visualization
  const renderVisualization = () => {
    const plotWidth = 280
    const plotHeight = 120
    const massSize = 20
    const springLength = 80
    const equilibrium = plotWidth / 2
    const massPosition = equilibrium + (currentData.currentState?.position || 0) * 50 // Scale for display
    
    return (
      <div className="relative bg-background border rounded p-4">
        <svg width={plotWidth} height={plotHeight} className="overflow-visible">
          {/* Wall */}
          <rect x="10" y="20" width="4" height="80" fill="currentColor" className="opacity-60" />
          
          {/* Spring */}
          <path
            d={`M 14 ${plotHeight/2} 
                Q ${14 + springLength/4} ${plotHeight/2 - 10} ${14 + springLength/2} ${plotHeight/2}
                Q ${14 + 3*springLength/4} ${plotHeight/2 + 10} ${massPosition - massSize/2} ${plotHeight/2}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="stroke-blue-500"
          />
          
          {/* Mass */}
          <rect
            x={massPosition - massSize/2}
            y={plotHeight/2 - massSize/2}
            width={massSize}
            height={massSize}
            fill="currentColor"
            className="fill-red-500"
            rx="2"
          />
          
          {/* Damper */}
          <g>
            <rect
              x={massPosition + massSize/2}
              y={plotHeight/2 - 6}
              width="15"
              height="12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="stroke-gray-500"
            />
            <line
              x1={massPosition + massSize/2 + 15}
              y1={plotHeight/2}
              x2={plotWidth - 20}
              y2={plotHeight/2}
              stroke="currentColor"
              strokeWidth="1"
              className="stroke-gray-500"
            />
            <rect
              x={plotWidth - 20}
              y={plotHeight/2 - 8}
              width="4"
              height="16"
              fill="currentColor"
              className="fill-gray-500"
            />
          </g>
          
          {/* Ground */}
          <line
            x1="0"
            y1={plotHeight - 10}
            x2={plotWidth}
            y2={plotHeight - 10}
            stroke="currentColor"
            strokeWidth="2"
            className="stroke-gray-600"
          />
          
          {/* Force arrow */}
          {springConfig?.externalForce !== 0 && (
            <g>
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                        refX="0" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="orange" />
                </marker>
              </defs>
              <line
                x1={massPosition}
                y1={plotHeight/2 - 30}
                x2={massPosition + ((springConfig?.externalForce || 0) > 0 ? 30 : -30)}
                y2={plotHeight/2 - 30}
                stroke="orange"
                strokeWidth="2"
                markerEnd="url(#arrowhead)"
              />
              <text
                x={massPosition}
                y={plotHeight/2 - 35}
                textAnchor="middle"
                className="text-xs fill-orange-500"
              >
                F={(springConfig?.externalForce || 0).toFixed(1)}N
              </text>
            </g>
          )}
          
          {/* Labels */}
          <text x={equilibrium} y={plotHeight - 20} textAnchor="middle" className="text-xs fill-current">
            Equilibrium
          </text>
          <text x={massPosition} y={plotHeight/2 + 35} textAnchor="middle" className="text-xs fill-current">
            x={(currentData.currentState?.position || 0).toFixed(2)}m
          </text>
        </svg>
      </div>
    )
  }

  const renderTrajectoryPlot = () => {
    const plotWidth = 280
    const plotHeight = 120
    const margin = { top: 10, right: 10, bottom: 20, left: 30 }
    
    const xScale = (t: number) => 
      margin.left + ((t - (currentData.trajectory?.[0]?.t || 0)) / ((currentData.trajectory?.[currentData.trajectory.length - 1]?.t || 10) - (currentData.trajectory?.[0]?.t || 0))) * (plotWidth - margin.left - margin.right)
    const yScale = (x: number) => {
      const maxX = Math.max(...(currentData.trajectory?.map(p => Math.abs(p.x)) || [1]))
      return plotHeight - margin.bottom - ((x + maxX) / (2 * maxX)) * (plotHeight - margin.top - margin.bottom)
    }

    return (
      <div className="relative bg-background border rounded p-2">
        <svg width={plotWidth} height={plotHeight} className="overflow-visible">
          {/* Grid */}
          {springConfig?.gridLines && (
            <g className="opacity-30">
              {Array.from({ length: 6 }, (_, i) => (
                <g key={i}>
                  <line
                    x1={margin.left + (i / 5) * (plotWidth - margin.left - margin.right)}
                    y1={margin.top}
                    x2={margin.left + (i / 5) * (plotWidth - margin.left - margin.right)}
                    y2={plotHeight - margin.bottom}
                    stroke="currentColor"
                    strokeWidth="0.5"
                  />
                  <line
                    x1={margin.left}
                    y1={margin.top + (i / 5) * (plotHeight - margin.top - margin.bottom)}
                    x2={plotWidth - margin.right}
                    y2={margin.top + (i / 5) * (plotHeight - margin.top - margin.bottom)}
                    stroke="currentColor"
                    strokeWidth="0.5"
                  />
                </g>
              ))}
            </g>
          )}
          
          {/* Axes */}
          <g>
            <line
              x1={margin.left}
              y1={plotHeight - margin.bottom}
              x2={plotWidth - margin.right}
              y2={plotHeight - margin.bottom}
              stroke="currentColor"
              strokeWidth="1"
            />
            <line
              x1={margin.left}
              y1={margin.top}
              x2={margin.left}
              y2={plotHeight - margin.bottom}
              stroke="currentColor"
              strokeWidth="1"
            />
          </g>

          {/* Position trajectory */}
          {(currentData.trajectory?.length || 0) > 1 && (
            <path
              d={`M ${(currentData.trajectory || []).map(point => 
                `${xScale(point.t)},${yScale(point.x)}`
              ).join(' L ')}`}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
            />
          )}
          
          {/* Current position marker */}
          <circle
            cx={xScale(currentData.currentState?.time || 0)}
            cy={yScale(currentData.currentState?.position || 0)}
            r="3"
            fill="#ef4444"
          />
          
          {/* Labels */}
          <text x={plotWidth / 2} y={plotHeight - 5} textAnchor="middle" className="text-xs fill-current">
            Time (s)
          </text>
          <text x={15} y={plotHeight / 2} textAnchor="middle" className="text-xs fill-current" 
                transform={`rotate(-90, 15, ${plotHeight / 2})`}>
            Position (m)
          </text>
        </svg>
      </div>
    )
  }

  const renderPhaseSpace = () => {
    const plotWidth = 280
    const plotHeight = 120
    const margin = { top: 10, right: 10, bottom: 20, left: 30 }
    
    const maxX = Math.max(...(currentData.phaseSpace?.map(p => Math.abs(p.x)) || [1]))
    const maxV = Math.max(...(currentData.phaseSpace?.map(p => Math.abs(p.v)) || [1]))
    
    const xScale = (x: number) => 
      margin.left + ((x + maxX) / (2 * maxX)) * (plotWidth - margin.left - margin.right)
    const yScale = (v: number) => 
      plotHeight - margin.bottom - ((v + maxV) / (2 * maxV)) * (plotHeight - margin.top - margin.bottom)

    return (
      <div className="relative bg-background border rounded p-2">
        <svg width={plotWidth} height={plotHeight} className="overflow-visible">
          {/* Axes */}
          <g>
            <line
              x1={margin.left}
              y1={plotHeight - margin.bottom}
              x2={plotWidth - margin.right}
              y2={plotHeight - margin.bottom}
              stroke="currentColor"
              strokeWidth="1"
            />
            <line
              x1={margin.left}
              y1={margin.top}
              x2={margin.left}
              y2={plotHeight - margin.bottom}
              stroke="currentColor"
              strokeWidth="1"
            />
          </g>

          {/* Phase space trajectory */}
          {(currentData.phaseSpace?.length || 0) > 1 && (
            <path
              d={`M ${(currentData.phaseSpace || []).map(point => 
                `${xScale(point.x)},${yScale(point.v)}`
              ).join(' L ')}`}
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
            />
          )}
          
          {/* Current state marker */}
          <circle
            cx={xScale(currentData.currentState?.position || 0)}
            cy={yScale(currentData.currentState?.velocity || 0)}
            r="3"
            fill="#ef4444"
          />
          
          {/* Labels */}
          <text x={plotWidth / 2} y={plotHeight - 5} textAnchor="middle" className="text-xs fill-current">
            Position (m)
          </text>
          <text x={15} y={plotHeight / 2} textAnchor="middle" className="text-xs fill-current" 
                transform={`rotate(-90, 15, ${plotHeight / 2})`}>
            Velocity (m/s)
          </text>
        </svg>
      </div>
    )
  }

  const renderControls = () => (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Mass: {springConfig?.mass || 1} kg</Label>
          <Slider
            value={[springConfig?.mass || 1]}
            onValueChange={(value) => handleConfigChange('mass', value[0])}
            min={0.1}
            max={10}
            step={0.1}
            className="w-full"
          />
        </div>
        <div>
          <Label className="text-xs">Spring K: {springConfig?.springConstant || 10} N/m</Label>
          <Slider
            value={[springConfig?.springConstant || 10]}
            onValueChange={(value) => handleConfigChange('springConstant', value[0])}
            min={1}
            max={100}
            step={1}
            className="w-full"
          />
        </div>
        <div>
          <Label className="text-xs">Damping: {springConfig?.dampingCoefficient || 0.5} Ns/m</Label>
          <Slider
            value={[springConfig?.dampingCoefficient || 0.5]}
            onValueChange={(value) => handleConfigChange('dampingCoefficient', value[0])}
            min={0}
            max={5}
            step={0.1}
            className="w-full"
          />
        </div>
        <div>
          <Label className="text-xs">Force: {springConfig?.externalForce || 0} N</Label>
          <Slider
            value={[springConfig?.externalForce || 0]}
            onValueChange={(value) => handleConfigChange('externalForce', value[0])}
            min={-10}
            max={10}
            step={0.1}
            className="w-full"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          variant={currentData?.isRunning ? "default" : "outline"}
          size="sm"
          onClick={currentData?.isRunning ? stopSimulation : startSimulation}
          className="flex-1"
        >
          {currentData?.isRunning ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
          {currentData?.isRunning ? 'Pause' : 'Start'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={resetSimulation}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => applyImpulse(5)}
        >
          <Zap className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  const renderSystemInfo = () => (
    <div className="grid grid-cols-2 gap-2 text-xs">
      <div>
        <div className="text-muted-foreground">System Type</div>
        <Badge variant={
          currentData?.systemType === 'underdamped' ? 'default' :
          currentData?.systemType === 'overdamped' ? 'destructive' : 'secondary'
        }>
          {(currentData?.systemType || 'unknown').replace('_', ' ')}
        </Badge>
      </div>
      <div>
        <div className="text-muted-foreground">Natural Freq</div>
        <div className="font-mono">{(currentData?.naturalFrequency || 0).toFixed(2)} Hz</div>
      </div>
      <div>
        <div className="text-muted-foreground">Damping Ratio</div>
        <div className="font-mono">{(currentData?.dampingRatio || 0).toFixed(3)}</div>
      </div>
      <div>
        <div className="text-muted-foreground">Quality Factor</div>
        <div className="font-mono">{(currentData?.quality || 0).toFixed(1)}</div>
      </div>
      <div>
        <div className="text-muted-foreground">Position</div>
        <div className="font-mono">{(currentData.currentState?.position || 0).toFixed(3)} m</div>
      </div>
      <div>
        <div className="text-muted-foreground">Velocity</div>
        <div className="font-mono">{(currentData.currentState?.velocity || 0).toFixed(3)} m/s</div>
      </div>
      <div>
        <div className="text-muted-foreground">Kinetic Energy</div>
        <div className="font-mono">{(currentData.currentState?.energy?.kinetic || 0).toFixed(3)} J</div>
      </div>
      <div>
        <div className="text-muted-foreground">Potential Energy</div>
        <div className="font-mono">{(currentData.currentState?.energy?.potential || 0).toFixed(3)} J</div>
      </div>
    </div>
  )

  const renderSettings = () => (
    <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded">
      <div className="space-y-2">
        <Label className="text-xs">Initial Position (m)</Label>
        <Input
          type="number"
          value={springConfig?.initialPosition || 0}
          onChange={(e) => handleConfigChange('initialPosition', parseFloat(e.target.value))}
          className="h-8 text-xs"
          step="0.1"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Initial Velocity (m/s)</Label>
        <Input
          type="number"
          value={springConfig?.initialVelocity || 0}
          onChange={(e) => handleConfigChange('initialVelocity', parseFloat(e.target.value))}
          className="h-8 text-xs"
          step="0.1"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Time Step (s)</Label>
        <Input
          type="number"
          value={springConfig?.timeStep || 0.01}
          onChange={(e) => handleConfigChange('timeStep', parseFloat(e.target.value))}
          className="h-8 text-xs"
          step="0.001"
          min="0.001"
          max="0.1"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Simulation Speed</Label>
        <Slider
          value={[springConfig?.simulationSpeed || 1]}
          onValueChange={(value) => handleConfigChange('simulationSpeed', value[0])}
          min={0.1}
          max={5}
          step={0.1}
          className="w-full"
        />
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="show-trajectory"
          checked={springConfig?.showTrajectory || false}
          onCheckedChange={(checked) => handleConfigChange('showTrajectory', checked)}
        />
        <Label htmlFor="show-trajectory" className="text-xs">Show Trajectory</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="show-phase"
          checked={springConfig?.showPhaseSpace || false}
          onCheckedChange={(checked) => handleConfigChange('showPhaseSpace', checked)}
        />
        <Label htmlFor="show-phase" className="text-xs">Phase Space</Label>
      </div>
    </div>
  )

  return (
    <Card className="w-full h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            {springConfig?.title || title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge 
              variant={currentData?.isRunning ? "default" : "secondary"}
              className="text-xs"
            >
              {currentData?.isRunning ? 'Running' : 'Stopped'}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <Settings className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isExpanded && renderSettings()}
        
        {renderVisualization()}
        
        <Tabs defaultValue="controls" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="controls" className="text-xs">Controls</TabsTrigger>
            <TabsTrigger value="plots" className="text-xs">Plots</TabsTrigger>
            <TabsTrigger value="info" className="text-xs">System Info</TabsTrigger>
          </TabsList>
          <TabsContent value="controls" className="mt-3">
            {renderControls()}
          </TabsContent>
          <TabsContent value="plots" className="mt-3 space-y-3">
            {springConfig?.showTrajectory && (
              <div>
                <div className="text-sm font-medium mb-2">Position vs Time</div>
                {renderTrajectoryPlot()}
              </div>
            )}
            {springConfig?.showPhaseSpace && (
              <div>
                <div className="text-sm font-medium mb-2">Phase Space</div>
                {renderPhaseSpace()}
              </div>
            )}
          </TabsContent>
          <TabsContent value="info" className="mt-3">
            {renderSystemInfo()}
          </TabsContent>
        </Tabs>

        <div className="text-xs text-muted-foreground text-center">
          Time: {(currentData.currentState?.time || 0).toFixed(2)}s
        </div>
      </CardContent>
    </Card>
  )
}

// AriesMod configuration
export const SpringDamperMod: AriesMod = {
  metadata: {
    id: 'spring-damper',
    displayName: 'Spring-Damper System',
    description: 'Interactive spring-mass-damper physics simulation with real-time visualization',
    category: 'physics',
    tags: ['physics', 'simulation', 'spring', 'damper', 'oscillator', 'dynamics'],
    version: '1.0.0',
    author: 'AriesUI',
    thumbnail: '/thumbnails/spring-damper.png',
    defaultSize: { width: 400, height: 450 },
    minSize: { width: 350, height: 300 },
    maxSize: { width: 600, height: 700 },
    supportedDataTypes: ['physics', 'simulation', 'dynamic_system'],
    configurable: true,
    hardwareIntegrated: false
  },
  component: SpringDamper,
  defaultConfig: {
    title: 'Spring-Damper System',
    mass: 1,
    springConstant: 10,
    dampingCoefficient: 0.5,
    initialPosition: 1,
    initialVelocity: 0,
    externalForce: 0,
    forceFrequency: 1,
    forceAmplitude: 0,
    simulationSpeed: 1,
    timeStep: 0.01,
    showTrajectory: true,
    showPhaseSpace: true,
    showEnergyPlot: false,
    gridLines: true,
    autoScale: true,
    plotLength: 100
  },
  generateDummyData: () => ({
    value: 0.5,
    timestamp: new Date().toISOString(),
    currentState: {
      position: 0.5,
      velocity: -2.1,
      acceleration: -5.0,
      time: 2.5,
      energy: {
        kinetic: 2.2,
        potential: 1.25,
        total: 3.45,
        dissipated: 0.55
      }
    },
    trajectory: [],
    phaseSpace: [],
    energyHistory: [],
    isRunning: false,
    systemType: 'underdamped' as const,
    resonanceFrequency: 1.59,
    dampingRatio: 0.158,
    naturalFrequency: 1.59,
    quality: 3.16,
    metadata: { source: 'demo' }
  }),
  validateConfig: (config: Record<string, any>) => {
    return typeof config.title === 'string' && 
           typeof config.mass === 'number' &&
           config.mass > 0 &&
           typeof config.springConstant === 'number' &&
           config.springConstant > 0
  }
}

export default SpringDamper 