import { useState, useEffect, useCallback } from 'react'
import { CommsMessage, CommsModule, ControlMessage, ConfigUpdateMessage } from '@/types/comms'

export function useCommsSocket(url: string = 'ws://localhost:3000') {
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [modules, setModules] = useState<Map<string, CommsModule>>(new Map())
  const [lastMessage, setLastMessage] = useState<CommsMessage | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Connect to WebSocket
  useEffect(() => {
    let reconnectTimeout: NodeJS.Timeout
    let reconnectAttempts = 0
    const maxReconnectAttempts = 5
    const reconnectDelay = 5000 // 5 seconds

    function connect() {
      try {
        const ws = new WebSocket(url)

        ws.onopen = () => {
          console.log('🔗 Connected to StreamHandler')
          setIsConnected(true)
          setError(null)
          reconnectAttempts = 0
        }

        ws.onclose = () => {
          console.log('🔌 Disconnected from StreamHandler')
          setIsConnected(false)
          setError('Connection lost')

          // Attempt reconnection
          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++
            console.log(`Reconnecting (${reconnectAttempts}/${maxReconnectAttempts})...`)
            reconnectTimeout = setTimeout(connect, reconnectDelay)
          } else {
            setError('Failed to reconnect after multiple attempts')
          }
        }

        ws.onmessage = (event) => {
          try {
            const message: CommsMessage = JSON.parse(event.data)
            setLastMessage(message)

            // Handle negotiation messages (module updates)
            if (message.type === 'negotiation' && message.status === 'active') {
              const newModules = new Map(modules)
              Object.entries(message.data).forEach(([moduleId, moduleData]) => {
                newModules.set(moduleId, moduleData as CommsModule)
              })
              setModules(newModules)
            }

            // Handle control responses
            if (message.type === 'control_response') {
              if (message.status === 'error') {
                setError(`Control error: ${message.data.error || 'Unknown error'}`)
              }
            }

            // Handle config responses
            if (message.type === 'config_response') {
              if (message.status === 'error') {
                setError(`Config error: ${message.data.error || 'Unknown error'}`)
              }
            }
          } catch (error) {
            console.error('Failed to parse message:', error)
            setError('Failed to parse message from StreamHandler')
          }
        }

        ws.onerror = (event) => {
          console.error('WebSocket error:', event)
          setError('WebSocket error occurred')
        }

        setSocket(ws)
      } catch (error) {
        console.error('Failed to connect:', error)
        setError('Failed to connect to StreamHandler')
      }
    }

    connect()

    return () => {
      if (socket) {
        socket.close()
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
      }
    }
  }, [url])

  // Send control command
  const sendCommand = useCallback((moduleId: string, command: ControlMessage['command']) => {
    if (socket?.readyState === WebSocket.OPEN) {
      const message: CommsMessage = {
        type: 'control',
        status: 'active',
        data: {
          module_id: moduleId,
          command: command
        },
        'msg-sent-timestamp': new Date().toISOString()
      }
      socket.send(JSON.stringify(message))
    } else {
      setError('Cannot send command: Not connected to StreamHandler')
    }
  }, [socket])

  // Update module configuration
  const updateConfig = useCallback((moduleId: string, config: ConfigUpdateMessage['config']) => {
    if (socket?.readyState === WebSocket.OPEN) {
      const message: CommsMessage = {
        type: 'config_update',
        status: 'active',
        data: {
          module_id: moduleId,
          config: config
        },
        'msg-sent-timestamp': new Date().toISOString()
      }
      socket.send(JSON.stringify(message))
    } else {
      setError('Cannot update config: Not connected to StreamHandler')
    }
  }, [socket])

  // Get a specific module
  const getModule = useCallback((moduleId: string): CommsModule | undefined => {
    return modules.get(moduleId)
  }, [modules])

  // Get a specific stream
  const getStream = useCallback((moduleId: string, streamId: string) => {
    const module = modules.get(moduleId)
    return module?.streams[streamId]
  }, [modules])

  return {
    isConnected,
    modules,
    lastMessage,
    error,
    sendCommand,
    updateConfig,
    getModule,
    getStream
  }
} 