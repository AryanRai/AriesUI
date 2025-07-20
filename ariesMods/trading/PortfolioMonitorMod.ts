import type { AriesMod, AriesModData } from '@/types/ariesmods'
import PortfolioMonitor from './PortfolioMonitor'

export const PortfolioMonitorMod: AriesMod = {
  component: PortfolioMonitor,
  metadata: {
    id: 'portfolio-monitor',
    name: 'portfolio-monitor',
    displayName: 'Portfolio Monitor',
    description: 'Displays portfolio value, buying power, cash, and risk metrics',
    version: '1.0.0',
    author: 'Comms Trading',
    category: 'trading',
    defaultWidth: 320,
    defaultHeight: 400,
    minWidth: 280,
    minHeight: 350,
    tags: ['trading', 'portfolio', 'finance', 'risk', 'alpaca']
  },
  
  generateDummyData: (): AriesModData => {
    const baseValue = 100000
    const variation = 0.05
    const currentValue = baseValue * (1 + (Math.random() - 0.5) * variation)
    
    return {
      portfolio_value: currentValue,
      buying_power: currentValue * 0.8,
      cash: currentValue * 0.3,
      portfolio_heat: Math.random() * 0.8,
      risk_alert: ['LOW_HEAT', 'MEDIUM_HEAT', 'HIGH_HEAT'][Math.floor(Math.random() * 3)],
      timestamp: new Date().toISOString()
    }
  }
}