import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Send, 
  Power, 
  Square, 
  Play, 
  Pause, 
  RotateCw, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight,
  Settings, 
  AlertTriangle,
  Shield,
  History,
  Target,
  Zap
} from 'lucide-react'
import type { AriesModProps, AriesMod, AriesModData } from '@/types/ariesmods'

export interface PublishControlConfig {
  title: string
  targetModule: string
  controlType: 'basic' | 'advanced' | 'gamepad' | 'custom'
  enableSafety: boolean
  confirmDangerous: boolean
  commandTimeout: number
  maxRetries: number
  quickCommands: Array<{
    id: string
    name: string
    command: string
    type: 'safe' | 'warning' | 'danger'
    hotkey?: string
  }>
  customControls: Array<{
    id: string
    type: 'button' | 'slider' | 'toggle' | 'input'
    label: string
    command: string
    min?: number
    max?: number
    step?: number
    defaultValue?: any
  }>
}

export interface CommandHistory {
  id: string
  command: string
  timestamp: number
  status: 'sent' | 'acknowledged' | 'failed' | 'timeout'
  response?: string
  duration?: number
}

export interface PublishControlData extends AriesModData {
  connectionStatus: 'connected' | 'disconnected' | 'error'
  lastCommand?: CommandHistory
  commandHistory: CommandHistory[]
  activeCommands: string[]
  emergencyStop: boolean
  safetyLocked: boolean
  targetModules: string[]
  capabilities: string[]
}

