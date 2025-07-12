import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Move3D,
  Grid3X3,
  Eye,
  Settings,
  Play,
  Pause
} from 'lucide-react'
import type { AriesMod, AriesModProps, AriesModData } from '@/types/ariesmods'

// Three.js imports (would need to be installed)
// import * as THREE from 'three'
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

interface SensorPoint {
  id: string
  position: [number, number, number] // x, y, z coordinates
  value: number
  label: string
  type: 'temperature' | 'pressure' | 'voltage' | 'distance' | 'custom'
  color?: string
  visible: boolean
}

interface Scene3DConfig {
  modelUrl?: string
  backgroundColor?: string
  showGrid?: boolean
  showAxes?: boolean
  cameraPosition?: [number, number, number]
  cameraTarget?: [number, number, number]
  ambientLightIntensity?: number
  directionalLightIntensity?: number
  autoRotate?: boolean
  rotationSpeed?: number
  sensorPointSize?: number
  showSensorLabels?: boolean
  animate?: boolean
}

interface Scene3DData {
  sensorPoints?: SensorPoint[]
  pointClouds?: {
    id: string
    points: Float32Array
    colors?: Float32Array
    size?: number
  }[]
  robotPose?: {
    position: [number, number, number]
    rotation: [number, number, number]
  }
}

