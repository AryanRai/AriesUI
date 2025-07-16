import React, { useRef, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCommsStream } from '@/hooks/use-comms-stream'
import type { AriesModProps } from '@/types/ariesmods'

interface Vector2D {
  x: number
  y: number
}

interface Vector3D extends Vector2D {
  z: number
}

/**
 * PhysicsVectorField - Visualizes 2D vector fields for physics simulations
 * 
 * This component renders a 2D vector field visualization using HTML Canvas,
 * suitable for displaying force fields, velocity fields, or other vector quantities.
 */
const PhysicsVectorField: React.FC<AriesModProps> = ({
  title,
  data,
  config = {}
}) => {
  // Canvas reference
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  // Configuration options
  const vectorStreamId = config.vectorStreamId || ''
  const positionStreamId = config.positionStreamId || ''
  const gridSize = config.gridSize || 20
  const vectorScale = config.vectorScale || 1.0
  const arrowSize = config.arrowSize || 5
  const vectorColor = config.vectorColor || '#4169E1'
  const backgroundColor = config.backgroundColor || 'transparent'
  const showGrid = config.showGrid !== false
  const gridColor = config.gridColor || 'rgba(200, 200, 200, 0.2)'
  const showPosition = config.showPosition !== false
  const positionColor = config.positionColor || '#FF4500'
  const positionSize = config.positionSize || 8
  const xRange = config.xRange || [-10, 10]
  const yRange = config.yRange || [-10, 10]
  
  // Get stream data if streamIds are provided
  const vectorStream = vectorStreamId ? useCommsStream(vectorStreamId) : null
  const positionStream = positionStreamId ? useCommsStream(positionStreamId) : null
  
  // Use either direct data or stream data
  const vectorField = vectorStream?.value || data?.vectorField || []
  const position = positionStream?.value || data?.position || { x: 0, y: 0, z: 0 }
  
  // Animation frame ID for cleanup
  const animationFrameId = useRef<number>()
  
  // Generate a sample vector field if none is provided
  const [sampleVectorField, setSampleVectorField] = useState<Vector2D[][]>([])
  
  useEffect(() => {
    // Generate sample vector field if no real data is provided
    if (!vectorField || vectorField.length === 0) {
      const field: Vector2D[][] = []
      
      for (let i = 0; i <= gridSize; i++) {
        const row: Vector2D[] = []
        for (let j = 0; j <= gridSize; j++) {
          // Map grid coordinates to world coordinates
          const x = xRange[0] + (xRange[1] - xRange[0]) * (j / gridSize)
          const y = yRange[0] + (yRange[1] - yRange[0]) * (i / gridSize)
          
          // Sample vector field (circular pattern)
          const dx = -y / Math.sqrt(x*x + y*y + 0.1)
          const dy = x / Math.sqrt(x*x + y*y + 0.1)
          
          row.push({ x: dx, y: dy })
        }
        field.push(row)
      }
      
      setSampleVectorField(field)
    }
  }, [gridSize, xRange, yRange, vectorField])
  
  // Draw the vector field
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Set canvas dimensions
    const resizeCanvas = () => {
      const parent = canvas.parentElement
      if (parent) {
        canvas.width = parent.clientWidth
        canvas.height = parent.clientHeight
      }
    }
    
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    
    // Animation function
    const render = () => {
      const width = canvas.width
      const height = canvas.height
      
      // Clear canvas
      ctx.clearRect(0, 0, width, height)
      
      // Fill background if specified
      if (backgroundColor !== 'transparent') {
        ctx.fillStyle = backgroundColor
        ctx.fillRect(0, 0, width, height)
      }
      
      // Draw grid
      if (showGrid) {
        ctx.strokeStyle = gridColor
        ctx.lineWidth = 1
        
        // Vertical grid lines
        for (let i = 0; i <= gridSize; i++) {
          const x = (i / gridSize) * width
          ctx.beginPath()
          ctx.moveTo(x, 0)
          ctx.lineTo(x, height)
          ctx.stroke()
        }
        
        // Horizontal grid lines
        for (let i = 0; i <= gridSize; i++) {
          const y = (i / gridSize) * height
          ctx.beginPath()
          ctx.moveTo(0, y)
          ctx.lineTo(width, y)
          ctx.stroke()
        }
        
        // Draw axes
        ctx.strokeStyle = 'rgba(200, 200, 200, 0.5)'
        ctx.lineWidth = 2
        
        // X-axis
        const yZero = height * (1 - (0 - yRange[0]) / (yRange[1] - yRange[0]))
        if (yZero >= 0 && yZero <= height) {
          ctx.beginPath()
          ctx.moveTo(0, yZero)
          ctx.lineTo(width, yZero)
          ctx.stroke()
        }
        
        // Y-axis
        const xZero = width * ((0 - xRange[0]) / (xRange[1] - xRange[0]))
        if (xZero >= 0 && xZero <= width) {
          ctx.beginPath()
          ctx.moveTo(xZero, 0)
          ctx.lineTo(xZero, height)
          ctx.stroke()
        }
      }
      
      // Draw vector field
      ctx.strokeStyle = vectorColor
      ctx.fillStyle = vectorColor
      ctx.lineWidth = 2
      
      const field = vectorField?.length ? vectorField : sampleVectorField
      
      for (let i = 0; i <= gridSize; i++) {
        for (let j = 0; j <= gridSize; j++) {
          // Skip some vectors for better visualization
          if (gridSize > 10 && (i % 2 !== 0 || j % 2 !== 0)) continue
          
          // Get vector at grid point
          const vector = field[i]?.[j] || { x: 0, y: 0 }
          
          // Map grid coordinates to canvas coordinates
          const x = (j / gridSize) * width
          const y = (i / gridSize) * height
          
          // Calculate vector endpoint
          const magnitude = Math.sqrt(vector.x * vector.x + vector.y * vector.y)
          const normalizedX = vector.x / (magnitude || 1)
          const normalizedY = vector.y / (magnitude || 1)
          
          const vectorLength = Math.min(width, height) / (gridSize * 2) * vectorScale
          const dx = normalizedX * vectorLength
          const dy = normalizedY * vectorLength
          
          // Draw vector line
          ctx.beginPath()
          ctx.moveTo(x, y)
          ctx.lineTo(x + dx, y + dy)
          ctx.stroke()
          
          // Draw arrowhead
          const angle = Math.atan2(dy, dx)
          ctx.beginPath()
          ctx.moveTo(x + dx, y + dy)
          ctx.lineTo(
            x + dx - arrowSize * Math.cos(angle - Math.PI / 6),
            y + dy - arrowSize * Math.sin(angle - Math.PI / 6)
          )
          ctx.lineTo(
            x + dx - arrowSize * Math.cos(angle + Math.PI / 6),
            y + dy - arrowSize * Math.sin(angle + Math.PI / 6)
          )
          ctx.closePath()
          ctx.fill()
        }
      }
      
      // Draw position marker if enabled
      if (showPosition && position) {
        // Map position to canvas coordinates
        const pos = position as Vector3D
        const x = width * ((pos.x - xRange[0]) / (xRange[1] - xRange[0]))
        const y = height * (1 - (pos.y - yRange[0]) / (yRange[1] - yRange[0]))
        
        // Draw position marker
        ctx.fillStyle = positionColor
        ctx.beginPath()
        ctx.arc(x, y, positionSize, 0, Math.PI * 2)
        ctx.fill()
        
        // Draw position coordinates
        ctx.fillStyle = positionColor
        ctx.font = '12px Arial'
        ctx.textAlign = 'left'
        ctx.fillText(`(${pos.x.toFixed(2)}, ${pos.y.toFixed(2)})`, x + positionSize + 2, y)
      }
      
      // Continue animation
      animationFrameId.current = requestAnimationFrame(render)
    }
    
    // Start animation
    render()
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current)
      }
    }
  }, [
    vectorField, 
    sampleVectorField, 
    position, 
    gridSize, 
    vectorScale, 
    arrowSize, 
    vectorColor, 
    backgroundColor, 
    showGrid, 
    gridColor, 
    showPosition, 
    positionColor, 
    positionSize,
    xRange,
    yRange
  ])
  
  return (
    <Card className="w-full h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="w-full h-[calc(100%-40px)]" style={{ minHeight: '200px' }}>
          <canvas ref={canvasRef} className="w-full h-full" />
        </div>
      </CardContent>
    </Card>
  )
}

export default PhysicsVectorField