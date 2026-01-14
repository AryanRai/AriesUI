import { useState, useEffect, useCallback } from 'react'
import { commsClient, type StreamMapping } from '@/lib/comms-stream-client'

export interface StreamData {
  value: any
  metadata: any
  timestamp: string
  unit: string
  datatype: 'float' | 'int' | 'string' | 'bool'
  status: 'active' | 'inactive' | 'error'
}

export interface UseCommsStreamResult {
  data: StreamData | null
  isConnected: boolean
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error'
  error: string | null
  subscribe: (streamId: string) => void
  unsubscribe: () => void
  sendControl: (moduleId: string, command: string, value: any) => void
}

/**
 * Hook for subscribing to hardware streams from the Comms backend
 * @param streamId - The stream ID to subscribe to (e.g., "module1.temperature")
 * @param autoConnect - Whether to automatically connect to the backend
 */
export function useCommsStream(streamId?: string, autoConnect = true): UseCommsStreamResult {
  const [data, setData] = useState<StreamData | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')
  const [error, setError] = useState<string | null>(null)
  const [currentStreamId, setCurrentStreamId] = useState<string | undefined>(streamId)

  // Handle connection status changes
  useEffect(() => {
    const handleConnection = (connected: boolean) => {
      setIsConnected(connected)
      setConnectionStatus(commsClient.status)
      if (!connected) {
        setError('Connection lost')
      } else {
        setError(null)
      }
    }

    commsClient.onConnection(handleConnection)
    return () => commsClient.offConnection(handleConnection)
  }, [])

  // Handle stream data updates
  useEffect(() => {
    if (!currentStreamId) return

    const handleStreamData = (value: any, metadata: any) => {
      setData({
        value,
        metadata,
        timestamp: new Date().toISOString(),
        unit: metadata?.unit || '',
        datatype: metadata?.datatype || 'float',
        status: 'active'
      })
      setError(null)
    }

    commsClient.subscribeToStream(currentStreamId, handleStreamData)
    
    // Get current value if available
    const currentData = commsClient.getStreamValue(currentStreamId)
    if (currentData) {
      setData({
        value: currentData.value,
        metadata: currentData.metadata,
        timestamp: currentData.timestamp,
        unit: currentData.unit,
        datatype: currentData.datatype,
        status: 'active'
      })
    }

    return () => {
      commsClient.unsubscribeFromStream(currentStreamId, handleStreamData)
    }
  }, [currentStreamId])

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && !commsClient.isConnected) {
      commsClient.connect().catch(err => {
        setError(`Failed to connect: ${err.message}`)
        setConnectionStatus('error')
      })
    }
  }, [autoConnect])

  const subscribe = useCallback((streamId: string) => {
    setCurrentStreamId(streamId)
  }, [])

  const unsubscribe = useCallback(() => {
    setCurrentStreamId(undefined)
    setData(null)
  }, [])

  const sendControl = useCallback((moduleId: string, command: string, value: any) => {
    if (!isConnected) {
      setError('Not connected to backend')
      return
    }
    
    try {
      commsClient.sendControlCommand(moduleId, command, value)
    } catch (err) {
      setError(`Control command failed: ${err}`)
    }
  }, [isConnected])

  return {
    data,
    isConnected,
    connectionStatus,
    error,
    subscribe,
    unsubscribe,
    sendControl
  }
}

/**
 * Hook for managing multiple stream subscriptions
 * @param streamIds - Array of stream IDs to subscribe to
 * @param autoConnect - Whether to automatically connect to the backend
 */
export function useMultipleCommsStreams(streamIds: string[] = [], autoConnect = true) {
  const [streamData, setStreamData] = useState<Map<string, StreamData>>(new Map())
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')
  const [error, setError] = useState<string | null>(null)

  // Handle connection status changes
  useEffect(() => {
    const handleConnection = (connected: boolean) => {
      setIsConnected(connected)
      setConnectionStatus(commsClient.status)
      if (!connected) {
        setError('Connection lost')
      } else {
        setError(null)
      }
    }

    commsClient.onConnection(handleConnection)
    return () => commsClient.offConnection(handleConnection)
  }, [])

  // Handle multiple stream subscriptions
  useEffect(() => {
    const callbacks = new Map<string, (value: any, metadata: any) => void>()

    streamIds.forEach(streamId => {
      const callback = (value: any, metadata: any) => {
        setStreamData(prev => {
          const newData = new Map(prev)
          newData.set(streamId, {
            value,
            metadata,
            timestamp: new Date().toISOString(),
            unit: metadata?.unit || '',
            datatype: metadata?.datatype || 'float',
            status: 'active'
          })
          return newData
        })
      }

      callbacks.set(streamId, callback)
      commsClient.subscribeToStream(streamId, callback)

      // Get current value if available
      const currentData = commsClient.getStreamValue(streamId)
      if (currentData) {
        setStreamData(prev => {
          const newData = new Map(prev)
          newData.set(streamId, {
            value: currentData.value,
            metadata: currentData.metadata,
            timestamp: currentData.timestamp,
            unit: currentData.unit,
            datatype: currentData.datatype,
            status: 'active'
          })
          return newData
        })
      }
    })

    return () => {
      callbacks.forEach((callback, streamId) => {
        commsClient.unsubscribeFromStream(streamId, callback)
      })
    }
  }, [streamIds])

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && !commsClient.isConnected) {
      commsClient.connect().catch(err => {
        setError(`Failed to connect: ${err.message}`)
        setConnectionStatus('error')
      })
    }
  }, [autoConnect])

  const sendControl = useCallback((moduleId: string, command: string, value: any) => {
    if (!isConnected) {
      setError('Not connected to backend')
      return
    }
    
    try {
      commsClient.sendControlCommand(moduleId, command, value)
    } catch (err) {
      setError(`Control command failed: ${err}`)
    }
  }, [isConnected])

  return {
    streamData,
    isConnected,
    connectionStatus,
    error,
    sendControl
  }
}

/**
 * Hook for getting all available streams from the backend
 */
export function useAvailableStreams() {
  const [availableStreams, setAvailableStreams] = useState<string[]>([])
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const handleConnection = (connected: boolean) => {
      setIsConnected(connected)
      if (connected) {
        // Update available streams when connected
        const streams = commsClient.getAllStreams()
        setAvailableStreams(streams)
      }
    }

    commsClient.onConnection(handleConnection)
    
    // Get initial streams if already connected
    if (commsClient.isConnected) {
      setIsConnected(true)
      setAvailableStreams(commsClient.getAllStreams())
    }
    
    return () => commsClient.offConnection(handleConnection)
  }, [])

  // Listen for new streams via negotiation messages
  useEffect(() => {
    const handleMessage = (message: any) => {
      if (message.type === 'negotiation') {
        // Small delay to allow client to process the message first
        setTimeout(() => {
          const streams = commsClient.getAllStreams()
          setAvailableStreams(streams)
          console.log('📡 Available streams updated:', streams)
        }, 100)
      }
    }

    commsClient.onMessage(handleMessage)
    return () => commsClient.offMessage(handleMessage)
  }, [])

  return {
    availableStreams,
    isConnected
  }
} 