import React, { useState, useEffect } from 'react'
import type { AriesMod, AriesModProps, AriesModData } from '@/types/ariesmods'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Package } from 'lucide-react'
import { 
  loadAriesModDependencies, 
  createAriesModManifest,
  type DependencyManifest,
  type AriesModManifest 
} from '@/lib/ariesmods-dependency-manager'

// Define the dependencies your AriesMod needs
const MANIFEST: AriesModManifest = createAriesModManifest(
  'advanced-template',
  'Advanced Template',
  '1.0.0',
  'Your Name',
  [
    // Pre-approved dependencies (already bundled)
    { name: 'react', version: '19.x', source: 'npm', required: true, scope: 'global' },
    { name: 'date-fns', version: '4.x', source: 'npm', required: false, scope: 'global' },
    
    // CDN dependencies (loaded dynamically)
    { name: 'd3', version: '7.x', source: 'cdn', required: false, scope: 'isolated' },
    { name: 'chart.js', version: '4.x', source: 'cdn', required: false, scope: 'isolated' },
  ],
  ['network'] // Permissions your AriesMod needs
)

export interface AdvancedAriesModConfig {
  title: string
  dataVisualization: 'internal' | 'd3' | 'chartjs'
  showDateTime: boolean
  enableAdvancedFeatures: boolean
}

const defaultConfig: AdvancedAriesModConfig = {
  title: 'Advanced AriesMod',
  dataVisualization: 'internal',
  showDateTime: true,
  enableAdvancedFeatures: false
}

