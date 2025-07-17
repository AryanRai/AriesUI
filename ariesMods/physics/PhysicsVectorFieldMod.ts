import type { AriesMod, AriesModData } from '@/types/ariesmods'
import PhysicsVectorField from './PhysicsVectorField'

export const PhysicsVectorFieldMod: AriesMod = {
  component: PhysicsVectorField,
  metadata: {
    id: 'physics-vector-field',
    name: 'physics-vector-field',
    displayName: 'Physics Vector Field',
    description: 'Visualizes 2D vector fields for physics simulations',
    version: '1.0.0',
    author: 'StarSim',
    category: 'physics',
    defaultWidth: 500,
    defaultHeight: 400,
    minWidth: 400,
    minHeight: 300,
    tags: ['physics', 'vector', 'field', 'starsim', '2d']
  },
  
  generateDummyData: (): AriesModData => {
    // Generate a sample vector field (circular pattern)
    const gridSize = 20
    const vectorField: Array<Array<{x: number, y: number}>> = []
    
    for (let i = 0; i <= gridSize; i++) {
      const row: Array<{x: number, y: number}> = []
      for (let j = 0; j <= gridSize; j++) {
        // Map grid coordinates to world coordinates
        const x = -10 + 20 * (j / gridSize)
        const y = -10 + 20 * (i / gridSize)
        
        // Circular vector field
        const dx = -y / Math.sqrt(x*x + y*y + 0.1)
        const dy = x / Math.sqrt(x*x + y*y + 0.1)
        
        row.push({ x: dx, y: dy })
      }
      vectorField.push(row)
    }
    
    // Generate a sample position
    const t = Date.now() / 1000
    const position = {
      x: 5 * Math.cos(t * 0.5),
      y: 5 * Math.sin(t * 0.5),
      z: 0
    }
    
    return {
      vectorField,
      position,
      timestamp: new Date().toISOString()
    }
  }
}