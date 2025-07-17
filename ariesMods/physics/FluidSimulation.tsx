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
  Droplets,
  Wind,
  Thermometer,
  Gauge,
  Waves
} from 'lucide-react'
import type { AriesModProps, AriesMod, AriesModData } from '@/types/ariesmods'

export interface FluidSimulationConfig {
  title: string
  viscosity: number
  density: number
  pressure: number
  temperature: number
  gravity: number
  windSpeed: number
  windDirection: number
  particleCount: number
  simulationSpeed: number
  showVelocityField: boolean
  showPressureField: boolean
  showTemperatureField: boolean
  showParticleTrails: boolean
  showBoundaries: boolean
  colorMode: 'velocity' | 'pressure' | 'temperature' | 'density'
  fluidType: 'water' | 'air' | 'oil' | 'custom'
  boundaryType: 'open' | 'closed' | 'periodic'
}

export interface FluidParticle {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  pressure: number
  density: number
  temperature: number
  age: number
}

export interface FluidField {
  velocityX: number[][]
  velocityY: number[][]
  pressure: number[][]
  density: number[][]
  temperature: number[][]
}

export interface FluidSimulationData extends AriesModData {
  particles: FluidParticle[]
  field: FluidField
  isRunning: boolean
  simulationTime: number
  averageVelocity: number
  averagePressure: number
  averageTemperature: number
  reynoldsNumber: number
  turbulenceLevel: number
  energyDissipation: number
  gridSize: { width: number; height: number }
}

