import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  MessageSquare, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  Play, 
  Pause, 
  Settings, 
  Eye,
  Terminal,
  Copy,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react'
import type { AriesModProps, AriesMod, AriesModData } from '@/types/ariesmods'

export interface RawMessagesConfig {
  title: string
  maxMessages: number
  autoScroll: boolean
  showTimestamps: boolean
  showSource: boolean
  showLevel: boolean
  filterLevel: 'all' | 'debug' | 'info' | 'warning' | 'error'
  colorizeMessages: boolean
  fontSize: 'small' | 'medium' | 'large'
  wordWrap: boolean
  lineNumbers: boolean
  searchHighlight: boolean
  bufferSize: number
  updateRate: number
  monitoredSources: string[]
}

export interface RawMessage {
  id: string
  timestamp: number
  source: string
  level: 'debug' | 'info' | 'warning' | 'error'
  message: string
  raw: string
  metadata?: Record<string, any>
  size: number
}

export interface RawMessagesData extends AriesModData {
  messages: RawMessage[]
  isMonitoring: boolean
  totalMessages: number
  filteredMessages: number
  messageRate: number
  sources: string[]
  levels: Record<string, number>
  bufferUsage: number
  lastMessageTime: number
}

const RawMessages: React.FC<AriesModProps> = ({
  id,
  title,
  width = 400,
  height = 300,
  data,
  config,
  onConfigChange,
  onDataRequest
}) => {
  const messagesConfig = config as RawMessagesConfig
  const messagesData = data as RawMessagesData

  const [isExpanded, setIsExpanded] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null)
  const [copySuccess, setCopySuccess] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Dummy data for demo purposes
  const getDummyData = useCallback((): RawMessagesData => {
    const sampleMessages: RawMessage[] = [
      {
        id: 'msg_001',
        timestamp: Date.now() - 10000,
        source: 'robot_base',
        level: 'info',
        message: 'Motor controller initialized successfully',
        raw: '{"type":"status","module":"motor","status":"initialized","timestamp":1234567890}',
        size: 87
      },
      {
        id: 'msg_002',
        timestamp: Date.now() - 8000,
        source: 'sensor_hub',
        level: 'debug',
        message: 'Temperature sensor reading: 23.5°C',
        raw: '{"sensor":"temp","value":23.5,"unit":"celsius","quality":"good"}',
        size: 64
      },
      {
        id: 'msg_003',
        timestamp: Date.now() - 6000,
        source: 'navigation',
        level: 'warning',
        message: 'GPS signal weak, accuracy reduced',
        raw: '{"gps":{"status":"weak","satellites":4,"hdop":2.5}}',
        size: 54
      },
      {
        id: 'msg_004',
        timestamp: Date.now() - 4000,
        source: 'camera',
        level: 'error',
        message: 'Failed to capture frame: camera disconnected',
        raw: '{"camera":{"id":"cam01","error":"disconnected","timestamp":1234567890}}',
        size: 72
      },
      {
        id: 'msg_005',
        timestamp: Date.now() - 2000,
        source: 'control',
        level: 'info',
        message: 'Command executed: move_forward',
        raw: '{"command":"move_forward","status":"executed","duration":250}',
        size: 59
      }
    ]

    return {
      value: messagesData?.messages?.length || sampleMessages.length,
      timestamp: new Date().toISOString(),
      messages: messagesData?.messages || sampleMessages,
      isMonitoring: messagesData?.isMonitoring ?? true,
      totalMessages: messagesData?.totalMessages || 1247,
      filteredMessages: messagesData?.filteredMessages || 5,
      messageRate: messagesData?.messageRate || 3.2,
      sources: messagesData?.sources || ['robot_base', 'sensor_hub', 'navigation', 'camera', 'control'],
      levels: messagesData?.levels || {
        debug: 523,
        info: 621,
        warning: 87,
        error: 16
      },
      bufferUsage: messagesData?.bufferUsage || 65.2,
      lastMessageTime: messagesData?.lastMessageTime || Date.now() - 2000,
      metadata: { source: 'message_monitor', system: 'comms' }
    }
  }, [messagesData])

  const currentData = messagesData || getDummyData()

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'debug':
        return 'text-gray-500'
      case 'info':
        return 'text-blue-600'
      case 'warning':
        return 'text-yellow-600'
      case 'error':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'debug':
        return 'bg-gray-100 text-gray-800'
      case 'info':
        return 'bg-blue-100 text-blue-800'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'debug':
        return <Terminal className="h-3 w-3" />
      case 'info':
        return <CheckCircle className="h-3 w-3" />
      case 'warning':
        return <AlertCircle className="h-3 w-3" />
      case 'error':
        return <AlertCircle className="h-3 w-3" />
      default:
        return <MessageSquare className="h-3 w-3" />
    }
  }

  const handleConfigChange = (key: keyof RawMessagesConfig, value: any) => {
    onConfigChange?.({
      ...messagesConfig,
      [key]: value
    })
  }

  const filteredMessages = (currentData.messages || []).filter(msg => {
    const levelMatch = messagesConfig?.filterLevel === 'all' || msg.level === messagesConfig?.filterLevel
    const searchMatch = !searchTerm || 
                       msg.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       msg.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       msg.raw.toLowerCase().includes(searchTerm.toLowerCase())
    return levelMatch && searchMatch
  })

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const clearMessages = () => {
    onDataRequest?.(id, {
      action: 'clear_messages'
    })
  }

  const exportMessages = () => {
    const exportData = filteredMessages.map(msg => ({
      timestamp: new Date(msg.timestamp).toISOString(),
      source: msg.source,
      level: msg.level,
      message: msg.message,
      raw: msg.raw
    }))
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `raw-messages-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const toggleMonitoring = () => {
    onDataRequest?.(id, {
      action: currentData.isMonitoring ? 'stop_monitoring' : 'start_monitoring'
    })
  }

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesConfig?.autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [currentData.messages?.length, messagesConfig?.autoScroll])

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp)
    return messagesConfig?.showTimestamps 
      ? date.toLocaleTimeString() + '.' + date.getMilliseconds().toString().padStart(3, '0')
      : ''
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`
  }

  const renderMessagesView = () => (
    <div 
      ref={messagesContainerRef}
      className={`
        font-mono text-sm border rounded p-2 h-48 overflow-y-auto bg-black text-green-400
        ${messagesConfig?.fontSize === 'small' ? 'text-xs' : ''}
        ${messagesConfig?.fontSize === 'large' ? 'text-base' : ''}
      `}
      style={{ 
        whiteSpace: messagesConfig?.wordWrap ? 'pre-wrap' : 'pre',
        backgroundColor: '#0a0a0a',
        color: '#00ff00'
      }}
    >
      {filteredMessages.map((msg, index) => (
        <div
          key={msg.id}
          className={`
            border-l-2 pl-2 mb-1 cursor-pointer hover:bg-gray-900/50 rounded
            ${selectedMessage === msg.id ? 'bg-gray-800/50' : ''}
            ${getLevelColor(msg.level).replace('text-', 'border-l-')}
          `}
          onClick={() => setSelectedMessage(selectedMessage === msg.id ? null : msg.id)}
        >
          <div className="flex items-start gap-2">
            {messagesConfig?.lineNumbers && (
              <span className="text-gray-500 text-xs w-8 text-right flex-shrink-0">
                {index + 1}
              </span>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {messagesConfig?.showTimestamps && (
                  <span className="text-gray-400 text-xs">
                    {formatTimestamp(msg.timestamp)}
                  </span>
                )}
                {messagesConfig?.showSource && (
                  <Badge variant="outline" className="text-xs px-1 py-0">
                    {msg.source}
                  </Badge>
                )}
                {messagesConfig?.showLevel && (
                  <Badge className={`text-xs px-1 py-0 ${getLevelBadgeColor(msg.level)}`}>
                    {msg.level}
                  </Badge>
                )}
              </div>
              <div className={`${messagesConfig?.colorizeMessages ? getLevelColor(msg.level) : ''}`}>
                {searchTerm && messagesConfig?.searchHighlight ? (
                  <span dangerouslySetInnerHTML={{
                    __html: msg.message.replace(
                      new RegExp(`(${searchTerm})`, 'gi'),
                      '<mark class="bg-yellow-300 text-black">$1</mark>'
                    )
                  }} />
                ) : (
                  msg.message
                )}
              </div>
              {selectedMessage === msg.id && (
                <div className="mt-2 p-2 bg-gray-800/50 rounded text-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400">Raw Message:</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => copyToClipboard(msg.raw)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <pre className="text-xs text-gray-300 whitespace-pre-wrap break-all">
                    {JSON.stringify(JSON.parse(msg.raw), null, 2)}
                  </pre>
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                    <span>Size: {formatSize(msg.size)}</span>
                    <span>ID: {msg.id}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  )

  const renderSearchFilter = () => (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search messages..."
            className="pl-7 h-8 text-xs"
          />
        </div>
        <Select
          value={messagesConfig?.filterLevel || 'all'}
          onValueChange={(value) => handleConfigChange('filterLevel', value)}
        >
          <SelectTrigger className="w-24 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="debug">Debug</SelectItem>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Showing {filteredMessages.length} of {currentData.messages?.length || 0} messages</span>
        <span>Rate: {(currentData.messageRate || 0).toFixed(1)}/s</span>
      </div>
    </div>
  )

  const renderStatistics = () => (
    <div className="grid grid-cols-2 gap-2 text-xs">
      <div>
        <div className="text-muted-foreground">Total Messages</div>
        <div className="font-mono">{(currentData.totalMessages || 0).toLocaleString()}</div>
      </div>
      <div>
        <div className="text-muted-foreground">Message Rate</div>
        <div className="font-mono">{(currentData.messageRate || 0).toFixed(1)}/s</div>
      </div>
      <div>
        <div className="text-muted-foreground">Buffer Usage</div>
        <div className="font-mono">{(currentData.bufferUsage || 0).toFixed(1)}%</div>
      </div>
      <div>
        <div className="text-muted-foreground">Sources</div>
        <div className="font-mono">{currentData.sources?.length || 0}</div>
      </div>
      {Object.entries(currentData.levels || {}).map(([level, count]) => (
        <div key={level}>
          <div className="text-muted-foreground flex items-center gap-1">
            {getLevelIcon(level)}
            {level}
          </div>
          <div className="font-mono">{count}</div>
        </div>
      ))}
    </div>
  )

  const renderSettings = () => (
    <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded">
      <div className="space-y-2">
        <Label className="text-xs">Max Messages</Label>
        <Input
          type="number"
          value={messagesConfig?.maxMessages || 1000}
          onChange={(e) => handleConfigChange('maxMessages', parseInt(e.target.value))}
          className="h-8 text-xs"
          min="100"
          max="10000"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Buffer Size (MB)</Label>
        <Input
          type="number"
          value={messagesConfig?.bufferSize || 10}
          onChange={(e) => handleConfigChange('bufferSize', parseInt(e.target.value))}
          className="h-8 text-xs"
          min="1"
          max="100"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Font Size</Label>
        <Select
          value={messagesConfig?.fontSize || 'medium'}
          onValueChange={(value) => handleConfigChange('fontSize', value)}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="small">Small</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="large">Large</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Update Rate (ms)</Label>
        <Input
          type="number"
          value={messagesConfig?.updateRate || 100}
          onChange={(e) => handleConfigChange('updateRate', parseInt(e.target.value))}
          className="h-8 text-xs"
          min="50"
          max="5000"
        />
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="auto-scroll"
          checked={messagesConfig?.autoScroll || false}
          onCheckedChange={(checked) => handleConfigChange('autoScroll', checked)}
        />
        <Label htmlFor="auto-scroll" className="text-xs">Auto Scroll</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="colorize"
          checked={messagesConfig?.colorizeMessages || false}
          onCheckedChange={(checked) => handleConfigChange('colorizeMessages', checked)}
        />
        <Label htmlFor="colorize" className="text-xs">Colorize Messages</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="timestamps"
          checked={messagesConfig?.showTimestamps || false}
          onCheckedChange={(checked) => handleConfigChange('showTimestamps', checked)}
        />
        <Label htmlFor="timestamps" className="text-xs">Show Timestamps</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="line-numbers"
          checked={messagesConfig?.lineNumbers || false}
          onCheckedChange={(checked) => handleConfigChange('lineNumbers', checked)}
        />
        <Label htmlFor="line-numbers" className="text-xs">Line Numbers</Label>
      </div>
    </div>
  )

  return (
    <Card className="w-full h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            {messagesConfig?.title || title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge 
              variant={currentData.isMonitoring ? "default" : "secondary"}
              className="text-xs"
            >
              {currentData.isMonitoring ? 'Monitoring' : 'Paused'}
            </Badge>
            {copySuccess && (
              <Badge variant="outline" className="text-xs text-green-600">
                Copied!
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={toggleMonitoring}
              title={currentData.isMonitoring ? 'Pause monitoring' : 'Start monitoring'}
            >
              {currentData.isMonitoring ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={exportMessages}
              title="Export messages"
            >
              <Download className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={clearMessages}
              title="Clear messages"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <Settings className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isExpanded && renderSettings()}
        
        {renderSearchFilter()}
        
        {renderMessagesView()}
        
        <Tabs defaultValue="stats" className="w-full">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="stats" className="text-xs">Statistics</TabsTrigger>
          </TabsList>
          <TabsContent value="stats" className="mt-3">
            {renderStatistics()}
          </TabsContent>
        </Tabs>

        <div className="text-xs text-muted-foreground text-center">
          Last Message: {new Date(currentData.lastMessageTime).toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  )
}

// AriesMod configuration
export const RawMessagesMod: AriesMod = {
  metadata: {
    id: 'raw-messages',
    name: 'RawMessages',
    displayName: 'Raw Messages Widget',
    description: 'Debug and inspect raw messages with filtering, search, and real-time monitoring',
    category: 'utility',
    tags: ['debug', 'messages', 'monitoring', 'logging', 'inspection', 'raw'],
    version: '1.0.0',
    author: 'AriesUI',
    icon: MessageSquare,
    thumbnail: '/thumbnails/raw-messages.png',
    defaultWidth: 500,
    defaultHeight: 400,
    minWidth: 300,
    minHeight: 250,
    maxWidth: 800,
    maxHeight: 600,
    supportedDataTypes: ['messages', 'logs', 'debug'],
    configurable: true,
    hardwareIntegrated: true
  },
  component: RawMessages,
  defaultConfig: {
    title: 'Raw Messages',
    maxMessages: 1000,
    autoScroll: true,
    showTimestamps: true,
    showSource: true,
    showLevel: true,
    filterLevel: 'all',
    colorizeMessages: true,
    fontSize: 'medium',
    wordWrap: true,
    lineNumbers: false,
    searchHighlight: true,
    bufferSize: 10,
    updateRate: 100,
    monitoredSources: []
  },
  generateDummyData: () => ({
    value: 5,
    timestamp: new Date().toISOString(),
    messages: [
      {
        id: 'msg_001',
        timestamp: Date.now() - 1000,
        source: 'robot_base',
        level: 'info' as const,
        message: 'System initialized successfully',
        raw: '{"type":"status","module":"robot","status":"initialized"}',
        size: 56
      }
    ],
    isMonitoring: true,
    totalMessages: 1247,
    filteredMessages: 5,
    messageRate: 3.2,
    sources: ['robot_base', 'sensor_hub'],
    levels: { debug: 523, info: 621, warning: 87, error: 16 },
    bufferUsage: 65.2,
    lastMessageTime: Date.now() - 1000,
    metadata: { source: 'demo' }
  }),
  validateConfig: (config: Record<string, any>) => {
    return typeof config.title === 'string' && 
           typeof config.maxMessages === 'number' &&
           config.maxMessages > 0
  }
}

export default RawMessages 