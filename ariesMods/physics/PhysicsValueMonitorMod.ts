import type { AriesMod, AriesModData } from '@/types/ariesmods'
import PhysicsValueMonitor from './PhysicsValueMonitor'

export const PhysicsValueMonitorMod: AriesMod = {
  component: PhysicsValueMonitor,
  metadata: {
    id: 'physics-value-monitor',
    name: 'physics-value-monitor',
    displayName: 'Physics Value Monitor',
    description: 'Displays a physics value with unit and trend indicator',
    version: '1.0.0',
    author: 'StarSim',
    category: 'physics',
    defaultWidth: 250,
    defaultHeight: 200,
    minWidth: 200,
    minHeight: 150,
    tags: ['physics', 'monitor', 'value', 'starsim']
  },
  
  generateDummyData: (): AriesModData => {
    return {
      value: Math.sin(Date.now() / 1000) * 5,
      unit: 'm/s',
      timestamp: new Date().toISOString()
    }
  }
}