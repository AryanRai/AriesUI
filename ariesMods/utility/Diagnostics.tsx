import React, { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Activity,
  Wifi,
  WifiOff,
  RefreshCw,
  Filter
} from 'lucide-react'
import type { AriesMod, AriesModProps, AriesModData } from '@/types/ariesmods'

interface DiagnosticMessage {
  id: string
  timestamp: string
  level: 'info' | 'warning' | 'error' | 'critical'
  source: string
  message: string
  details?: string
  count?: number
}

interface SystemHealth {
  overall: 'healthy' | 'warning' | 'critical' | 'offline'
  cpu_usage: number
  memory_usage: number
  disk_usage: number
  network_status: 'connected' | 'disconnected' | 'poor'
  uptime: number
  active_modules: number
  total_modules: number
}

interface DiagnosticsConfig {
  maxMessages?: number
  autoRefresh?: boolean
  refreshInterval?: number
  levelFilter?: ('info' | 'warning' | 'error' | 'critical')[]
  showSystemHealth?: boolean
  showModuleStatus?: boolean
  compactMode?: boolean
}

const DiagnosticsComponent: React.FC<AriesModProps> = ({
  id,
  title,
  width,
  height,
  data,
  config,
  onConfigChange,
  onDataRequest
}) => {
  const diagnosticsConfig = config as DiagnosticsConfig
  const [levelFilter, setLevelFilter] = useState<string[]>(
    diagnosticsConfig?.levelFilter || ['warning', 'error', 'critical']
  )
  
  const isCompact = width < 350 || height < 250
  const showSystemHealth = diagnosticsConfig?.showSystemHealth ?? true
  const showModuleStatus = diagnosticsConfig?.showModuleStatus ?? true

  // Parse incoming data
  const { messages, systemHealth } = useMemo(() => {
    if (!data?.value) {
      // Generate dummy diagnostic data
      const dummyMessages: DiagnosticMessage[] = [
        {
          id: '1',
          timestamp: new Date(Date.now() - 30000).toISOString(),
          level: 'error',
          source: 'Hardware Module 1',
          message: 'Temperature sensor disconnected',
          details: 'DS18B20 on pin 4 not responding',
          count: 3
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 60000).toISOString(),
          level: 'warning',
          source: 'Stream Handler',
          message: 'High latency detected',
          details: 'WebSocket response time: 450ms',
          count: 1
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 120000).toISOString(),
          level: 'info',
          source: 'Engine Core',
          message: 'Module loaded successfully',
          details: 'hw_module_2.py initialized',
          count: 1
        },
        {
          id: '4',
          timestamp: new Date(Date.now() - 180000).toISOString(),
          level: 'critical',
          source: 'Safety System',
          message: 'Emergency stop triggered',
          details: 'Manual safety override activated',
          count: 1
        }
      ]

      const dummyHealth: SystemHealth = {
        overall: 'warning',
        cpu_usage: 34,
        memory_usage: 67,
        disk_usage: 45,
        network_status: 'connected',
        uptime: 7200, // 2 hours
        active_modules: 3,
        total_modules: 4
      }

      return { messages: dummyMessages, systemHealth: dummyHealth }
    }

    return {
      messages: (data.value as any)?.messages || [],
      systemHealth: (data.value as any)?.systemHealth || null
    }
  }, [data])

  // Filter messages by level
  const filteredMessages = useMemo(() => {
    return messages.filter(msg => levelFilter.includes(msg.level))
      .slice(0, diagnosticsConfig?.maxMessages || 50)
  }, [messages, levelFilter, diagnosticsConfig])

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'critical': return <XCircle className="h-4 w-4 text-red-500" />
      case 'error': return <AlertCircle className="h-4 w-4 text-red-400" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'info': return <CheckCircle className="h-4 w-4 text-blue-500" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  const getLevelBadge = (level: string) => {
    const variants = {
      critical: 'destructive' as const,
      error: 'destructive' as const,
      warning: 'secondary' as const,
      info: 'default' as const
    }
    return variants[level as keyof typeof variants] || 'default'
  }

  const getHealthColor = (level: string) => {
    switch (level) {
      case 'healthy': return 'text-green-500'
      case 'warning': return 'text-yellow-500'
      case 'critical': return 'text-red-500'
      case 'offline': return 'text-gray-500'
      default: return 'text-gray-500'
    }
  }

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return date.toLocaleDateString()
  }

  const toggleLevelFilter = (level: string) => {
    setLevelFilter(prev => 
      prev.includes(level) 
        ? prev.filter(l => l !== level)
        : [...prev, level]
    )
  }

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className={`pb-2 ${isCompact ? 'py-2' : ''}`}>
        <div className="flex items-center justify-between">
          <CardTitle className={`${isCompact ? 'text-sm' : 'text-base'} flex items-center gap-2`}>
            <Activity className="h-4 w-4" />
            {title}
            {systemHealth && (
              <Badge 
                variant={systemHealth.overall === 'healthy' ? 'default' : 'destructive'}
                className="text-xs"
              >
                {systemHealth.overall}
              </Badge>
            )}
          </CardTitle>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => onDataRequest?.(id, { action: 'refresh' })}
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
        
        {/* Level Filter */}
        <div className="flex gap-1 flex-wrap">
          {['critical', 'error', 'warning', 'info'].map(level => (
            <Button
              key={level}
              size="sm"
              variant={levelFilter.includes(level) ? 'default' : 'outline'}
              onClick={() => toggleLevelFilter(level)}
              className={`text-xs h-6 ${isCompact ? 'px-2' : 'px-3'}`}
            >
              {getLevelIcon(level)}
              {!isCompact && <span className="ml-1 capitalize">{level}</span>}
            </Button>
          ))}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden p-0">
        <div className="h-full flex flex-col">
          {/* System Health Section */}
          {showSystemHealth && systemHealth && (
            <div className={`border-b p-3 ${isCompact ? 'p-2' : ''}`}>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span>CPU</span>
                    <span>{systemHealth.cpu_usage}%</span>
                  </div>
                  <Progress value={systemHealth.cpu_usage} className="h-1" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span>Memory</span>
                    <span>{systemHealth.memory_usage}%</span>
                  </div>
                  <Progress value={systemHealth.memory_usage} className="h-1" />
                </div>
                <div className="flex items-center gap-2">
                  {systemHealth.network_status === 'connected' ? (
                    <Wifi className="h-3 w-3 text-green-500" />
                  ) : (
                    <WifiOff className="h-3 w-3 text-red-500" />
                  )}
                  <span>Network</span>
                </div>
                <div className="text-right">
                  <span>Uptime: {formatUptime(systemHealth.uptime)}</span>
                </div>
              </div>
              
              {showModuleStatus && (
                <div className="mt-2 pt-2 border-t">
                  <div className="flex items-center justify-between text-xs">
                    <span>Modules</span>
                    <span>{systemHealth.active_modules}/{systemHealth.total_modules} active</span>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Messages List */}
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-2">
              {filteredMessages.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground py-4">
                  No diagnostic messages
                </div>
              ) : (
                filteredMessages.map((message) => (
                  <div 
                    key={message.id}
                    className="flex gap-2 p-2 rounded border bg-card hover:bg-accent/50 transition-colors"
                  >
                    {getLevelIcon(message.level)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge 
                          variant={getLevelBadge(message.level)}
                          className="text-xs"
                        >
                          {message.level}
                        </Badge>
                        <span className="text-xs text-muted-foreground truncate">
                          {message.source}
                        </span>
                        {message.count && message.count > 1 && (
                          <Badge variant="outline" className="text-xs">
                            {message.count}x
                          </Badge>
                        )}
                      </div>
                      <div className={`font-medium ${isCompact ? 'text-xs' : 'text-sm'}`}>
                        {message.message}
                      </div>
                      {message.details && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {message.details}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatTimestamp(message.timestamp)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  )
}

export const DiagnosticsMod: AriesMod = {
  metadata: {
    id: 'diagnostics',
    name: 'Diagnostics',
    displayName: 'System Diagnostics',
    description: 'Monitor system health and view diagnostic messages from all modules',
    version: '1.0.0',
    author: 'AriesUI Team',
    category: 'utility',
    icon: '🔍',
    defaultWidth: 400,
    defaultHeight: 350,
    minWidth: 300,
    minHeight: 200,
    tags: ['diagnostics', 'monitoring', 'health', 'debugging']
  },
  component: DiagnosticsComponent,
  generateDummyData: (): AriesModData => ({
    value: {
      messages: [
        {
          id: '1',
          timestamp: new Date(Date.now() - 30000).toISOString(),
          level: 'error',
          source: 'Hardware Module 1',
          message: 'Sensor communication lost',
          details: 'Temperature sensor on channel 3 not responding',
          count: 1
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 60000).toISOString(),
          level: 'warning',
          source: 'Stream Handler',
          message: 'High latency detected',
          details: 'WebSocket response time: 320ms (threshold: 200ms)',
          count: 1
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 120000).toISOString(),
          level: 'info',
          source: 'Engine Core',
          message: 'Module initialization complete',
          details: 'All 4 hardware modules loaded successfully',
          count: 1
        }
      ],
      systemHealth: {
        overall: 'warning',
        cpu_usage: 45,
        memory_usage: 72,
        disk_usage: 34,
        network_status: 'connected',
        uptime: 8640, // 2.4 hours
        active_modules: 3,
        total_modules: 4
      }
    },
    timestamp: new Date().toISOString()
  }),
  validateConfig: (config: DiagnosticsConfig): boolean => {
    if (config.maxMessages && (config.maxMessages < 1 || config.maxMessages > 1000)) return false
    if (config.refreshInterval && config.refreshInterval < 100) return false
    return true
  }
} 