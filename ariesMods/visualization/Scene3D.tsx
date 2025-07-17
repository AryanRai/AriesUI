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

// Three.js imports
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

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
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const animationRef = useRef<number | null>(null)
  const sensorPointsRef = useRef<THREE.Group | null>(null)
  
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
      // Clear previous scene
      if (mountRef.current.children.length > 0) {
        mountRef.current.innerHTML = ''
      }

      // Initialize Three.js Scene
      const scene = new THREE.Scene()
      scene.background = new THREE.Color(scene3DConfig?.backgroundColor || '#1e293b')
      sceneRef.current = scene

      // Initialize Camera
      const camera = new THREE.PerspectiveCamera(
        75,
        mountRef.current.clientWidth / mountRef.current.clientHeight,
        0.1,
        1000
      )
      camera.position.set(
        scene3DConfig?.cameraPosition?.[0] || 10,
        scene3DConfig?.cameraPosition?.[1] || 10,
        scene3DConfig?.cameraPosition?.[2] || 10
      )
      cameraRef.current = camera

      // Initialize Renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true })
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight)
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
      rendererRef.current = renderer
      mountRef.current.appendChild(renderer.domElement)

      // Initialize Controls
      const controls = new OrbitControls(camera, renderer.domElement)
      controls.enableDamping = true
      controls.dampingFactor = 0.05
      controls.autoRotate = scene3DConfig?.autoRotate || false
      controls.autoRotateSpeed = scene3DConfig?.rotationSpeed || 2
      controlsRef.current = controls

      // Add Lights
      const ambientLight = new THREE.AmbientLight(0x404040, scene3DConfig?.ambientLightIntensity || 0.6)
      scene.add(ambientLight)

      const directionalLight = new THREE.DirectionalLight(0xffffff, scene3DConfig?.directionalLightIntensity || 0.8)
      directionalLight.position.set(10, 10, 5)
      directionalLight.castShadow = true
      directionalLight.shadow.mapSize.width = 2048
      directionalLight.shadow.mapSize.height = 2048
      scene.add(directionalLight)

      // Add Grid
      if (scene3DConfig?.showGrid !== false) {
        const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x444444)
        scene.add(gridHelper)
      }

      // Add Axes
      if (scene3DConfig?.showAxes) {
        const axesHelper = new THREE.AxesHelper(5)
        scene.add(axesHelper)
      }

      // Create sensor points group
      const sensorPointsGroup = new THREE.Group()
      sensorPointsRef.current = sensorPointsGroup
      scene.add(sensorPointsGroup)

      // Add sensor points
      if (scene3DData?.sensorPoints) {
        scene3DData.sensorPoints.forEach((sensor) => {
          if (!sensor.visible) return

          // Create sensor point geometry
          const geometry = new THREE.SphereGeometry(scene3DConfig?.sensorPointSize || 0.2, 16, 16)
          const material = new THREE.MeshPhongMaterial({ 
            color: sensor.color || '#3b82f6',
            emissive: sensor.color || '#3b82f6',
            emissiveIntensity: 0.2
          })
          const sphere = new THREE.Mesh(geometry, material)
          sphere.position.set(sensor.position[0], sensor.position[1], sensor.position[2])
          sphere.castShadow = true
          sphere.receiveShadow = true
          sphere.userData = { sensor }
          sensorPointsGroup.add(sphere)

          // Add label (sprite)
          if (scene3DConfig?.showSensorLabels !== false) {
            const canvas = document.createElement('canvas')
            const context = canvas.getContext('2d')!
            canvas.width = 128
            canvas.height = 32
            
            context.fillStyle = 'rgba(0, 0, 0, 0.8)'
            context.fillRect(0, 0, 128, 32)
            
            context.fillStyle = 'white'
            context.font = '12px Arial'
            context.textAlign = 'center'
            context.fillText(`${sensor.label}: ${sensor.value}`, 64, 20)
            
            const texture = new THREE.CanvasTexture(canvas)
            const spriteMaterial = new THREE.SpriteMaterial({ map: texture })
            const sprite = new THREE.Sprite(spriteMaterial)
            sprite.position.set(sensor.position[0], sensor.position[1] + 0.5, sensor.position[2])
            sprite.scale.set(2, 0.5, 1)
            sensorPointsGroup.add(sprite)
          }
        })
      }

      // Add point clouds
      if (scene3DData?.pointClouds) {
        scene3DData.pointClouds.forEach((pointCloud) => {
          const geometry = new THREE.BufferGeometry()
          geometry.setAttribute('position', new THREE.BufferAttribute(pointCloud.points, 3))
          
          if (pointCloud.colors) {
            geometry.setAttribute('color', new THREE.BufferAttribute(pointCloud.colors, 3))
          }
          
          const material = new THREE.PointsMaterial({
            size: pointCloud.size || 0.1,
            vertexColors: pointCloud.colors ? true : false,
            color: pointCloud.colors ? undefined : 0x888888
          })
          
          const points = new THREE.Points(geometry, material)
          scene.add(points)
        })
      }

      // Add robot pose indicator
      if (scene3DData?.robotPose) {
        const robotGeometry = new THREE.ConeGeometry(0.3, 1, 8)
        const robotMaterial = new THREE.MeshPhongMaterial({ color: '#ff6b6b' })
        const robotMesh = new THREE.Mesh(robotGeometry, robotMaterial)
        robotMesh.position.set(
          scene3DData.robotPose.position[0],
          scene3DData.robotPose.position[1] + 0.5,
          scene3DData.robotPose.position[2]
        )
        robotMesh.rotation.set(
          scene3DData.robotPose.rotation[0],
          scene3DData.robotPose.rotation[1],
          scene3DData.robotPose.rotation[2]
        )
        scene.add(robotMesh)
      }

      setIsLoaded(true)
    } catch (error) {
      console.error('Failed to initialize 3D scene:', error)
    }
  }, [scene3DData, scene3DConfig])

  // Animation loop
  const animate = useCallback(() => {
    if (!isAnimating || !sceneRef.current || !cameraRef.current || !rendererRef.current) return
    
    // Update controls
    if (controlsRef.current) {
      controlsRef.current.update()
    }
    
    // Animate sensor points (pulsing effect)
    if (sensorPointsRef.current && scene3DConfig?.animate !== false) {
      const time = Date.now() * 0.001
      sensorPointsRef.current.children.forEach((child, index) => {
        if (child instanceof THREE.Mesh) {
          const scale = 1 + Math.sin(time * 2 + index) * 0.2
          child.scale.set(scale, scale, scale)
        }
      })
    }
    
    // Render the scene
    rendererRef.current.render(sceneRef.current, cameraRef.current)
    
    animationRef.current = requestAnimationFrame(animate)
  }, [isAnimating, scene3DConfig])

  // Cleanup
  const cleanup = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    
    // Dispose of Three.js resources
    if (controlsRef.current) {
      controlsRef.current.dispose()
    }
    
    if (rendererRef.current) {
      rendererRef.current.dispose()
    }
    
    if (sceneRef.current) {
      // Dispose of all geometries and materials
      sceneRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry) child.geometry.dispose()
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((material) => material.dispose())
            } else {
              child.material.dispose()
            }
          }
        }
      })
      sceneRef.current.clear()
    }
    
    if (mountRef.current) {
      mountRef.current.innerHTML = ''
    }
    
    // Clear refs
    sceneRef.current = null
    rendererRef.current = null
    cameraRef.current = null
    controlsRef.current = null
    sensorPointsRef.current = null
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
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(10, 10, 10)
      controlsRef.current.target.set(0, 0, 0)
      controlsRef.current.update()
    }
  }

  const toggleAnimation = () => {
    setIsAnimating(prev => !prev)
  }

  const zoomIn = () => {
    if (cameraRef.current) {
      const newDistance = Math.max(2, cameraDistance - 1)
      setCameraDistance(newDistance)
      const direction = cameraRef.current.position.clone().normalize()
      cameraRef.current.position.copy(direction.multiplyScalar(newDistance))
    }
  }

  const zoomOut = () => {
    if (cameraRef.current) {
      const newDistance = Math.min(50, cameraDistance + 1)
      setCameraDistance(newDistance)
      const direction = cameraRef.current.position.clone().normalize()
      cameraRef.current.position.copy(direction.multiplyScalar(newDistance))
    }
  }

  const toggleGrid = () => {
    onConfigChange?.({
      ...scene3DConfig,
      showGrid: !scene3DConfig?.showGrid
    })
  }

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (cameraRef.current && rendererRef.current && mountRef.current) {
        const width = mountRef.current.clientWidth
        const height = mountRef.current.clientHeight
        
        cameraRef.current.aspect = width / height
        cameraRef.current.updateProjectionMatrix()
        rendererRef.current.setSize(width, height)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

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
    dependencies: ['three', '@types/three'] // Already installed
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