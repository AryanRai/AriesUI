import type { AriesMod, AriesModData } from '@/types/ariesmods'
import PhysicsChart from './PhysicsChart'

export const PhysicsChartMod: AriesMod = {
  component: PhysicsChart,
  metadata: {
    id: 'physics-chart',
    name: 'physics-chart',
    displayName: 'Physics Chart',
    description: 'Real-time chart for physics simulation data',
    version: '1.0.0',
    author: 'StarSim',
    category: 'physics',
    defaultWidth: 8,
    defaultHeight: 6,
    tags: ['physics', 'chart', 'graph', 'starsim']
  },
  
  generateDummyData: (): AriesModData => {
    const now = Date.now() / 1000
    const value = Math.sin(now) * 5
    
    return {
      value,
      unit: 'm/s',
      timestamp: new Date().toISOString()
    }
  }
}