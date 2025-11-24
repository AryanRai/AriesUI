// CommsStreamClient - WebSocket client for connecting to Comms backend
// Handles connection to StreamHandler and Engine with automatic reconnection

// MessageBatcher - Batches stream updates to reduce re-render storms
class MessageBatcher {
  private queue: Map<string, any> = new Map()
  private rafId: number | null = null
  private callbacks: Set<(batch: Map<string, any>) => void> = new Set()
  private enabled: boolean = true

  constructor(enabled: boolean = true) {
    this.enabled = enabled
  }

  add(streamId: string, data: any) {
    if (!this.enabled) {
      // If batching disabled, notify immediately
      const batch = new Map([[streamId, data]])
      this.callbacks.forEach(cb => cb(batch))
      return
    }

    this.queue.set(streamId, data)
    this.scheduleFlush()
  }

  private scheduleFlush() {
    if (this.rafId !== null) return
    
    this.rafId = requestAnimationFrame(() => {
      this.flush()
      this.rafId = null
    })
  }

  private flush() {
    if (this.queue.size === 0) return
    
    const batch = new Map(this.queue)
    this.queue.clear()
    
    this.callbacks.forEach(cb => cb(batch))
  }

  onFlush(callback: (batch: Map<string, any>) => void) {
    this.callbacks.add(callback)
    return () => this.callbacks.delete(callback)
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
    // If disabling while there are queued items, flush them
    if (!enabled && this.queue.size > 0) {
      if (this.rafId !== null) {
        cancelAnimationFrame(this.rafId)
        this.rafId = null
      }
      this.flush()
    }
  }

  destroy() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    this.queue.clear()
    this.callbacks.clear()
  }
}

export interface CommsMessage {
  type: 'negotiation' | 'stream_update' | 'control' | 'status' | 'error' | 'physics_simulation' | 'ping' | 'pong' | 'query' | 'active_streams'
  status?: 'active' | 'inactive' | 'error' | 'connecting'
  data?: {
    [streamId: string]: {
      stream_id: string
      name: string
      datatype: 'float' | 'int' | 'string' | 'bool' | 'vector2' | 'vector3'
      unit: string
      value: any
      vector_value?: number[]
      status: 'active' | 'inactive' | 'error'
      timestamp: string
      simulation_id?: string
      metadata?: {
        sensor?: string
        precision?: number
        location?: string
        [key: string]: any
      }
    }
  }
  // Query fields
  query_type?: string
  // Physics simulation specific fields
  action?: string
  simulation_id?: string
  stream_id?: string
  command?: string
  params?: any
  // Ping/pong fields
  timestamp?: number
  target?: string
  server_time?: number
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

export interface CommsStreamClientConfig {
  url?: string
  enableBatching?: boolean
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
  private batcher: MessageBatcher
  private enableBatching: boolean

  constructor(config?: CommsStreamClientConfig | string) {
    // Support both old (string url) and new (config object) constructor signatures
    if (typeof config === 'string') {
      this.url = config
      this.enableBatching = true
    } else {
      this.url = config?.url || 'ws://localhost:3000'
      this.enableBatching = config?.enableBatching !== undefined ? config.enableBatching : true
    }
    
    this.batcher = new MessageBatcher(this.enableBatching)
    this.setupBatcher()
  }