const FluidSimulation: React.FC<AriesModProps> = ({
  id,
  title,
  width = 400,
  height = 300,
  data,
  config,
  onConfigChange,
  onDataRequest
}) => {
  const fluidConfig = config as FluidSimulationConfig
  const fluidData = data as FluidSimulationData

  const [isExpanded, setIsExpanded] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)

  // Dummy data for demo purposes
  const getDummyData = useCallback((): FluidSimulationData => {
    const gridWidth = 32
    const gridHeight = 24
    const particleCount = fluidConfig?.particleCount || 100
    
    // Generate dummy particles
    const particles: FluidParticle[] = Array.from({ length: particleCount }, (_, i) => ({
      id: `particle_${i}`,
      x: Math.random() * 280,
      y: Math.random() * 160,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      pressure: 1.0 + Math.random() * 0.2,
      density: 1.0 + Math.random() * 0.1,
      temperature: 20 + Math.random() * 10,
      age: Math.random() * 100
    }))

    // Generate dummy field data
    const velocityX = Array.from({ length: gridHeight }, () => 
      Array.from({ length: gridWidth }, () => (Math.random() - 0.5) * 2)
    )
    const velocityY = Array.from({ length: gridHeight }, () => 
      Array.from({ length: gridWidth }, () => (Math.random() - 0.5) * 2)
    )
    const pressure = Array.from({ length: gridHeight }, () => 
      Array.from({ length: gridWidth }, () => 1.0 + Math.random() * 0.2)
    )
    const density = Array.from({ length: gridHeight }, () => 
      Array.from({ length: gridWidth }, () => 1.0 + Math.random() * 0.1)
    )
    const temperature = Array.from({ length: gridHeight }, () => 
      Array.from({ length: gridWidth }, () => 20 + Math.random() * 10)
    )

    return {
      value: fluidData?.averageVelocity || 1.5,
      timestamp: new Date().toISOString(),
      particles,
      field: { velocityX, velocityY, pressure, density, temperature },
      isRunning: fluidData?.isRunning ?? false,
      simulationTime: fluidData?.simulationTime || 0,
      averageVelocity: 1.5,
      averagePressure: 1.1,
      averageTemperature: 25.3,
      reynoldsNumber: 2340,
      turbulenceLevel: 0.15,
      energyDissipation: 0.02,
      gridSize: { width: gridWidth, height: gridHeight },
      metadata: { source: 'physics', type: 'fluid_simulation' }
    }
  }, [fluidConfig, fluidData])

  const currentData = useMemo(() => {
    if (fluidData && fluidData.particles && fluidData.field && fluidData.gridSize) {
      return fluidData as FluidSimulationData
    }
    return getDummyData()
  }, [fluidData, getDummyData])

  const handleConfigChange = (key: keyof FluidSimulationConfig, value: any) => {
    onConfigChange?.({
      ...fluidConfig,
      [key]: value
    })
  }

  const startSimulation = () => {
    onDataRequest?.(id, {
      action: 'start_simulation',
      config: fluidConfig
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
      config: fluidConfig
    })
  }

  const addFluidSource = (x: number, y: number) => {
    onDataRequest?.(id, {
      action: 'add_fluid_source',
      position: { x, y },
      properties: {
        velocity: { x: fluidConfig?.windSpeed || 0, y: 0 },
        pressure: fluidConfig?.pressure || 1.0,
        temperature: fluidConfig?.temperature || 20
      }
    })
  }

  const getFluidTypeProperties = (type: string) => {
    switch (type) {
      case 'water':
        return { viscosity: 0.001, density: 1000, color: '#3b82f6' }
      case 'air':
        return { viscosity: 0.000018, density: 1.2, color: '#e5e7eb' }
      case 'oil':
        return { viscosity: 0.1, density: 850, color: '#7c2d12' }
      default:
        return { viscosity: fluidConfig?.viscosity || 0.001, density: fluidConfig?.density || 1000, color: '#6b7280' }
    }
  }

  const getColorForValue = (value: number, mode: string) => {
    const normalized = Math.max(0, Math.min(1, value))
    
    switch (mode) {
      case 'velocity':
        const r = Math.floor(normalized * 255)
        return `rgb(${r}, 0, ${255 - r})`
      case 'pressure':
        const g = Math.floor(normalized * 255)
        return `rgb(0, ${g}, 0)`
      case 'temperature':
        const temp = Math.floor(normalized * 255)
        return `rgb(${temp}, ${temp/2}, 0)`
      default:
        return `rgb(${normalized * 255}, ${normalized * 255}, ${normalized * 255})`
    }
  }

  // Render fluid visualization
  const renderFluidVisualization = () => {
    const plotWidth = 280
    const plotHeight = 160
    
    return (
      <div className="relative bg-black border rounded overflow-hidden">
        <canvas
          ref={canvasRef}
          width={plotWidth}
          height={plotHeight}
          className="cursor-crosshair"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            setMousePosition({
              x: e.clientX - rect.left,
              y: e.clientY - rect.top
            })
          }}
          onMouseDown={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            const x = e.clientX - rect.left
            const y = e.clientY - rect.top
            setIsDragging(true)
            addFluidSource(x, y)
          }}
          onMouseUp={() => setIsDragging(false)}
        />
        
        {/* Overlay for field visualization */}
        <svg 
          width={plotWidth} 
          height={plotHeight} 
          className="absolute inset-0 pointer-events-none"
        >
          {/* Velocity field vectors */}
          {fluidConfig?.showVelocityField && (
            <g>
              {currentData.field?.velocityX?.map((row, y) =>
                row.map((vx, x) => {
                  const vy = currentData.field?.velocityY?.[y]?.[x] || 0
                  const magnitude = Math.sqrt(vx * vx + vy * vy)
                  const scale = 8
                  const startX = (x / (currentData.gridSize?.width || 30)) * plotWidth
                  const startY = (y / (currentData.gridSize?.height || 20)) * plotHeight
                  const endX = startX + vx * scale
                  const endY = startY + vy * scale
                  
                  return magnitude > 0.1 ? (
                    <line
                      key={`velocity_${x}_${y}`}
                      x1={startX}
                      y1={startY}
                      x2={endX}
                      y2={endY}
                      stroke="#ffffff"
                      strokeWidth="1"
                      opacity={Math.min(1, magnitude)}
                      markerEnd="url(#arrowhead)"
                    />
                  ) : null
                })
              )}
              <defs>
                <marker id="arrowhead" markerWidth="6" markerHeight="4" 
                        refX="6" refY="2" orient="auto">
                  <polygon points="0 0, 6 2, 0 4" fill="white" />
                </marker>
              </defs>
            </g>
          )}
          
          {/* Pressure field */}
          {fluidConfig?.showPressureField && (
            <g>
              {currentData.field?.pressure?.map((row, y) =>
                row.map((pressure, x) => {
                  const cellWidth = plotWidth / (currentData.gridSize?.width || 30)
                  const cellHeight = plotHeight / (currentData.gridSize?.height || 20)
                  const color = getColorForValue((pressure - 0.8) / 0.4, 'pressure')
                  
                  return (
                    <rect
                      key={`pressure_${x}_${y}`}
                      x={x * cellWidth}
                      y={y * cellHeight}
                      width={cellWidth}
                      height={cellHeight}
                      fill={color}
                      opacity={0.3}
                    />
                  )
                })
              )}
            </g>
          )}
          
          {/* Particles */}
          {currentData.particles?.map((particle) => (
            <g key={particle.id}>
              <circle
                cx={particle.x}
                cy={particle.y}
                r={Math.max(1, Math.min(3, particle.density))}
                fill={getColorForValue(
                  Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy) / 5,
                  fluidConfig?.colorMode || 'velocity'
                )}
                opacity={0.8}
              />
              {fluidConfig?.showParticleTrails && (
                <line
                  x1={particle.x}
                  y1={particle.y}
                  x2={particle.x - particle.vx * 5}
                  y2={particle.y - particle.vy * 5}
                  stroke={getColorForValue(
                    Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy) / 5,
                    fluidConfig?.colorMode || 'velocity'
                  )}
                  strokeWidth="1"
                  opacity={0.5}
                />
              )}
            </g>
          ))}
          
          {/* Boundaries */}
          {fluidConfig?.showBoundaries && (
            <g>
              <rect
                x="1"
                y="1"
                width={plotWidth - 2}
                height={plotHeight - 2}
                fill="none"
                stroke="#ffffff"
                strokeWidth="2"
                opacity={0.5}
              />
            </g>
          )}
        </svg>
        
        {/* Status indicators */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          <Badge variant="outline" className="text-xs bg-black/50 text-white">
            Re: {currentData.reynoldsNumber}
          </Badge>
          <Badge variant="outline" className="text-xs bg-black/50 text-white">
            Turb: {(currentData.turbulenceLevel * 100).toFixed(1)}%
          </Badge>
        </div>
        
        <div className="absolute top-2 right-2">
          <Badge variant="outline" className="text-xs bg-black/50 text-white">
            {currentData.particles?.length || 0} particles
          </Badge>
        </div>
        
        <div className="absolute bottom-2 left-2">
          <Badge variant="outline" className="text-xs bg-black/50 text-white">
            t: {currentData.simulationTime.toFixed(1)}s
          </Badge>
        </div>
      </div>
    )
  }

  const renderControls = () => (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Viscosity: {fluidConfig?.viscosity || 0.001}</Label>
          <Slider
            value={[fluidConfig?.viscosity || 0.001]}
            onValueChange={(value) => handleConfigChange('viscosity', value[0])}
            min={0.0001}
            max={0.1}
            step={0.0001}
            className="w-full"
          />
        </div>
        <div>
          <Label className="text-xs">Density: {fluidConfig?.density || 1000}</Label>
          <Slider
            value={[fluidConfig?.density || 1000]}
            onValueChange={(value) => handleConfigChange('density', value[0])}
            min={100}
            max={2000}
            step={10}
            className="w-full"
          />
        </div>
        <div>
          <Label className="text-xs">Wind Speed: {fluidConfig?.windSpeed || 0}</Label>
          <Slider
            value={[fluidConfig?.windSpeed || 0]}
            onValueChange={(value) => handleConfigChange('windSpeed', value[0])}
            min={0}
            max={10}
            step={0.1}
            className="w-full"
          />
        </div>
        <div>
          <Label className="text-xs">Temperature: {fluidConfig?.temperature || 20}°C</Label>
          <Slider
            value={[fluidConfig?.temperature || 20]}
            onValueChange={(value) => handleConfigChange('temperature', value[0])}
            min={0}
            max={100}
            step={1}
            className="w-full"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          variant={currentData.isRunning ? "default" : "outline"}
          size="sm"
          onClick={currentData.isRunning ? stopSimulation : startSimulation}
          className="flex-1"
        >
          {currentData.isRunning ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
          {currentData.isRunning ? 'Pause' : 'Start'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={resetSimulation}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  const renderFluidProperties = () => (
    <div className="grid grid-cols-2 gap-2 text-xs">
      <div>
        <div className="text-muted-foreground">Avg Velocity</div>
        <div className="font-mono">{currentData.averageVelocity.toFixed(2)} m/s</div>
      </div>
      <div>
        <div className="text-muted-foreground">Avg Pressure</div>
        <div className="font-mono">{currentData.averagePressure.toFixed(3)} atm</div>
      </div>
      <div>
        <div className="text-muted-foreground">Avg Temperature</div>
        <div className="font-mono">{currentData.averageTemperature.toFixed(1)} °C</div>
      </div>
      <div>
        <div className="text-muted-foreground">Reynolds Number</div>
        <div className="font-mono">{currentData.reynoldsNumber}</div>
      </div>
      <div>
        <div className="text-muted-foreground">Turbulence</div>
        <div className="font-mono">{(currentData.turbulenceLevel * 100).toFixed(1)}%</div>
      </div>
      <div>
        <div className="text-muted-foreground">Energy Loss</div>
        <div className="font-mono">{(currentData.energyDissipation * 100).toFixed(2)}%/s</div>
      </div>
      <div>
        <div className="text-muted-foreground">Particles</div>
        <div className="font-mono">{currentData.particles?.length || 0}</div>
      </div>
      <div>
        <div className="text-muted-foreground">Grid Size</div>
        <div className="font-mono">{currentData.gridSize?.width || 30}×{currentData.gridSize?.height || 20}</div>
      </div>
    </div>
  )

  const renderSettings = () => (
    <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded">
      <div className="space-y-2">
        <Label className="text-xs">Fluid Type</Label>
        <Select
          value={fluidConfig?.fluidType || 'water'}
          onValueChange={(value) => handleConfigChange('fluidType', value)}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="water">Water</SelectItem>
            <SelectItem value="air">Air</SelectItem>
            <SelectItem value="oil">Oil</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Color Mode</Label>
        <Select
          value={fluidConfig?.colorMode || 'velocity'}
          onValueChange={(value) => handleConfigChange('colorMode', value)}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="velocity">Velocity</SelectItem>
            <SelectItem value="pressure">Pressure</SelectItem>
            <SelectItem value="temperature">Temperature</SelectItem>
            <SelectItem value="density">Density</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Particle Count</Label>
        <Slider
          value={[fluidConfig?.particleCount || 100]}
          onValueChange={(value) => handleConfigChange('particleCount', value[0])}
          min={50}
          max={500}
          step={10}
          className="w-full"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Simulation Speed</Label>
        <Slider
          value={[fluidConfig?.simulationSpeed || 1]}
          onValueChange={(value) => handleConfigChange('simulationSpeed', value[0])}
          min={0.1}
          max={5}
          step={0.1}
          className="w-full"
        />
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="show-velocity"
          checked={fluidConfig?.showVelocityField || false}
          onCheckedChange={(checked) => handleConfigChange('showVelocityField', checked)}
        />
        <Label htmlFor="show-velocity" className="text-xs">Velocity Field</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="show-pressure"
          checked={fluidConfig?.showPressureField || false}
          onCheckedChange={(checked) => handleConfigChange('showPressureField', checked)}
        />
        <Label htmlFor="show-pressure" className="text-xs">Pressure Field</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="particle-trails"
          checked={fluidConfig?.showParticleTrails || false}
          onCheckedChange={(checked) => handleConfigChange('showParticleTrails', checked)}
        />
        <Label htmlFor="particle-trails" className="text-xs">Particle Trails</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="show-boundaries"
          checked={fluidConfig?.showBoundaries || false}
          onCheckedChange={(checked) => handleConfigChange('showBoundaries', checked)}
        />
        <Label htmlFor="show-boundaries" className="text-xs">Show Boundaries</Label>
      </div>
    </div>
  )

  return (
    <Card className="w-full h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            {fluidConfig?.title || title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge 
              variant={currentData.isRunning ? "default" : "secondary"}
              className="text-xs"
            >
              {currentData.isRunning ? 'Running' : 'Stopped'}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {fluidConfig?.fluidType || 'water'}
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
        
        {renderFluidVisualization()}
        
        <Tabs defaultValue="controls" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="controls" className="text-xs">Controls</TabsTrigger>
            <TabsTrigger value="properties" className="text-xs">Properties</TabsTrigger>
          </TabsList>
          <TabsContent value="controls" className="mt-3">
            {renderControls()}
          </TabsContent>
          <TabsContent value="properties" className="mt-3">
            {renderFluidProperties()}
          </TabsContent>
        </Tabs>

        <div className="text-xs text-muted-foreground text-center">
          Click to add fluid source • Simulation Time: {currentData.simulationTime.toFixed(1)}s
        </div>
      </CardContent>
    </Card>
  )
}

// AriesMod configuration
export const FluidSimulationMod: AriesMod = {
  metadata: {
    id: 'fluid-simulation',
    displayName: 'Fluid Simulation',
    description: 'Interactive fluid dynamics simulation with particle systems and flow visualization',
    category: 'physics',
    tags: ['physics', 'simulation', 'fluid', 'dynamics', 'particles', 'flow'],
    version: '1.0.0',
    author: 'AriesUI',
    thumbnail: '/thumbnails/fluid-simulation.png',
    defaultSize: { width: 400, height: 500 },
    minSize: { width: 350, height: 350 },
    maxSize: { width: 600, height: 700 },
    supportedDataTypes: ['physics', 'simulation', 'fluid_dynamics'],
    configurable: true,
    hardwareIntegrated: false
  },
  component: FluidSimulation,
  defaultConfig: {
    title: 'Fluid Simulation',
    viscosity: 0.001,
    density: 1000,
    pressure: 1.0,
    temperature: 20,
    gravity: 9.81,
    windSpeed: 0,
    windDirection: 0,
    particleCount: 100,
    simulationSpeed: 1,
    showVelocityField: true,
    showPressureField: false,
    showTemperatureField: false,
    showParticleTrails: true,
    showBoundaries: true,
    colorMode: 'velocity',
    fluidType: 'water',
    boundaryType: 'closed'
  },
  generateDummyData: () => ({
    value: 1.5,
    timestamp: new Date().toISOString(),
    particles: Array.from({ length: 50 }, (_, i) => ({
      id: `particle_${i}`,
      x: Math.random() * 280,
      y: Math.random() * 160,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      pressure: 1.0 + Math.random() * 0.2,
      density: 1.0 + Math.random() * 0.1,
      temperature: 20 + Math.random() * 10,
      age: Math.random() * 100
    })),
    field: {
      velocityX: Array.from({ length: 20 }, () => Array.from({ length: 30 }, () => Math.random() - 0.5)),
      velocityY: Array.from({ length: 20 }, () => Array.from({ length: 30 }, () => Math.random() - 0.5)),
      pressure: Array.from({ length: 20 }, () => Array.from({ length: 30 }, () => 1.0 + Math.random() * 0.2)),
      density: Array.from({ length: 20 }, () => Array.from({ length: 30 }, () => 1.0 + Math.random() * 0.1)),
      temperature: Array.from({ length: 20 }, () => Array.from({ length: 30 }, () => 20 + Math.random() * 10))
    },
    isRunning: false,
    simulationTime: 0,
    averageVelocity: 1.5,
    averagePressure: 1.1,
    averageTemperature: 25.3,
    reynoldsNumber: 2340,
    turbulenceLevel: 0.15,
    energyDissipation: 0.02,
    gridSize: { width: 30, height: 20 },
    metadata: { source: 'demo' }
  }),
  validateConfig: (config: Record<string, any>) => {
    return typeof config.title === 'string' && 
           typeof config.viscosity === 'number' &&
           config.viscosity > 0 &&
           typeof config.density === 'number' &&
           config.density > 0
  }
}

export default FluidSimulation 