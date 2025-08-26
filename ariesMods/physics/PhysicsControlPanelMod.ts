import type { AriesMod, AriesModData } from '@/types/ariesmods'
import PhysicsControlPanel from './PhysicsControlPanel'

export const PhysicsControlPanelMod: AriesMod = {
  component: PhysicsControlPanel,
  metadata: {
    id: 'physics-control-panel',
    name: 'physics-control-panel',
    displayName: 'Physics Control Panel',
    description: 'Control panel for physics simulations',
    version: '1.0.0',
    author: 'StarSim',
    category: 'physics',
    defaultWidth: 350,
    defaultHeight: 400,
    minWidth: 300,
    minHeight: 350,
    tags: ['physics', 'control', 'simulation', 'starsim']
  },
  
  generateDummyData: (): AriesModData => {
    return {
      simulationStatus: 'idle',
      simulationTime: 0,
      timestamp: new Date().toISOString()
    }
  }
}