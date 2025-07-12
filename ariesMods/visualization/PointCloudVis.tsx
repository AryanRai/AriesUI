import React, { useRef, useMemo, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Points, Point } from '@react-three/drei'
import * as THREE from 'three'
import type { AriesMod, AriesModProps } from '@/types/ariesmods'

interface PointCloudVisData {
  points: [number, number, number][]
  colors?: [number, number, number][]
}

const PointCloud: React.FC<{ data: PointCloudVisData }> = ({ data }) => {
  const pointsRef = useRef<THREE.Points>(null)

  const [positions, colors] = useMemo(() => {
    const numPoints = data.points?.length || 0
    const pos = new Float32Array(numPoints * 3)
    const col = new Float32Array(numPoints * 3)

    for (let i = 0; i < numPoints; i++) {
      const [x, y, z] = data.points[i]
      pos[i * 3] = x
      pos[i * 3 + 1] = y
      pos[i * 3 + 2] = z

      if (data.colors?.[i]) {
        const [r, g, b] = data.colors[i]
        col[i * 3] = r
        col[i * 3 + 1] = g
        col[i * 3 + 2] = b
      } else {
        col[i * 3] = 1
        col[i * 3 + 1] = 1
        col[i * 3 + 2] = 1
      }
    }
    return [pos, col]
  }, [data])

  useFrame((state) => {
    const { clock } = state
    if (pointsRef.current) {
      // Example animation, can be removed
      // pointsRef.current.rotation.y = clock.getElapsedTime() * 0.1
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry attach="geometry">
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial attach="material" size={0.05} vertexColors />
    </points>
  )
}

export const PointCloudVis: React.FC<AriesModProps> = ({ data, width, height, onConfigChange, onDataRequest }) => {
  const visData = data as PointCloudVisData | null
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState({ width: width || 400, height: height || 300 })

  // Update container size when widget is resized
  useEffect(() => {
    if (width && height) {
      setContainerSize({ width, height })
    }
  }, [width, height])

  // Handle container resize with ResizeObserver for better responsiveness
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: observedWidth, height: observedHeight } = entry.contentRect
        setContainerSize({ 
          width: observedWidth || width || 400, 
          height: observedHeight || height || 300 
        })
      }
    })

    resizeObserver.observe(container)
    
    return () => {
      resizeObserver.disconnect()
    }
  }, [width, height])

  if (!visData || !visData.points || visData.points.length === 0) {
    return (
      <div 
        ref={containerRef}
        className="w-full h-full flex items-center justify-center bg-gray-900 text-white"
        style={{ width: containerSize.width, height: containerSize.height }}
      >
        No point data available
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      className="w-full h-full"
      style={{ width: containerSize.width, height: containerSize.height }}
    >
    <Canvas
      camera={{ position: [0, 0, 5], fov: 50 }}
      className="w-full h-full bg-gray-900"
        style={{ width: containerSize.width, height: containerSize.height }}
        resize={{ scroll: false, debounce: { scroll: 50, resize: 0 } }}
    >
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <PointCloud data={visData} />
      <OrbitControls />
    </Canvas>
    </div>
  )
}

export const PointCloudVisMod: AriesMod = {
  component: PointCloudVis,
  metadata: {
    id: 'point-cloud-vis',
    name: 'PointCloudVisualizer',
    displayName: 'Point Cloud Visualizer',
    description: 'Renders a 3D point cloud from coordinate data.',
    version: '1.0.0',
    author: 'AriesUI',
    category: 'visualization',
    tags: ['3d', 'point-cloud', 'visualization', 'space'],
    defaultWidth: 400,
    defaultHeight: 300,
    icon: '☁️',
  },
  generateDummyData: () => {
    const points: [number, number, number][] = []
    const colors: [number, number, number][] = []
    const numPoints = 2000
    for (let i = 0; i < numPoints; i++) {
      const x = (Math.random() - 0.5) * 5
      const y = (Math.random() - 0.5) * 5
      const z = (Math.random() - 0.5) * 5
      points.push([x, y, z])
      colors.push([x / 5 + 0.5, y / 5 + 0.5, z / 5 + 0.5])
    }
    return { points, colors }
  },
  validateConfig: (config) => {
    // No config to validate yet
    return true
  },
} 