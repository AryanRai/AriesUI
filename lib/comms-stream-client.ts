// CommsStreamClient - WebSocket client for connecting to Comms backend
// Handles connection to StreamHandler and Engine with automatic reconnection

export interface CommsMessage {
  type: 'negotiation' | 'stream_update' | 'control' | 'status' | 'error'
  status: 'active' | 'inactive' | 'error' | 'connecting'
  data: {
    [moduleId: string]: {
      name: string
      status: 'active' | 'inactive' | 'error'
      config: {
        update_rate: number
        enabled_streams: string[]
        debug_mode: boolean
      }
      streams: {
        [streamId: string]: {
          stream_id: number
          name: string
          datatype: 'float' | 'int' | 'string' | 'bool'
          unit: string
          status: 'active' | 'inactive' | 'error'
          metadata: {
            sensor?: string
            precision?: number
            location?: string
            [key: string]: any
          }
          value: any
          priority: 'high' | 'medium' | 'low'
          timestamp?: string
        }
      }
    }
  }
  'msg-sent-timestamp': string
}

export interface StreamMapping {
  id: string
  streamId: string
  streamName: string
  moduleId: string
  multiplier: number
  formula?: string
  unit: string
  enabled: boolean
  lastValue?: any
  lastUpdate?: string
  status: 'active' | 'inactive' | 'error'
}

export class CommsStreamClient {
  private ws: WebSocket | null = null
  private url: string
  private reconnectAttempts = 0
  private maxReconnectAttempts = 10
  private reconnectDelay = 1000
  private isConnecting = false
  private connectionListeners: Set<(connected: boolean) => void> = new Set()
  private messageListeners: Set<(message: CommsMessage) => void> = new Set()
  private streamListeners: Map<string, Set<(value: any, metadata: any) => void>> = new Map()
  private streamMappings: Map<string, StreamMapping> = new Map()
  private latestData: Map<string, any> = new Map()
  private connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected'

  constructor(url: string = 'ws://localhost:8000') {
    this.url = url
  }

  // Connection Management
  async connect(): Promise<boolean> {
    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) {
      return true
    }

    this.isConnecting = true
    this.connectionStatus = 'connecting'
    this.notifyConnectionListeners(false)