const AdvancedAriesMod: React.FC<AriesModProps> = ({ 
  id, 
  title, 
  width, 
  height, 
  data, 
  config, 
  onConfigChange,
  onDataRequest 
}) => {
  const modConfig = { ...defaultConfig, ...config } as AdvancedAriesModConfig
  const [dependencies, setDependencies] = useState<Record<string, any>>({})
  const [loadingDeps, setLoadingDeps] = useState(true)
  const [depError, setDepError] = useState<string | null>(null)

  // Load dependencies on mount
  useEffect(() => {
    const loadDeps = async () => {
      try {
        setLoadingDeps(true)
        setDepError(null)
        
        const deps = await loadAriesModDependencies(MANIFEST)
        setDependencies(deps)
        
        console.log('Loaded dependencies:', Object.keys(deps))
      } catch (error) {
        console.error('Failed to load dependencies:', error)
        setDepError(error instanceof Error ? error.message : 'Unknown error')
      } finally {
        setLoadingDeps(false)
      }
    }

    loadDeps()
  }, [])

  // Handle data requests
  useEffect(() => {
    if (onDataRequest) {
      const interval = setInterval(() => {
        onDataRequest({ 
          type: 'advanced-data', 
          timestamp: new Date().toISOString(),
          features: modConfig.enableAdvancedFeatures ? ['real-time', 'advanced'] : ['basic']
        })
      }, 2000)
      
      return () => clearInterval(interval)
    }
  }, [onDataRequest, modConfig.enableAdvancedFeatures])

  // Render D3 visualization (example)
  const renderD3Visualization = () => {
    const d3 = dependencies['d3']
    if (!d3) return <div className="text-xs text-muted-foreground">D3.js not available</div>
    
    return (
      <div className="text-xs space-y-1">
        <div className="font-medium">D3.js Visualization</div>
        <div className="text-muted-foreground">
          D3 version: {d3.version || 'Unknown'}
        </div>
        <div className="bg-blue-100 h-8 rounded flex items-center justify-center">
          <span className="text-blue-700 text-xs">D3 Chart Area</span>
        </div>
      </div>
    )
  }

  // Render Chart.js visualization (example)
  const renderChartJsVisualization = () => {
    const Chart = dependencies['chart.js']
    if (!Chart) return <div className="text-xs text-muted-foreground">Chart.js not available</div>
    
    return (
      <div className="text-xs space-y-1">
        <div className="font-medium">Chart.js Visualization</div>
        <div className="text-muted-foreground">
          Chart.js version: {Chart.version || 'Unknown'}
        </div>
        <div className="bg-green-100 h-8 rounded flex items-center justify-center">
          <span className="text-green-700 text-xs">Chart.js Canvas</span>
        </div>
      </div>
    )
  }

  // Render internal visualization
  const renderInternalVisualization = () => {
    return (
      <div className="text-xs space-y-1">
        <div className="font-medium">Internal Visualization</div>
        <div className="bg-gray-100 h-8 rounded flex items-center justify-center">
          <span className="text-gray-700 text-xs">Built-in Chart</span>
        </div>
      </div>
    )
  }

  // Format date using date-fns if available
  const formatDateTime = () => {
    const dateFns = dependencies['date-fns']
    if (dateFns && dateFns.format) {
      return dateFns.format(new Date(), 'PPpp')
    }
    return new Date().toLocaleString()
  }

  // Show loading state while dependencies load
  if (loadingDeps) {
    return (
      <Card className="h-full">
        <CardContent className="flex flex-col items-center justify-center h-full space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <div className="text-sm text-muted-foreground">Loading dependencies...</div>
          <div className="text-xs text-muted-foreground">
            {MANIFEST.dependencies.map(dep => dep.name).join(', ')}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show error state if dependencies failed to load
  if (depError) {
    return (
      <Card className="h-full border-red-200">
        <CardContent className="flex flex-col items-center justify-center h-full space-y-4">
          <AlertTriangle className="h-8 w-8 text-red-500" />
          <div className="text-sm text-red-700 text-center">
            Dependency Error
          </div>
          <div className="text-xs text-red-600 text-center max-w-full overflow-hidden">
            {depError}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span>{modConfig.title}</span>
          </div>
          <Badge variant="outline" className="text-xs">
            Advanced
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Data Information */}
        {data && (
          <div className="text-xs space-y-1">
            <div className="font-medium">Data Status</div>
            <div className="text-muted-foreground">
              Value: {data.value}, Updated: {new Date(data.timestamp).toLocaleTimeString()}
            </div>
          </div>
        )}

        {/* Date/Time Display */}
        {modConfig.showDateTime && (
          <div className="text-xs space-y-1">
            <div className="font-medium">Current Time</div>
            <div className="text-muted-foreground">
              {formatDateTime()}
            </div>
          </div>
        )}

        {/* Visualization based on config */}
        <div className="space-y-2">
          {modConfig.dataVisualization === 'd3' && renderD3Visualization()}
          {modConfig.dataVisualization === 'chartjs' && renderChartJsVisualization()}
          {modConfig.dataVisualization === 'internal' && renderInternalVisualization()}
        </div>

        {/* Advanced Features */}
        {modConfig.enableAdvancedFeatures && (
          <div className="text-xs space-y-1">
            <div className="font-medium">Advanced Features</div>
            <div className="text-muted-foreground">
              Real-time processing enabled
            </div>
            <div className="bg-yellow-100 p-2 rounded">
              <span className="text-yellow-700 text-xs">
                🚀 Advanced mode active
              </span>
            </div>
          </div>
        )}

        {/* Dependency Status */}
        <div className="text-xs space-y-1">
          <div className="font-medium">Dependencies</div>
          <div className="flex flex-wrap gap-1">
            {MANIFEST.dependencies.map(dep => (
              <Badge 
                key={dep.name} 
                variant={dependencies[dep.name] ? "default" : "secondary"}
                className="text-xs"
              >
                {dep.name} {dependencies[dep.name] ? '✓' : '✗'}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Generate dummy data
const generateDummyData = (): AriesModData => {
  return {
    value: Math.floor(Math.random() * 1000),
    timestamp: new Date().toISOString(),
    metadata: {
      source: 'advanced-ariesmod',
      features: ['external-deps', 'configurable'],
      generated: true
    }
  }
}

// Validate configuration
const validateConfig = (config: Record<string, any>): boolean => {
  if (config.dataVisualization && !['internal', 'd3', 'chartjs'].includes(config.dataVisualization)) {
    return false
  }
  return true
}

// Export the AriesMod with manifest information
export const AdvancedAriesModTemplate: AriesMod = {
  metadata: {
    id: 'advanced-template',
    name: 'AdvancedTemplate',
    displayName: 'Advanced Template',
    description: 'Template demonstrating external dependencies and advanced features',
    version: '1.0.0',
    author: 'Your Name',
    category: 'custom',
    icon: '📦',
    defaultWidth: 300,
    defaultHeight: 250,
    minWidth: 250,
    minHeight: 200,
    maxWidth: 500,
    maxHeight: 400,
    configSchema: {
      title: {
        type: 'text',
        label: 'Widget Title',
        default: 'Advanced AriesMod',
        placeholder: 'Enter title'
      },
      dataVisualization: {
        type: 'select',
        label: 'Visualization Library',
        options: [
          { value: 'internal', label: 'Built-in (No dependencies)' },
          { value: 'd3', label: 'D3.js (CDN)' },
          { value: 'chartjs', label: 'Chart.js (CDN)' }
        ],
        default: 'internal'
      },
      showDateTime: {
        type: 'boolean',
        label: 'Show Date/Time',
        default: true
      },
      enableAdvancedFeatures: {
        type: 'boolean',
        label: 'Enable Advanced Features',
        default: false
      }
    },
    tags: ['template', 'advanced', 'dependencies', 'example'],
    
    // Additional metadata for dependency management
    manifest: MANIFEST,
    permissions: MANIFEST.permissions,
    dependencies: MANIFEST.dependencies
  },
  component: AdvancedAriesMod,
  generateDummyData,
  validateConfig
} 