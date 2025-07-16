import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCommsStream } from '@/hooks/use-comms-stream'
import type { AriesModProps } from '@/types/ariesmods'

/**
 * PhysicsControlPanel - Control panel for physics simulations
 * 
 * This component provides a user interface for controlling physics simulations,
 * including start/pause/stop controls, parameter adjustments, and simulation status.
 */
const PhysicsControlPanel: React.FC<AriesModProps> = ({
  title,
  data,
  config = {}
}) => {
  // WebSocket connection for sending commands
  const [ws, setWs] = useState<WebSocket | null>(null)
  
  // Simulation state
  const [simulationStatus, setSimulationStatus] = useState<string>('idle')
  const [simulationTime, setSimulationTime] = useState<number>(0)
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1.0)
  
  // Configuration options
  const simulationId = config.simulationId || 'default_simulation'
  const wsUrl = config.wsUrl || 'ws://localhost:3000'
  const parameters = config.parameters || []
  
  // Connect to WebSocket
  useEffect(() => {
    const socket = new WebSocket(wsUrl)
    
    socket.onopen = () => {
      console.log('Connected to Stream Handler')
      setWs(socket)
    }
    
    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        
        // Handle physics simulation messages
        if (message.type === 'physics_simulation') {
          if (message.simulation_id === simulationId) {
            if (message.action === 'status') {
              setSimulationStatus(message.status)
            } else if (message.action === 'updated') {
              // Update simulation time if available
              if (message.stream_id === 'simulation_state' && message.data?.value?.time) {
                setSimulationTime(message.data.value.time)
              }
            }
          }
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }
    
    socket.onclose = () => {
      console.log('Disconnected from Stream Handler')
      setWs(null)
    }
    
    socket.onerror = (error) => {
      console.error('WebSocket error:', error)
    }
    
    // Clean up WebSocket connection
    return () => {
      socket.close()
    }
  }, [wsUrl, simulationId])
  
  // Send control command to simulation
  const sendCommand = (command: string, params: any = {}) => {
    if (!ws) return
    
    const message = {
      type: 'physics_simulation',
      action: 'control',
      simulation_id: simulationId,
      command,
      params,
      'msg-sent-timestamp': new Date().toISOString()
    }
    
    ws.send(JSON.stringify(message))
  }
  
  // Handle parameter change
  const handleParameterChange = (name: string, value: number) => {
    sendCommand('set_parameter', { name, value })
  }
  
  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 1000)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`
  }
  
  // Get status badge color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'running':
        return 'bg-green-500'
      case 'paused':
        return 'bg-yellow-500'
      case 'stopped':
        return 'bg-red-500'
      case 'completed':
        return 'bg-blue-500'
      case 'error':
        return 'bg-destructive'
      default:
        return 'bg-gray-500'
    }
  }
  
  return (
    <Card className="w-full h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-sm font-medium">{title || 'Simulation Control'}</CardTitle>
            <CardDescription className="text-xs">ID: {simulationId}</CardDescription>
          </div>
          <Badge 
            className={`${getStatusColor(simulationStatus)} text-white`}
          >
            {simulationStatus}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="controls">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="controls">Controls</TabsTrigger>
            <TabsTrigger value="parameters">Parameters</TabsTrigger>
          </TabsList>
          
          <TabsContent value="controls" className="space-y-4 pt-2">
            {/* Time display */}
            <div className="flex justify-between items-center">
              <Label>Simulation Time</Label>
              <div className="text-xl font-mono">{formatTime(simulationTime)}</div>
            </div>
            
            {/* Control buttons */}
            <div className="grid grid-cols-3 gap-2">
              <Button 
                onClick={() => sendCommand('start')}
                disabled={simulationStatus === 'running'}
                className="bg-green-600 hover:bg-green-700"
              >
                Start
              </Button>
              <Button 
                onClick={() => sendCommand('pause')}
                disabled={simulationStatus !== 'running'}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                Pause
              </Button>
              <Button 
                onClick={() => sendCommand('stop')}
                disabled={simulationStatus === 'stopped' || simulationStatus === 'completed'}
                className="bg-red-600 hover:bg-red-700"
              >
                Stop
              </Button>
            </div>
            
            {/* Reset and step buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button 
                onClick={() => sendCommand('reset')}
                variant="outline"
              >
                Reset
              </Button>
              <Button 
                onClick={() => sendCommand('step')}
                disabled={simulationStatus === 'running'}
                variant="outline"
              >
                Step
              </Button>
            </div>
            
            {/* Simulation speed control */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Simulation Speed</Label>
                <span className="text-sm">{simulationSpeed}x</span>
              </div>
              <Slider
                value={[simulationSpeed]}
                min={0.1}
                max={10}
                step={0.1}
                onValueChange={(value) => {
                  const speed = value[0]
                  setSimulationSpeed(speed)
                  sendCommand('set_speed', { speed })
                }}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="parameters" className="space-y-4 pt-2">
            {parameters.length > 0 ? (
              parameters.map((param: any, index: number) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between">
                    <Label>{param.name}</Label>
                    <span className="text-sm">{param.value} {param.unit}</span>
                  </div>
                  <div className="flex gap-2">
                    <Slider
                      value={[param.value]}
                      min={param.min}
                      max={param.max}
                      step={param.step || 0.01}
                      onValueChange={(value) => {
                        const newValue = value[0]
                        // Update local state
                        const newParams = [...parameters]
                        newParams[index].value = newValue
                        // Send to simulation
                        handleParameterChange(param.name, newValue)
                      }}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      value={param.value}
                      onChange={(e) => {
                        const newValue = parseFloat(e.target.value)
                        if (!isNaN(newValue)) {
                          // Update local state
                          const newParams = [...parameters]
                          newParams[index].value = newValue
                          // Send to simulation
                          handleParameterChange(param.name, newValue)
                        }
                      }}
                      className="w-20"
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-4">
                No parameters available
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default PhysicsControlPanel