    try {
      this.ws = new WebSocket(this.url)
      
      this.ws.onopen = () => {
        console.log('✅ Connected to Comms StreamHandler')
        this.isConnecting = false
        this.reconnectAttempts = 0
        this.connectionStatus = 'connected'
        this.notifyConnectionListeners(true)
        
        // Request initial negotiation
        this.send({
          type: 'negotiation',
          status: 'active',
          data: {},
          'msg-sent-timestamp': new Date().toISOString()
        })
      }

      this.ws.onmessage = (event) => {
        try {
          const message: CommsMessage = JSON.parse(event.data)
          this.handleMessage(message)
        } catch (error) {
          console.error('Failed to parse message:', error)
        }
      }

      this.ws.onclose = () => {
        console.log('❌ Disconnected from Comms StreamHandler')
        this.isConnecting = false
        this.connectionStatus = 'disconnected'
        this.notifyConnectionListeners(false)
        this.scheduleReconnect()
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        this.connectionStatus = 'error'
        this.isConnecting = false
        this.notifyConnectionListeners(false)
      }

      return true
    } catch (error) {
      console.error('Failed to connect:', error)
      this.isConnecting = false
      this.connectionStatus = 'error'
      this.notifyConnectionListeners(false)
      return false
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.connectionStatus = 'disconnected'
    this.notifyConnectionListeners(false)
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts)
      console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`)
      
      setTimeout(() => {
        this.reconnectAttempts++
        this.connect()
      }, delay)
    } else {
      console.error('❌ Max reconnection attempts reached')
      this.connectionStatus = 'error'
    }
  }

  // Message Handling
  private handleMessage(message: CommsMessage) {
    // Notify all message listeners
    this.messageListeners.forEach(listener => listener(message))

    // Handle different message types
    switch (message.type) {
      case 'negotiation':
        this.handleNegotiation(message)
        break
      case 'stream_update':
        this.handleStreamUpdate(message)
        break
      case 'status':
        this.handleStatus(message)
        break
      case 'error':
        this.handleError(message)
        break
    }
  }

  private handleNegotiation(message: CommsMessage) {
    // Update available streams from negotiation
    Object.entries(message.data).forEach(([moduleId, moduleData]) => {
      Object.entries(moduleData.streams).forEach(([streamId, streamData]) => {
        const fullStreamId = `${moduleId}.${streamId}`
        this.latestData.set(fullStreamId, {
          value: streamData.value,
          metadata: streamData.metadata,
          timestamp: message['msg-sent-timestamp'],
          unit: streamData.unit,
          datatype: streamData.datatype
        })
      })
    })
  }

  private handleStreamUpdate(message: CommsMessage) {
    // Update stream values and notify listeners
    Object.entries(message.data).forEach(([moduleId, moduleData]) => {
      Object.entries(moduleData.streams).forEach(([streamId, streamData]) => {
        const fullStreamId = `${moduleId}.${streamId}`
        const streamValue = {
          value: streamData.value,
          metadata: streamData.metadata,
          timestamp: message['msg-sent-timestamp'],
          unit: streamData.unit,
          datatype: streamData.datatype
        }
        
        this.latestData.set(fullStreamId, streamValue)
        
        // Notify stream-specific listeners
        const listeners = this.streamListeners.get(fullStreamId)
        if (listeners) {
          listeners.forEach(listener => listener(streamData.value, streamData.metadata))
        }
      })
    })
  }

  private handleStatus(message: CommsMessage) {
    console.log('📊 Status update:', message.data)
  }

  private handleError(message: CommsMessage) {
    console.error('❌ Backend error:', message.data)
  }

  // Stream Management
  subscribeToStream(streamId: string, callback: (value: any, metadata: any) => void) {
    if (!this.streamListeners.has(streamId)) {
      this.streamListeners.set(streamId, new Set())
    }
    this.streamListeners.get(streamId)!.add(callback)

    // Send current value if available
    const currentData = this.latestData.get(streamId)
    if (currentData) {
      callback(currentData.value, currentData.metadata)
    }
  }

  unsubscribeFromStream(streamId: string, callback: (value: any, metadata: any) => void) {
    const listeners = this.streamListeners.get(streamId)
    if (listeners) {
      listeners.delete(callback)
      if (listeners.size === 0) {
        this.streamListeners.delete(streamId)
      }
    }
  }

  getStreamValue(streamId: string) {
    return this.latestData.get(streamId)
  }

  getAllStreams() {
    return Array.from(this.latestData.keys())
  }

  // Control Commands
  sendControlCommand(moduleId: string, command: string, value: any) {
    this.send({
      type: 'control',
      status: 'active',
      data: {
        [moduleId]: {
          command,
          value,
          timestamp: new Date().toISOString()
        }
      },
      'msg-sent-timestamp': new Date().toISOString()
    })
  }

  // Event Listeners
  onConnection(callback: (connected: boolean) => void) {
    this.connectionListeners.add(callback)
    // Send current status
    callback(this.connectionStatus === 'connected')
  }

  offConnection(callback: (connected: boolean) => void) {
    this.connectionListeners.delete(callback)
  }

  onMessage(callback: (message: CommsMessage) => void) {
    this.messageListeners.add(callback)
  }

  offMessage(callback: (message: CommsMessage) => void) {
    this.messageListeners.delete(callback)
  }

  private notifyConnectionListeners(connected: boolean) {
    this.connectionListeners.forEach(listener => listener(connected))
  }

  private send(message: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket not connected, message not sent:', message)
    }
  }

  // Getters
  get isConnected() {
    return this.connectionStatus === 'connected'
  }

  get status() {
    return this.connectionStatus
  }
}

// Global instance
export const commsClient = new CommsStreamClient() 