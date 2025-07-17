import type { AriesMod, AriesModData } from '@/types/ariesmods'
import { Activity } from 'lucide-react'
import SpringDamper from './SpringDamper'

export const SpringDamperMod: AriesMod = {
  component: SpringDamper,
  metadata: {
    id: 'spring-damper',
    name: 'SpringDamper',
    displayName: 'Spring-Damper System',
    description: 'Interactive spring-mass-damper physics simulation with real-time visualization',
    version: '1.0.0',
    author: 'StarSim',
    category: 'physics',
    icon: Activity,
    defaultWidth: 400,
    defaultHeight: 350,
    tags: ['physics', 'simulation', 'spring', 'damper', 'oscillator', 'dynamics', 'starsim']
  },
  
  generateDummyData: (): AriesModData => {
    return {
      value: 0.5,
      timestamp: new Date().toISOString(),
      currentState: {
        position: 0.5,
        velocity: -2.1,
        acceleration: -5.0,
        time: 2.5,
        energy: {
          kinetic: 2.2,
          potential: 1.25,
          total: 3.45,
          dissipated: 0.55
        }
      },
      trajectory: [],
      phaseSpace: [],
      energyHistory: [],
      isRunning: false,
      systemType: 'underdamped' as const,
      resonanceFrequency: 1.59,
      dampingRatio: 0.158,
      naturalFrequency: 1.59,
      quality: 3.16,
      metadata: { source: 'demo' }
    }
  }
}