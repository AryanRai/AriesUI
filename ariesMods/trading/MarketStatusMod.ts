import type { AriesMod, AriesModData } from '@/types/ariesmods'
import MarketStatus from './MarketStatus'

export const MarketStatusMod: AriesMod = {
  component: MarketStatus,
  metadata: {
    id: 'market-status',
    name: 'market-status',
    displayName: 'Market Status',
    description: 'Displays current market status, hours, and key indices',
    version: '1.0.0',
    author: 'Comms Trading',
    category: 'trading',
    defaultWidth: 280,
    defaultHeight: 350,
    minWidth: 240,
    minHeight: 300,
    tags: ['trading', 'market', 'status', 'indices', 'alpaca']
  },
  
  generateDummyData: (): AriesModData => {
    const now = new Date()
    const hour = now.getHours()
    const isMarketHours = hour >= 9 && hour < 16
    
    return {
      market_open: isMarketHours,
      market_hours: isMarketHours ? 'OPEN' : 'CLOSED',
      SPY_price: 450 + (Math.random() - 0.5) * 20,
      QQQ_price: 380 + (Math.random() - 0.5) * 15,
      timestamp: new Date().toISOString()
    }
  }
}