const PublishControl: React.FC<AriesModProps> = ({
  id,
  title,
  width = 400,
  height = 300,
  data,
  config,
  onConfigChange,
  onDataRequest
}) => {
  const controlConfig = config as PublishControlConfig
  const controlData = data as PublishControlData

  const [isExpanded, setIsExpanded] = useState(false)
  const [customCommand, setCustomCommand] = useState('')
  const [selectedQuickCommand, setSelectedQuickCommand] = useState<string | null>(null)
  const [confirmingDangerous, setConfirmingDangerous] = useState<string | null>(null)
  const [gamepadState, setGamepadState] = useState({
    leftStick: { x: 0, y: 0 },
    rightStick: { x: 0, y: 0 },
    triggers: { left: 0, right: 0 }
  })

  // Dummy data for demo purposes
  const getDummyData = useCallback((): PublishControlData => ({
    value: controlData?.lastCommand?.command || 'none',
    timestamp: new Date().toISOString(),
    connectionStatus: controlData?.connectionStatus || 'connected',
    lastCommand: controlData?.lastCommand || {
      id: 'cmd_001',
      command: 'move_forward',
      timestamp: Date.now() - 5000,
      status: 'acknowledged',
      response: 'Command executed successfully',
      duration: 250
    },
    commandHistory: controlData?.commandHistory || [
      {
        id: 'cmd_001',
        command: 'move_forward',
        timestamp: Date.now() - 5000,
        status: 'acknowledged',
        duration: 250
      },
      {
        id: 'cmd_002',
        command: 'turn_left',
        timestamp: Date.now() - 3000,
        status: 'acknowledged',
        duration: 180
      },
      {
        id: 'cmd_003',
        command: 'stop',
        timestamp: Date.now() - 1000,
        status: 'acknowledged',
        duration: 50
      }
    ],
    activeCommands: controlData?.activeCommands || [],
    emergencyStop: controlData?.emergencyStop || false,
    safetyLocked: controlData?.safetyLocked || false,
    targetModules: controlData?.targetModules || ['robot_base', 'arm_controller', 'gripper'],
    capabilities: controlData?.capabilities || ['move', 'rotate', 'stop', 'emergency_stop'],
    metadata: { source: 'control', system: 'robot' }
  }), [controlData])

  const currentData = controlData || getDummyData()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getCommandStatusColor = (status: string) => {
    switch (status) {
      case 'acknowledged':
        return 'text-green-600'
      case 'failed':
        return 'text-red-600'
      case 'timeout':
        return 'text-yellow-600'
      default:
        return 'text-blue-600'
    }
  }

  const getCommandTypeColor = (type: string) => {
    switch (type) {
      case 'safe':
        return 'bg-green-100 text-green-800 hover:bg-green-200'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
      case 'danger':
        return 'bg-red-100 text-red-800 hover:bg-red-200'
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200'
    }
  }

  const handleConfigChange = (key: keyof PublishControlConfig, value: any) => {
    onConfigChange?.({
      ...controlConfig,
      [key]: value
    })
  }

  const sendCommand = async (command: string, type: 'safe' | 'warning' | 'danger' = 'safe') => {
    if (currentData.emergencyStop) {
      alert('Emergency stop is active. Reset before sending commands.')
      return
    }

    if (currentData.safetyLocked && type === 'danger') {
      alert('Safety lock is active. Dangerous commands are disabled.')
      return
    }

    if (controlConfig?.confirmDangerous && type === 'danger') {
      if (confirmingDangerous !== command) {
        setConfirmingDangerous(command)
        return
      }
      setConfirmingDangerous(null)
    }

    onDataRequest?.(id, {
      action: 'send_command',
      command,
      target: controlConfig?.targetModule || 'default',
      timestamp: Date.now(),
      type
    })
  }

  const sendCustomCommand = () => {
    if (customCommand.trim()) {
      sendCommand(customCommand)
      setCustomCommand('')
    }
  }

  const emergencyStop = () => {
    onDataRequest?.(id, {
      action: 'emergency_stop',
      timestamp: Date.now()
    })
  }

  const resetEmergencyStop = () => {
    onDataRequest?.(id, {
      action: 'reset_emergency_stop',
      timestamp: Date.now()
    })
  }

  const toggleSafetyLock = () => {
    onDataRequest?.(id, {
      action: 'toggle_safety_lock',
      locked: !currentData.safetyLocked
    })
  }

  const defaultQuickCommands = controlConfig?.quickCommands || [
    { id: 'stop', name: 'Stop', command: 'stop', type: 'safe' as const, hotkey: 'Space' },
    { id: 'forward', name: 'Forward', command: 'move_forward', type: 'safe' as const, hotkey: 'W' },
    { id: 'backward', name: 'Backward', command: 'move_backward', type: 'safe' as const, hotkey: 'S' },
    { id: 'left', name: 'Turn Left', command: 'turn_left', type: 'safe' as const, hotkey: 'A' },
    { id: 'right', name: 'Turn Right', command: 'turn_right', type: 'safe' as const, hotkey: 'D' },
    { id: 'home', name: 'Go Home', command: 'go_home', type: 'warning' as const },
    { id: 'reset', name: 'Reset System', command: 'system_reset', type: 'danger' as const }
  ]

  const renderBasicControls = () => (
    <div className="space-y-3">
      {/* Emergency Stop */}
      <div className="flex gap-2">
        <Button
          variant={currentData.emergencyStop ? "default" : "destructive"}
          className="flex-1"
          onClick={currentData.emergencyStop ? resetEmergencyStop : emergencyStop}
        >
          <Square className="h-4 w-4 mr-2" />
          {currentData.emergencyStop ? 'Reset E-Stop' : 'Emergency Stop'}
        </Button>
        <Button
          variant={currentData.safetyLocked ? "default" : "outline"}
          onClick={toggleSafetyLock}
          title="Safety lock prevents dangerous commands"
        >
          <Shield className="h-4 w-4" />
        </Button>
      </div>

      {/* Direction Controls */}
      <div className="grid grid-cols-3 gap-2">
        <div />
        <Button
          variant="outline"
          onClick={() => sendCommand('move_forward')}
          disabled={currentData.emergencyStop}
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
        <div />
        <Button
          variant="outline"
          onClick={() => sendCommand('turn_left')}
          disabled={currentData.emergencyStop}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          onClick={() => sendCommand('stop')}
          disabled={currentData.emergencyStop}
        >
          <Square className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          onClick={() => sendCommand('turn_right')}
          disabled={currentData.emergencyStop}
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
        <div />
        <Button
          variant="outline"
          onClick={() => sendCommand('move_backward')}
          disabled={currentData.emergencyStop}
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
        <div />
      </div>
    </div>
  )

  const renderQuickCommands = () => (
    <div className="space-y-2">
      <div className="text-sm font-medium">Quick Commands</div>
      <div className="grid grid-cols-2 gap-2">
        {defaultQuickCommands.map((cmd) => (
          <Button
            key={cmd.id}
            variant="outline"
            className={`text-xs h-8 ${getCommandTypeColor(cmd.type)} ${
              confirmingDangerous === cmd.command ? 'ring-2 ring-red-500' : ''
            }`}
            onClick={() => sendCommand(cmd.command, cmd.type)}
            disabled={currentData.emergencyStop}
            title={cmd.hotkey ? `Hotkey: ${cmd.hotkey}` : undefined}
          >
            {confirmingDangerous === cmd.command ? 'Confirm?' : cmd.name}
          </Button>
        ))}
      </div>
    </div>
  )

  const renderCustomCommand = () => (
    <div className="space-y-2">
      <div className="text-sm font-medium">Custom Command</div>
      <div className="flex gap-2">
        <Input
          value={customCommand}
          onChange={(e) => setCustomCommand(e.target.value)}
          placeholder="Enter command..."
          className="text-xs"
          onKeyPress={(e) => e.key === 'Enter' && sendCustomCommand()}
          disabled={currentData.emergencyStop}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={sendCustomCommand}
          disabled={!customCommand.trim() || currentData.emergencyStop}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  const renderCommandHistory = () => (
    <div className="space-y-2">
      <div className="text-sm font-medium">Command History</div>
      <div className="space-y-1 max-h-32 overflow-y-auto">
        {currentData.commandHistory.slice(-5).reverse().map((cmd) => (
          <div 
            key={cmd.id}
            className="flex items-center justify-between text-xs p-2 bg-muted/50 rounded"
          >
            <div className="flex items-center gap-2">
              <span className="font-mono">{cmd.command}</span>
              <Badge variant="outline" className={`text-xs ${getCommandStatusColor(cmd.status)}`}>
                {cmd.status}
              </Badge>
            </div>
            <span className="text-muted-foreground">
              {new Date(cmd.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )

  const renderConnectionInfo = () => (
    <div className="grid grid-cols-2 gap-2 text-xs">
      <div>
        <div className="text-muted-foreground">Connection</div>
        <Badge className={getStatusColor(currentData.connectionStatus)}>
          {currentData.connectionStatus}
        </Badge>
      </div>
      <div>
        <div className="text-muted-foreground">Target Module</div>
        <div className="font-mono">{controlConfig?.targetModule || 'default'}</div>
      </div>
      <div>
        <div className="text-muted-foreground">Emergency Stop</div>
        <Badge variant={currentData.emergencyStop ? "destructive" : "secondary"}>
          {currentData.emergencyStop ? 'Active' : 'Inactive'}
        </Badge>
      </div>
      <div>
        <div className="text-muted-foreground">Safety Lock</div>
        <Badge variant={currentData.safetyLocked ? "default" : "secondary"}>
          {currentData.safetyLocked ? 'Locked' : 'Unlocked'}
        </Badge>
      </div>
      {currentData.lastCommand && (
        <>
          <div>
            <div className="text-muted-foreground">Last Command</div>
            <div className="font-mono">{currentData.lastCommand.command}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Response Time</div>
            <div className="font-mono">{currentData.lastCommand.duration}ms</div>
          </div>
        </>
      )}
    </div>
  )

  const renderSettings = () => (
    <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded">
      <div className="space-y-2">
        <Label className="text-xs">Control Type</Label>
        <Select
          value={controlConfig?.controlType || 'basic'}
          onValueChange={(value) => handleConfigChange('controlType', value)}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="basic">Basic Controls</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
            <SelectItem value="gamepad">Gamepad</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Target Module</Label>
        <Select
          value={controlConfig?.targetModule || 'default'}
          onValueChange={(value) => handleConfigChange('targetModule', value)}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {currentData.targetModules.map((module) => (
              <SelectItem key={module} value={module}>
                {module}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Command Timeout (ms)</Label>
        <Input
          type="number"
          value={controlConfig?.commandTimeout || 5000}
          onChange={(e) => handleConfigChange('commandTimeout', parseInt(e.target.value))}
          className="h-8 text-xs"
          min="100"
          max="30000"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Max Retries</Label>
        <Input
          type="number"
          value={controlConfig?.maxRetries || 3}
          onChange={(e) => handleConfigChange('maxRetries', parseInt(e.target.value))}
          className="h-8 text-xs"
          min="0"
          max="10"
        />
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="enable-safety"
          checked={controlConfig?.enableSafety || false}
          onCheckedChange={(checked) => handleConfigChange('enableSafety', checked)}
        />
        <Label htmlFor="enable-safety" className="text-xs">Enable Safety</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="confirm-dangerous"
          checked={controlConfig?.confirmDangerous || false}
          onCheckedChange={(checked) => handleConfigChange('confirmDangerous', checked)}
        />
        <Label htmlFor="confirm-dangerous" className="text-xs">Confirm Dangerous</Label>
      </div>
    </div>
  )

  return (
    <Card className="w-full h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            {controlConfig?.title || title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge 
              className={getStatusColor(currentData.connectionStatus)}
            >
              {currentData.connectionStatus}
            </Badge>
            {currentData.emergencyStop && (
              <Badge variant="destructive" className="text-xs animate-pulse">
                E-STOP
              </Badge>
            )}
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
        
        {renderBasicControls()}
        
        <Tabs defaultValue="quick" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="quick" className="text-xs">Quick</TabsTrigger>
            <TabsTrigger value="custom" className="text-xs">Custom</TabsTrigger>
            <TabsTrigger value="history" className="text-xs">History</TabsTrigger>
          </TabsList>
          <TabsContent value="quick" className="mt-3">
            {renderQuickCommands()}
          </TabsContent>
          <TabsContent value="custom" className="mt-3">
            {renderCustomCommand()}
          </TabsContent>
          <TabsContent value="history" className="mt-3">
            {renderCommandHistory()}
          </TabsContent>
        </Tabs>

        {renderConnectionInfo()}

        <div className="text-xs text-muted-foreground text-center">
          Last Update: {new Date(currentData.timestamp).toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  )
}

// AriesMod configuration
export const PublishControlMod: AriesMod = {
  metadata: {
    id: 'publish-control',
    displayName: 'Publish/Control Widget',
    description: 'Send commands and control hardware/robots with safety features and command history',
    category: 'controls',
    tags: ['control', 'commands', 'robot', 'hardware', 'safety', 'publish'],
    version: '1.0.0',
    author: 'AriesUI',
    thumbnail: '/thumbnails/publish-control.png',
    defaultSize: { width: 400, height: 400 },
    minSize: { width: 300, height: 300 },
    maxSize: { width: 600, height: 800 },
    supportedDataTypes: ['commands', 'control', 'robot'],
    configurable: true,
    hardwareIntegrated: true
  },
  component: PublishControl,
  defaultConfig: {
    title: 'Robot Control',
    targetModule: 'robot_base',
    controlType: 'basic',
    enableSafety: true,
    confirmDangerous: true,
    commandTimeout: 5000,
    maxRetries: 3,
    quickCommands: [
      { id: 'stop', name: 'Stop', command: 'stop', type: 'safe', hotkey: 'Space' },
      { id: 'forward', name: 'Forward', command: 'move_forward', type: 'safe', hotkey: 'W' }
    ],
    customControls: []
  },
  generateDummyData: () => ({
    value: 'connected',
    timestamp: new Date().toISOString(),
    connectionStatus: 'connected' as const,
    lastCommand: {
      id: 'cmd_001',
      command: 'move_forward',
      timestamp: Date.now() - 1000,
      status: 'acknowledged' as const,
      duration: 250
    },
    commandHistory: [
      {
        id: 'cmd_001',
        command: 'move_forward',
        timestamp: Date.now() - 1000,
        status: 'acknowledged' as const,
        duration: 250
      }
    ],
    activeCommands: [],
    emergencyStop: false,
    safetyLocked: false,
    targetModules: ['robot_base', 'arm_controller'],
    capabilities: ['move', 'rotate', 'stop'],
    metadata: { source: 'demo' }
  }),
  validateConfig: (config: Record<string, any>) => {
    return typeof config.title === 'string' && 
           typeof config.targetModule === 'string' &&
           typeof config.commandTimeout === 'number' &&
           config.commandTimeout > 0
  }
}

export default PublishControl 