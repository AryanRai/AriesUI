// Message types matching your existing StreamHandler format
export type CommsMessageType = 
  | 'negotiation' 
  | 'control' 
  | 'control_response' 
  | 'config_update' 
  | 'config_response'
  | 'ping'
  | 'pong'
  | 'connection_info'

export interface BaseCommsMessage {
  type: CommsMessageType
  status: 'active' | 'inactive' | 'error' | 'forwarded'
  'msg-sent-timestamp': string
}

export interface NegotiationMessage extends BaseCommsMessage {
  type: 'negotiation'
  data: { [moduleId: string]: CommsModule }
}

export interface ControlMessage extends BaseCommsMessage {
  type: 'control'
  data: {
    module_id: string
    command: any
  }
}

export interface ControlResponseMessage extends BaseCommsMessage {
  type: 'control_response'
  data: { error?: string }
}

export interface ConfigUpdateMessage extends BaseCommsMessage {
  type: 'config_update'
  data: {
    module_id: string
    config: any
  }
}

export interface ConfigResponseMessage extends BaseCommsMessage {
  type: 'config_response'
  data: { error?: string }
}

export interface PingMessage extends BaseCommsMessage {
  type: 'ping'
  timestamp: string
  target: 'sh' | 'en'
}

export interface PongMessage extends BaseCommsMessage {
  type: 'pong'
  timestamp: string
  target: 'sh' | 'en'
  server_time: number
}

export interface ConnectionInfoMessage extends BaseCommsMessage {
  type: 'connection_info'
  data: {
    latency: number
    status: 'connected' | 'disconnected' | 'reconnecting'
    last_ping: number
    last_pong: number
  }
}

export type CommsMessage = 
  | NegotiationMessage 
  | ControlMessage 
  | ControlResponseMessage 
  | ConfigUpdateMessage 
  | ConfigResponseMessage
  | PingMessage
  | PongMessage
  | ConnectionInfoMessage

// Module structure matching your Engine's format
export interface CommsModule {
  module_id: string
  name: string
  status: 'active' | 'inactive' | 'error'
  'module-update-timestamp': string
  config: {
    update_rate: number
    enabled_streams: string[]
    debug_mode: boolean
    [key: string]: any
  }
  streams: { [streamId: string]: CommsStream }
}

// Stream structure matching your Engine's Stream class
export interface CommsStream {
  stream_id: number
  name: string
  datatype: string
  unit?: string
  status: 'active' | 'inactive' | 'error'
  metadata: {
    sensor?: string
    precision?: number
    location?: string
    [key: string]: any
  }
  value: any
  'stream-update-timestamp': string
  priority: 'high' | 'medium' | 'low'
}

// Control message format
export interface ControlMessage {
  module_id: string
  command: {
    stream_id: string
    value: any
    [key: string]: any
  }
}

// Config update message format
export interface ConfigUpdateMessage {
  module_id: string
  config: {
    update_rate?: number
    enabled_streams?: string[]
    debug_mode?: boolean
    [key: string]: any
  }
} 