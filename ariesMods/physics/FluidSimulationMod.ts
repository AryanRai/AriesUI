import type { AriesMod, AriesModData } from '@/types/ariesmods'
import FluidSimulation from './FluidSimulation'

export const FluidSimulationMod: AriesMod = {
  component: FluidSimulation,
  metadata: {
    id: 'fluid-simulation',
    name: 'fluid-simulation',
    displayName: 'Fluid Simulation',
    description: 'Interactive fluid dynamics simulation with particle systems and flow visualization',
    version: '1.0.0',
    author: 'StarSim',
    category: 'physics',
    defaultWidth: 12,
    defaultHeight: 12,
    tags: ['physics', 'simulation', 'fluid', 'dynamics', 'particles', 'flow', 'starsim']
  },
  
  generateDummyData: (): AriesModData => {
    return {
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
    }
  }
}