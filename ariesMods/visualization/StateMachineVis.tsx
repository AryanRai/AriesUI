import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Activity, Play, Pause, RotateCcw, Settings, AlertTriangle } from 'lucide-react'
import type { AriesModProps, AriesMod, AriesModData } from '@/types/ariesmods'

export interface StateMachineVisConfig {
  title: string
  autoTransition: boolean
  showHistory: boolean
  highlightTransitions: boolean
  maxHistorySize: number
  layoutStyle: 'horizontal' | 'vertical' | 'circular'
  colorScheme: 'default' | 'status' | 'minimal'
}

export interface StateMachineState {
  id: string
  name: string
  description?: string
  type: 'idle' | 'active' | 'error' | 'warning' | 'success'
  entryActions?: string[]
  exitActions?: string[]
}

export interface StateMachineTransition {
  from: string
  to: string
  trigger: string
  condition?: string
  duration?: number
}

export interface StateMachineData extends AriesModData {
  currentState: string
  previousState?: string
  states: StateMachineState[]
  transitions: StateMachineTransition[]
  history: Array<{
    state: string
    timestamp: number
    trigger?: string
  }>
  isRunning: boolean
  lastTransition?: {
    from: string
    to: string
    timestamp: number
    trigger: string
  }
}

const StateMachineVis: React.FC<AriesModProps> = ({
  id,
  title,
  width = 400,
  height = 300,
  data,
  config,
  onConfigChange,
  onDataRequest
}) => {
  const stateConfig = config as StateMachineVisConfig
  const stateData = data as StateMachineData

  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedState, setSelectedState] = useState<string | null>(null)
  const [animatingTransition, setAnimatingTransition] = useState<string | null>(null)

  // Dummy data for demo purposes
  const getDummyData = useCallback((): StateMachineData => ({
    value: stateData?.currentState || 'idle',
    timestamp: new Date().toISOString(),
    currentState: stateData?.currentState || 'idle',
    previousState: stateData?.previousState,
    states: stateData?.states || [
      { id: 'idle', name: 'Idle', type: 'idle', description: 'System at rest' },
      { id: 'initializing', name: 'Initializing', type: 'warning', description: 'Starting up systems' },
      { id: 'running', name: 'Running', type: 'active', description: 'Normal operation' },
      { id: 'paused', name: 'Paused', type: 'warning', description: 'Temporarily stopped' },
      { id: 'error', name: 'Error', type: 'error', description: 'System error occurred' },
      { id: 'maintenance', name: 'Maintenance', type: 'warning', description: 'Under maintenance' },
      { id: 'shutdown', name: 'Shutdown', type: 'idle', description: 'System shutting down' }
    ],
    transitions: stateData?.transitions || [
      { from: 'idle', to: 'initializing', trigger: 'start' },
      { from: 'initializing', to: 'running', trigger: 'ready' },
      { from: 'running', to: 'paused', trigger: 'pause' },
      { from: 'paused', to: 'running', trigger: 'resume' },
      { from: 'running', to: 'error', trigger: 'fault' },
      { from: 'error', to: 'idle', trigger: 'reset' },
      { from: 'running', to: 'maintenance', trigger: 'service' },
      { from: 'maintenance', to: 'idle', trigger: 'complete' },
      { from: 'idle', to: 'shutdown', trigger: 'stop' }
    ],
    history: stateData?.history || [
      { state: 'idle', timestamp: Date.now() - 5000 },
      { state: 'initializing', timestamp: Date.now() - 3000, trigger: 'start' },
      { state: 'running', timestamp: Date.now() - 1000, trigger: 'ready' }
    ],
    isRunning: stateData?.isRunning ?? true,
    metadata: { source: 'state_machine', system: 'main' }
  }), [stateData])

  const currentData = stateData || getDummyData()

  const getStateColor = (state: StateMachineState, isCurrent: boolean = false) => {
    const intensity = isCurrent ? 'dark' : 'light'
    const scheme = stateConfig?.colorScheme || 'status'
    
    if (scheme === 'minimal') {
      return isCurrent ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground'
    }
    
    switch (state.type) {
      case 'active':
        return isCurrent ? 'bg-green-600 text-white' : 'bg-green-100 text-green-800'
      case 'error':
        return isCurrent ? 'bg-red-600 text-white' : 'bg-red-100 text-red-800'
      case 'warning':
        return isCurrent ? 'bg-yellow-600 text-white' : 'bg-yellow-100 text-yellow-800'
      case 'success':
        return isCurrent ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'
      default:
        return isCurrent ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-800'
    }
  }

  const getStateIcon = (state: StateMachineState) => {
    switch (state.type) {
      case 'active':
        return <Activity className="h-3 w-3" />
      case 'error':
        return <AlertTriangle className="h-3 w-3" />
      case 'warning':
        return <Pause className="h-3 w-3" />
      case 'success':
        return <Play className="h-3 w-3" />
      default:
        return <RotateCcw className="h-3 w-3" />
    }
  }

  const getCurrentState = () => {
    return currentData.states.find(s => s.id === currentData.currentState)
  }

  const getAvailableTransitions = () => {
    return currentData.transitions.filter(t => t.from === currentData.currentState)
  }

  const handleTransition = (toState: string, trigger: string) => {
    setAnimatingTransition(`${currentData.currentState}->${toState}`)
    
    // Simulate transition animation
    setTimeout(() => {
      setAnimatingTransition(null)
      onDataRequest?.(id, {
        action: 'transition',
        from: currentData.currentState,
        to: toState,
        trigger
      })
    }, 300)
  }

  const handleConfigChange = (key: keyof StateMachineVisConfig, value: any) => {
    onConfigChange?.({
      ...stateConfig,
      [key]: value
    })
  }

  const renderStateNode = (state: StateMachineState, index: number) => {
    const isCurrent = state.id === currentData.currentState
    const isSelected = state.id === selectedState
    const isAnimating = animatingTransition?.includes(state.id)

    return (
      <div
        key={state.id}
        className={`
          relative p-3 rounded-lg border cursor-pointer transition-all duration-300
          ${getStateColor(state, isCurrent)}
          ${isSelected ? 'ring-2 ring-primary' : ''}
          ${isAnimating ? 'scale-110 shadow-lg' : ''}
          ${isCurrent ? 'shadow-md' : 'hover:shadow-sm'}
        `}
        onClick={() => setSelectedState(isSelected ? null : state.id)}
      >
        <div className="flex items-center gap-2">
          {getStateIcon(state)}
          <span className="font-medium text-sm">{state.name}</span>
          {isCurrent && (
            <div className="w-2 h-2 bg-current rounded-full animate-pulse ml-auto" />
          )}
        </div>
        {isSelected && state.description && (
          <div className="mt-2 text-xs opacity-80">
            {state.description}
          </div>
        )}
      </div>
    )
  }

  const renderTransitionButtons = () => {
    const transitions = getAvailableTransitions()
    
    if (transitions.length === 0) {
      return <div className="text-xs text-muted-foreground">No transitions available</div>
    }

    return (
      <div className="space-y-1">
        <div className="text-xs font-medium text-muted-foreground mb-2">Available Transitions:</div>
        {transitions.map((transition, index) => {
          const targetState = currentData.states.find(s => s.id === transition.to)
          return (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className="w-full justify-start h-8"
              onClick={() => handleTransition(transition.to, transition.trigger)}
              disabled={!currentData.isRunning}
            >
              <span className="text-xs">
                {transition.trigger} → {targetState?.name}
              </span>
            </Button>
          )
        })}
      </div>
    )
  }

  const renderHistory = () => {
    if (!stateConfig?.showHistory || !currentData.history) return null

    const recentHistory = currentData.history.slice(-5).reverse()

    return (
      <div className="space-y-1">
        <div className="text-xs font-medium text-muted-foreground mb-2">Recent History:</div>
        {recentHistory.map((entry, index) => {
          const state = currentData.states.find(s => s.id === entry.state)
          return (
            <div key={index} className="flex items-center justify-between text-xs p-2 bg-muted/50 rounded">
              <div className="flex items-center gap-2">
                {state && getStateIcon(state)}
                <span>{state?.name}</span>
                {entry.trigger && (
                  <Badge variant="outline" className="text-xs py-0 px-1">
                    {entry.trigger}
                  </Badge>
                )}
              </div>
              <span className="text-muted-foreground">
                {new Date(entry.timestamp).toLocaleTimeString()}
              </span>
            </div>
          )
        })}
      </div>
    )
  }

  const currentState = getCurrentState()

  return (
    <Card className="w-full h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            {stateConfig?.title || title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge 
              variant={currentData.isRunning ? "default" : "secondary"}
              className="text-xs"
            >
              {currentData.isRunning ? 'Running' : 'Stopped'}
            </Badge>
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
        {currentState && (
          <div className="flex items-center gap-2 mt-2">
            <div className={`px-2 py-1 rounded text-xs ${getStateColor(currentState, true)}`}>
              <div className="flex items-center gap-1">
                {getStateIcon(currentState)}
                <span className="font-medium">{currentState.name}</span>
              </div>
            </div>
            {currentData.lastTransition && (
              <span className="text-xs text-muted-foreground">
                via {currentData.lastTransition.trigger}
              </span>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {isExpanded && (
          <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded">
            <div className="space-y-2">
              <Label className="text-xs">Layout Style</Label>
              <Select
                value={stateConfig?.layoutStyle || 'horizontal'}
                onValueChange={(value) => handleConfigChange('layoutStyle', value)}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="horizontal">Horizontal</SelectItem>
                  <SelectItem value="vertical">Vertical</SelectItem>
                  <SelectItem value="circular">Circular</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Color Scheme</Label>
              <Select
                value={stateConfig?.colorScheme || 'status'}
                onValueChange={(value) => handleConfigChange('colorScheme', value)}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="status">Status Colors</SelectItem>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="auto-transition"
                checked={stateConfig?.autoTransition || false}
                onCheckedChange={(checked) => handleConfigChange('autoTransition', checked)}
              />
              <Label htmlFor="auto-transition" className="text-xs">Auto Transition</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="show-history"
                checked={stateConfig?.showHistory || false}
                onCheckedChange={(checked) => handleConfigChange('showHistory', checked)}
              />
              <Label htmlFor="show-history" className="text-xs">Show History</Label>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          {currentData.states.map((state, index) => renderStateNode(state, index))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            {renderTransitionButtons()}
          </div>
          <div>
            {renderHistory()}
          </div>
        </div>

        <div className="text-xs text-muted-foreground text-center">
          Last Update: {new Date(currentData.timestamp).toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  )
}

// AriesMod configuration
export const StateMachineVisMod: AriesMod = {
  metadata: {
    id: 'state-machine-vis',
    displayName: 'State Machine Visualizer',
    description: 'Interactive visualization of system state machines with transitions and history',
    category: 'visualization',
    tags: ['state', 'machine', 'transitions', 'robotics', 'system'],
    version: '1.0.0',
    author: 'AriesUI',
    thumbnail: '/thumbnails/state-machine-vis.png',
    defaultSize: { width: 400, height: 350 },
    minSize: { width: 300, height: 250 },
    maxSize: { width: 800, height: 600 },
    supportedDataTypes: ['state_machine', 'transitions', 'status'],
    configurable: true,
    hardwareIntegrated: true
  },
  component: StateMachineVis,
  defaultConfig: {
    title: 'State Machine',
    autoTransition: false,
    showHistory: true,
    highlightTransitions: true,
    maxHistorySize: 50,
    layoutStyle: 'horizontal',
    colorScheme: 'status'
  },
  generateDummyData: () => ({
    value: 'running',
    timestamp: new Date().toISOString(),
    currentState: 'running',
    previousState: 'initializing',
    states: [
      { id: 'idle', name: 'Idle', type: 'idle' as const, description: 'System at rest' },
      { id: 'initializing', name: 'Initializing', type: 'warning' as const },
      { id: 'running', name: 'Running', type: 'active' as const },
      { id: 'error', name: 'Error', type: 'error' as const }
    ],
    transitions: [
      { from: 'idle', to: 'initializing', trigger: 'start' },
      { from: 'initializing', to: 'running', trigger: 'ready' },
      { from: 'running', to: 'error', trigger: 'fault' }
    ],
    history: [
      { state: 'idle', timestamp: Date.now() - 5000 },
      { state: 'initializing', timestamp: Date.now() - 3000, trigger: 'start' },
      { state: 'running', timestamp: Date.now() - 1000, trigger: 'ready' }
    ],
    isRunning: true,
    metadata: { source: 'demo' }
  }),
  validateConfig: (config: Record<string, any>) => {
    return typeof config.title === 'string' && 
           typeof config.autoTransition === 'boolean'
  }
}

export default StateMachineVis 