const Scene3DComponent: React.FC<AriesModProps> = ({
  id,
  title,
  width,
  height,
  data,
  config,
  onConfigChange,
  onDataRequest
}) => {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<any>(null)
  const rendererRef = useRef<any>(null)
  const cameraRef = useRef<any>(null)
  const controlsRef = useRef<any>(null)
  const animationRef = useRef<number | null>(null)
  
  const [isLoaded, setIsLoaded] = useState(false)
  const [isAnimating, setIsAnimating] = useState(true)
  const [cameraDistance, setCameraDistance] = useState(10)
  
  const scene3DConfig = config as Scene3DConfig
  const scene3DData = data?.value as Scene3DData

  const isCompact = width < 300 || height < 250

  // Initialize Three.js scene
  const initScene = useCallback(async () => {
    if (!mountRef.current) return

    try {
      // For now, create a placeholder scene without Three.js
      // In real implementation, this would initialize:
      // - THREE.Scene
      // - THREE.PerspectiveCamera  
      // - THREE.WebGLRenderer
      // - OrbitControls
      // - Lights, grid, axes
      
      const placeholder = document.createElement('div')
      placeholder.style.cssText = `
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: white;
        font-family: monospace;
        position: relative;
        overflow: hidden;
      `
      
      // Add 3D-like grid effect
      const grid = document.createElement('div')
      grid.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-image: 
          linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px);
        background-size: 20px 20px;
        transform: perspective(500px) rotateX(60deg);
        transform-origin: center bottom;
      `
      
      // Add scene info
      const info = document.createElement('div')
      info.style.cssText = `
        z-index: 10;
        text-align: center;
        background: rgba(0,0,0,0.5);
        padding: 20px;
        border-radius: 8px;
        backdrop-filter: blur(10px);
      `
      
      info.innerHTML = `
        <div style="font-size: 18px; margin-bottom: 10px;">🌐 3D Scene</div>
        <div style="font-size: 12px; opacity: 0.8;">Three.js integration required</div>
        <div style="font-size: 10px; margin-top: 10px;">
          Install: npm install three @types/three<br/>
          Sensor Points: ${scene3DData?.sensorPoints?.length || 0}<br/>
          Point Clouds: ${scene3DData?.pointClouds?.length || 0}
        </div>
      `
      
      // Add floating sensor points
      if (scene3DData?.sensorPoints) {
        scene3DData.sensorPoints.forEach((sensor, index) => {
          if (!sensor.visible) return
          
          const point = document.createElement('div')
          point.style.cssText = `
            position: absolute;
            width: 8px;
            height: 8px;
            background: ${sensor.color || '#3b82f6'};
            border-radius: 50%;
            box-shadow: 0 0 10px ${sensor.color || '#3b82f6'};
            left: ${30 + index * 60}px;
            top: ${50 + (index % 3) * 40}px;
            animation: pulse 2s infinite;
          `
          
          const label = document.createElement('div')
          label.style.cssText = `
            position: absolute;
            top: -25px;
            left: -20px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            white-space: nowrap;
          `
          label.textContent = `${sensor.label}: ${sensor.value}`
          
          point.appendChild(label)
          placeholder.appendChild(point)
        })
      }
      
      // Add CSS for animations
      const style = document.createElement('style')
      style.textContent = `
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.2); }
        }
      `
      document.head.appendChild(style)
      
      placeholder.appendChild(grid)
      placeholder.appendChild(info)
      mountRef.current.appendChild(placeholder)
      
      setIsLoaded(true)
    } catch (error) {
      console.error('Failed to initialize 3D scene:', error)
    }
  }, [scene3DData, scene3DConfig])

  // Animation loop
  const animate = useCallback(() => {
    if (!isAnimating) return
    
    // In real implementation, this would:
    // - Update camera controls
    // - Render the scene
    // - Update sensor point positions
    // - Animate robot movements
    
    animationRef.current = requestAnimationFrame(animate)
  }, [isAnimating])

  // Cleanup
  const cleanup = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    if (mountRef.current) {
      mountRef.current.innerHTML = ''
    }
  }, [])

  useEffect(() => {
    initScene()
    if (isAnimating) {
      animate()
    }
    
    return cleanup
  }, [initScene, animate, cleanup, isAnimating])

  // Control handlers
  const resetCamera = () => {
    // Reset camera to default position
    console.log('Reset camera')
  }

  const toggleAnimation = () => {
    setIsAnimating(prev => !prev)
  }

  const zoomIn = () => {
    setCameraDistance(prev => Math.max(2, prev - 1))
  }

  const zoomOut = () => {
    setCameraDistance(prev => Math.min(50, prev + 1))
  }

  const toggleGrid = () => {
    onConfigChange?.({
      ...scene3DConfig,
      showGrid: !scene3DConfig?.showGrid
    })
  }

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className={`pb-2 ${isCompact ? 'py-1' : ''}`}>
        <div className="flex items-center justify-between">
          <CardTitle className={`${isCompact ? 'text-sm' : 'text-base'} flex items-center gap-2`}>
            <Move3D className="h-4 w-4" />
            {title}
            {isLoaded && (
              <Badge variant="outline" className="text-xs">
                {scene3DData?.sensorPoints?.filter(p => p.visible).length || 0} sensors
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={toggleAnimation}>
              {isAnimating ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            </Button>
            <Button size="sm" variant="ghost" onClick={resetCamera}>
              <RotateCcw className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        {!isCompact && (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={zoomOut}>
              <ZoomOut className="h-3 w-3" />
            </Button>
            <div className="flex-1 px-2">
              <Slider
                value={[cameraDistance]}
                onValueChange={([value]) => setCameraDistance(value)}
                min={2}
                max={50}
                step={1}
                className="w-full"
              />
            </div>
            <Button size="sm" variant="ghost" onClick={zoomIn}>
              <ZoomIn className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="ghost" onClick={toggleGrid}>
              <Grid3X3 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 p-0 relative">
        <div 
          ref={mountRef}
          className="w-full h-full"
          style={{ minHeight: '200px' }}
        />
        
        {/* Loading overlay */}
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
              <div className="text-sm text-muted-foreground">Loading 3D Scene...</div>
            </div>
          </div>
        )}
        
        {/* Sensor overlay */}
        {scene3DData?.sensorPoints && scene3DData.sensorPoints.length > 0 && (
          <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm rounded p-2 max-w-48">
            <div className="text-xs font-medium mb-1">Active Sensors</div>
            <div className="space-y-1">
              {scene3DData.sensorPoints
                .filter(p => p.visible)
                .slice(0, 5)
                .map(sensor => (
                  <div key={sensor.id} className="flex items-center gap-2 text-xs">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: sensor.color || '#3b82f6' }}
                    />
                    <span className="flex-1 truncate">{sensor.label}</span>
                    <span className="font-mono">{sensor.value}</span>
                  </div>
                ))}
              {scene3DData.sensorPoints.filter(p => p.visible).length > 5 && (
                <div className="text-xs text-muted-foreground">
                  +{scene3DData.sensorPoints.filter(p => p.visible).length - 5} more
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export const Scene3DMod: AriesMod = {
  metadata: {
    id: 'scene-3d',
    name: 'Scene3D',
    displayName: '3D Scene Viewer',
    description: 'Display 3D models with sensor readings overlaid in 3D space',
    version: '1.0.0',
    author: 'AriesUI Team',
    category: 'visualization',
    icon: '🌐',
    defaultWidth: 500,
    defaultHeight: 400,
    minWidth: 300,
    minHeight: 250,
    tags: ['3d', 'sensors', 'robotics', 'visualization', 'threejs'],
    dependencies: ['three', '@types/three'] // Would be installed separately
  },
  component: Scene3DComponent,
  generateDummyData: (): AriesModData => ({
    value: {
      sensorPoints: [
        {
          id: 'temp1',
          position: [2, 1, 0],
          value: 23.5,
          label: 'Temperature',
          type: 'temperature',
          color: '#ef4444',
          visible: true
        },
        {
          id: 'pressure1',
          position: [-1, 2, 1],
          value: 1013.25,
          label: 'Pressure',
          type: 'pressure',
          color: '#3b82f6',
          visible: true
        },
        {
          id: 'voltage1',
          position: [0, -1, 2],
          value: 12.4,
          label: 'Voltage',
          type: 'voltage',
          color: '#10b981',
          visible: true
        }
      ],
      robotPose: {
        position: [0, 0, 0],
        rotation: [0, 0, 0]
      }
    },
    timestamp: new Date().toISOString()
  }),
  validateConfig: (config: Scene3DConfig): boolean => {
    if (config.cameraPosition && config.cameraPosition.length !== 3) return false
    if (config.rotationSpeed && (config.rotationSpeed < 0 || config.rotationSpeed > 10)) return false
    return true
  }
} 