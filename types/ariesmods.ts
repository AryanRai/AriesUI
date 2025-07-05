// AriesMods Plugin System Types

export type AriesModData = Record<string, any>

// Stream mapping configuration for hardware integration
export interface StreamMapping {
  id: string
  streamId: string
  streamName: string
  multiplier: number
  formula: string
  unit: string
  enabled: boolean
}

export interface AriesModProps {
  id: string
  title: string
  width: number
  height: number
  data: AriesModData
  config: Record<string, any>
  onConfigChange: (config: Record<string, any>) => void
  onDataRequest?: (params: any) => void
}

export interface AriesModMetadata {
  id: string
  name: string
  displayName: string
  description: string
  version: string
  author: string
  category: 'sensors' | 'controls' | 'visualization' | 'utility' | 'custom'
  icon?: string
  defaultWidth: number
  defaultHeight: number
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
  configSchema?: Record<string, any>
  tags?: string[]
  
  // Dependency management (optional)
  manifest?: any // Will be typed as AriesModManifest when imported
  permissions?: string[]
  dependencies?: any[] // Will be typed as DependencyManifest[] when imported
}

export interface AriesMod {
  metadata: AriesModMetadata
  component: React.ComponentType<AriesModProps>
  generateDummyData?: () => AriesModData
  validateConfig?: (config: Record<string, any>) => boolean
}

export interface AriesModRegistry {
  [key: string]: AriesMod
}

// Widget type that includes AriesMod selection
export interface AriesWidget {
  id: string
  type: 'ariesmods' // Fixed type for AriesMods widgets
  ariesModType: string // The selected AriesMod type
  title: string
  x: number
  y: number
  w: number
  h: number
  config: Record<string, any>
  data?: AriesModData
  streamMappings?: StreamMapping[]
  createdAt: string
  updatedAt: string
}

// Nested AriesWidget type for widgets inside nest containers
export interface NestedAriesWidget extends AriesWidget {
  nestId: string
}

// Default AriesMod categories for organization
export const ARIESMODS_CATEGORIES = {
  sensors: {
    label: 'Sensors',
    icon: '📊',
    description: 'Temperature, pressure, humidity sensors'
  },
  controls: {
    label: 'Controls',
    icon: '🎛️',
    description: 'Switches, sliders, buttons'
  },
  visualization: {
    label: 'Visualization',
    icon: '📈',
    description: 'Charts, graphs, displays'
  },
  utility: {
    label: 'Utilities',
    icon: '🔧',
    description: 'Clocks, calculators, converters'
  },
  custom: {
    label: 'Custom',
    icon: '⚡',
    description: 'User-created widgets'
  }
} as const

export type AriesModCategory = keyof typeof ARIESMODS_CATEGORIES 