  private setupBatcher() {
    this.batcher.onFlush((batch) => {
      batch.forEach((data, streamId) => {
        this.latestData.set(streamId, data)
        
        // Notify stream-specific listeners
        const listeners = this.streamListeners.get(streamId)
        if (listeners) {
          listeners.forEach(listener => listener(data.value, data.metadata || {}))
        }
      })
    })
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
        
        // Request initial stream data
        this.send({
          type: 'query',
          query_type: 'active_streams',
          status: 'active',
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
    this.batcher.destroy()
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
      case 'active_streams':
        this.handleActiveStreams(message)
        break
      case 'stream_update':
        this.handleStreamUpdate(message)
        break
      case 'physics_simulation':
        this.handlePhysicsSimulation(message)
        break
      case 'ping':
        this.handlePing(message)
        break
      case 'pong':
        this.handlePong(message)
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
    // Handle the unified stream format from stream handler v3.0
    if (message.data) {
      Object.entries(message.data).forEach(([streamId, streamData]) => {
        const streamValue = {
          value: streamData.value,
          vector_value: streamData.vector_value,
          metadata: streamData.metadata || {},
          timestamp: streamData.timestamp || message['msg-sent-timestamp'],
          unit: streamData.unit,
          datatype: streamData.datatype,
          simulation_id: streamData.simulation_id
        }
        
        // Use batcher to batch updates
        this.batcher.add(streamId, streamValue)
      })
      
      console.log(`📡 Updated ${Object.keys(message.data).length} streams from negotiation`)
    }
  }

  private handleActiveStreams(message: CommsMessage) {
    // Handle active_streams response from stream handler
    console.log('📡 Received active streams:', message.data)
    
    if (message.data) {
      Object.entries(message.data).forEach(([streamId, streamData]) => {
        const streamValue = {
          value: streamData.value,
          vector_value: streamData.vector_value,
          metadata: streamData.metadata || {},
          timestamp: streamData.timestamp || message['msg-sent-timestamp'],
          unit: streamData.unit,
          datatype: streamData.datatype,
          simulation_id: streamData.simulation_id
        }
        
        // Use batcher to batch updates
        this.batcher.add(streamId, streamValue)
      })
      
      console.log(`📡 Loaded ${Object.keys(message.data).length} active streams`)
    }
  }

  private handleStreamUpdate(message: CommsMessage) {
    // Handle the unified stream format from stream handler v3.0
    if (message.data) {
      Object.entries(message.data).forEach(([streamId, streamData]) => {
        const streamValue = {
          value: streamData.value,
          vector_value: streamData.vector_value,
          metadata: streamData.metadata || {},
          timestamp: streamData.timestamp || message['msg-sent-timestamp'],
          unit: streamData.unit,
          datatype: streamData.datatype,
          simulation_id: streamData.simulation_id
        }
        
        // Use batcher to batch updates
        this.batcher.add(streamId, streamValue)
      })
      
      console.log(`📡 Updated ${Object.keys(message.data).length} streams`)
    }
  }

  private handlePhysicsSimulation(message: CommsMessage) {
    console.log('🔬 Physics simulation message:', message.action, message.simulation_id)
    
    // Handle physics simulation updates as stream updates
    if (message.action === 'updated' && message.stream_id && message.data) {
      const streamId = `${message.simulation_id}_${message.stream_id}`
      const streamValue = {
        value: message.data.value,
        vector_value: message.data.vector_value,
        metadata: message.data.metadata || {},
        timestamp: message.data.timestamp || message['msg-sent-timestamp'],
        unit: message.data.unit || '',
        datatype: message.data.datatype || 'float',
        simulation_id: message.simulation_id
      }
      
      // Use batcher to batch updates
      this.batcher.add(streamId, streamValue)
    }
  }

  private handlePing(message: CommsMessage) {
    // Respond to ping with pong
    if (message.target === 'ui' || !message.target) {
      this.send({
        type: 'pong',
        timestamp: message.timestamp,
        target: 'sh',
        status: 'active',
        'msg-sent-timestamp': new Date().toISOString()
      })
    }
  }

  private handlePong(message: CommsMessage) {
    // Handle pong response (for latency measurement)
    if (message.timestamp) {
      const latency = Date.now() - (message.timestamp * 1000)
      console.log(`🏓 Pong received, latency: ${latency}ms`)
    }
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

  // Physics Simulation Commands
  sendPhysicsCommand(simulationId: string, command: string, params: any = {}) {
    this.send({
      type: 'physics_simulation',
      action: 'control',
      simulation_id: simulationId,
      command,
      params,
      'msg-sent-timestamp': new Date().toISOString()
    })
  }

  // Send custom message
  sendMessage(message: any) {
    this.send(message)
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

  // Batching control
  setBatchingEnabled(enabled: boolean) {
    this.enableBatching = enabled
    this.batcher.setEnabled(enabled)
  }

  isBatchingEnabled() {
    return this.enableBatching
  }
}

// Global instance
export const commsClient = new CommsStreamClient() 