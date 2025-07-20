import { useState, useEffect, useCallback } from 'react'
import { CommsMessage, CommsModule, ControlMessage, ConfigUpdateMessage } from '@/types/comms'

export function useCommsSocket(target: 'sh' | 'en' = 'sh', url: string = 'ws://localhost:3000') {
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [modules, setModules] = useState<Map<string, CommsModule>>(new Map())
  const [lastMessage, setLastMessage] = useState<CommsMessage | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [latency, setLatency] = useState<number>(0)
  const [lastPingSent, setLastPingSent] = useState<number>(0)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected')

  // Connect to WebSocket
  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(url)

      ws.onopen = () => {
        console.log(`Connected to ${target.toUpperCase()} at ${url}`)
        setIsConnected(true)
        setConnectionStatus('connected')
        setError(null)
        // Send initial ping
        sendPing(ws)
      }

      ws.onclose = () => {
        console.log(`Disconnected from ${target.toUpperCase()}`)
        setIsConnected(false)
        setConnectionStatus('disconnected')
        // Attempt reconnection after 5 seconds
        setTimeout(() => {
          setConnectionStatus('reconnecting')
          connect()
        }, 5000)
      }

      ws.onerror = (event) => {
        console.error(`WebSocket error for ${target.toUpperCase()}:`, event)
        setError('Connection error')
      }

      ws.onmessage = (event) => {
        try {
          const message: CommsMessage = JSON.parse(event.data)
          setLastMessage(message)

          // Handle different message types
          switch (message.type) {
            case 'negotiation':
              const newModules = new Map<string, CommsModule>()
              Object.entries(message.data).forEach(([moduleId, moduleData]) => {
                newModules.set(moduleId, moduleData as CommsModule)
              })
              setModules(newModules)
              break

            case 'pong': {
              // Only use pong replies that correspond to the last ping we sent.
              if (message.target === target) {
                const tsNum = Number(message.timestamp)
                if (!isNaN(tsNum)) {
                  const nowPerf = performance.now()
                  if (tsNum <= nowPerf) {
                    setLatency(Math.abs(Math.round(nowPerf - tsNum)))
                  }
                }
              }
              break
            }

            case 'connection_info':
              // Update connection info
              if (message.data) {
                setLatency(message.data.latency || 0)
                setConnectionStatus(message.data.status || 'connected')
              }
              break
          }
        } catch (error) {
          console.error(`Failed to parse message from ${target.toUpperCase()}:`, error)
        }
      }

      setSocket(ws)
    } catch (error) {
      console.error(`Failed to connect to ${target.toUpperCase()}:`, error)
      setError('Failed to connect')
      setConnectionStatus('disconnected')
    }
  }, [url, target])

  // Send ping message
  const sendPing = useCallback((ws: WebSocket) => {
    if (ws.readyState === WebSocket.OPEN) {
      const timestampNum = performance.now()
      const timestamp = timestampNum.toString()
      ws.send(JSON.stringify({
        type: 'ping',
        timestamp,
        target,
        status: 'active',
        'msg-sent-timestamp': new Date().toISOString()
      }))
      setLastPingSent(timestampNum)
    }
  }, [target])

  // Reconnect function
  const reconnect = useCallback(() => {
    if (socket) {
      socket.close()
    }
    setConnectionStatus('reconnecting')
    connect()
  }, [socket, connect])

  // Send command to backend
  const sendCommand = useCallback((moduleId: string, command: any) => {
    if (socket?.readyState === WebSocket.OPEN) {
      const message = {
        type: 'control',
        status: 'active',
        module_id: moduleId,
        command,
        'msg-sent-timestamp': new Date().toISOString()
      } as unknown as ControlMessage
      socket.send(JSON.stringify(message))
    } else {
      setError('Not connected')
    }
  }, [socket])

  // Initial connection
  useEffect(() => {
    connect()
    return () => {
      if (socket) {
        socket.close()
      }
    }
  }, [connect])

  // Send periodic pings
  useEffect(() => {
    if (!socket) return

    const pingInterval = setInterval(() => {
      sendPing(socket)
    }, 1000) // Send ping every second

    return () => clearInterval(pingInterval)
  }, [socket, sendPing])

  // Update module configuration
  const updateConfig = useCallback((moduleId: string, config: ConfigUpdateMessage['config']) => {
    if (socket?.readyState === WebSocket.OPEN) {
      const message = {
        type: 'config_update',
        status: 'active',
        module_id: moduleId,
        config,
        'msg-sent-timestamp': new Date().toISOString()
      } as unknown as ConfigUpdateMessage
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
    connectionStatus,
    modules,
    lastMessage,
    error,
    latency,
    reconnect,
    sendCommand,
    updateConfig,
    getModule,
    getStream
  }
} 