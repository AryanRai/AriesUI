import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock as ClockIcon, Calendar, Timer } from 'lucide-react'
import type { AriesMod, AriesModProps, AriesModData } from '@/types/ariesmods'

const ClockComponent: React.FC<AriesModProps> = ({
  id,
  title,
  width,
  height,
  data,
  config,
  onConfigChange
}) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date())
  const [uptime, setUptime] = useState<number>(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
      setUptime(prev => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const formatTime = (date: Date) => {
    const format = config.timeFormat || '24h'
    return format === '24h' 
      ? date.toLocaleTimeString('en-US', { hour12: false })
      : date.toLocaleTimeString('en-US', { hour12: true })
  }

  const formatDate = (date: Date) => {
    const format = config.dateFormat || 'short'
    switch (format) {
      case 'long':
        return date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      case 'medium':
        return date.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        })
      default:
        return date.toLocaleDateString('en-US')
    }
  }

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  const getTimeOfDay = () => {
    const hour = currentTime.getHours()
    if (hour < 6) return 'Night'
    if (hour < 12) return 'Morning'
    if (hour < 18) return 'Afternoon'
    return 'Evening'
  }

  const getTimeOfDayColor = () => {
    const period = getTimeOfDay()
    switch (period) {
      case 'Morning': return 'text-yellow-500'
      case 'Afternoon': return 'text-orange-500'
      case 'Evening': return 'text-purple-500'
      case 'Night': return 'text-blue-500'
      default: return 'text-gray-500'
    }
  }

  const showSeconds = config.showSeconds !== false
  const showDate = config.showDate !== false
  const showUptime = config.showUptime === true
  const timezone = config.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone

  return (
    <Card className="w-full h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <ClockIcon className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-center space-y-2">
          <div className="text-2xl font-mono font-bold">
            {showSeconds 
              ? formatTime(currentTime)
              : formatTime(currentTime).slice(0, -3)
            }
          </div>
          
          {showDate && (
            <div className="text-sm text-muted-foreground">
              {formatDate(currentTime)}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-center">
            <Badge variant="outline" className={getTimeOfDayColor()}>
              <Calendar className="h-3 w-3 mr-1" />
              {getTimeOfDay()}
            </Badge>
          </div>

          {showUptime && (
            <div className="flex justify-center">
              <Badge variant="secondary">
                <Timer className="h-3 w-3 mr-1" />
                {formatUptime(uptime)}
              </Badge>
            </div>
          )}

          <div className="text-xs text-muted-foreground space-y-1">
            <div>Timezone: {timezone}</div>
            <div>Format: {config.timeFormat || '24h'}</div>
            {config.location && (
              <div>Location: {config.location}</div>
            )}
            <div>Updated: {new Date(data.timestamp).toLocaleTimeString()}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export const ClockMod: AriesMod = {
  metadata: {
    id: 'clock',
    name: 'Clock',
    displayName: 'Digital Clock',
    description: 'Digital clock with date, timezone, and uptime display',
    version: '1.0.0',
    author: 'AriesUI Team',
    category: 'utility',
    icon: '🕐',
    defaultWidth: 200,
    defaultHeight: 180,
    minWidth: 150,
    minHeight: 120,
    tags: ['clock', 'time', 'date', 'utility']
  },
  component: ClockComponent,
  generateDummyData: (): AriesModData => ({
    value: Date.now(),
    timestamp: new Date().toISOString(),
    metadata: {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      locale: navigator.language,
      systemTime: true
    }
  }),
  validateConfig: (config: Record<string, any>): boolean => {
    if (config.timeFormat && !['12h', '24h'].includes(config.timeFormat)) {
      return false
    }
    if (config.dateFormat && !['short', 'medium', 'long'].includes(config.dateFormat)) {
      return false
    }
    return true
  }
} 