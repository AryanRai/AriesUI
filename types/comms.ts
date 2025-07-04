// Message types matching your existing StreamHandler format
export interface CommsMessage {
  type: 'negotiation' | 'control' | 'control_response' | 'config_update' | 'config_response'
  status: 'active' | 'inactive' | 'error' | 'forwarded'
  data: { [moduleId: string]: any }
  'msg-sent-timestamp': string
}

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