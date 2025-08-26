import type { AriesMod, AriesModData } from '@/types/ariesmods'
import StockPriceMonitor from './StockPriceMonitor'

export const StockPriceMonitorMod: AriesMod = {
  component: StockPriceMonitor,
  metadata: {
    id: 'stock-price-monitor',
    name: 'stock-price-monitor',
    displayName: 'Stock Price Monitor',
    description: 'Displays real-time stock price, volume, and trading signals',
    version: '1.0.0',
    author: 'Comms Trading',
    category: 'trading',
    defaultWidth: 280,
    defaultHeight: 350,
    minWidth: 240,
    minHeight: 300,
    tags: ['trading', 'stocks', 'price', 'signals', 'alpaca']
  },
  
  generateDummyData: (): AriesModData => {
    const symbols = ['AAPL', 'MSFT', 'GOOGL', 'NVDA', 'TSLA', 'SPY', 'QQQ']
    const basePrice = 150 + Math.random() * 300
    const volume = Math.floor(Math.random() * 50000000) + 10000000
    const signals = ['buy', 'sell', 'hold']
    
    const data: AriesModData = {
      timestamp: new Date().toISOString()
    }
    
    // Generate data for multiple symbols
    symbols.forEach(symbol => {
      data[`${symbol}_price`] = basePrice + (Math.random() - 0.5) * 20
      data[`${symbol}_volume`] = volume + Math.floor(Math.random() * 20000000)
      data[`${symbol}_signal`] = signals[Math.floor(Math.random() * signals.length)]
      data[`${symbol}_signal_strength`] = Math.random()
    })
    
    return data
  }
}