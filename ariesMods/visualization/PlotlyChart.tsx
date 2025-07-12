import React, { useMemo } from 'react'
import dynamic from 'next/dynamic'
import type { AriesMod, AriesModProps, AriesModData } from '@/types/ariesmods'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, BarChart3, TrendingUp, PieChart, Grid3X3 } from 'lucide-react'

// Dynamic import of Plotly to avoid SSR issues
const Plot = dynamic(() => import('react-plotly.js'), { 
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full text-muted-foreground">Loading chart...</div>
})

export type PlotlyChartType = 'line' | 'bar' | 'scatter' | 'pie' | 'heatmap'

export interface PlotlyChartConfig {
  chartType: PlotlyChartType
  title: string
  xAxisLabel?: string
  yAxisLabel?: string
  showLegend: boolean
  colorScheme: 'viridis' | 'plasma' | 'blues' | 'greens' | 'oranges'
  animated: boolean
  dataPoints: number
}

const defaultConfig: PlotlyChartConfig = {
  chartType: 'line',
  title: 'Data Visualization',
  xAxisLabel: 'Time',
  yAxisLabel: 'Value',
  showLegend: true,
  colorScheme: 'viridis',
  animated: true,
  dataPoints: 20
}

const PlotlyChart: React.FC<AriesModProps> = ({ 
  id, 
  title, 
  width, 
  height, 
  data, 
  config, 
  onConfigChange,
  onDataRequest 
}) => {
  const chartConfig = { ...defaultConfig, ...config } as PlotlyChartConfig

  // Generate chart data based on type and config
  const chartData = useMemo(() => {
    const points = chartConfig.dataPoints || 20
    const timestamps = Array.from({ length: points }, (_, i) => 
      new Date(Date.now() - (points - i) * 60000).toISOString()
    )
    
    switch (chartConfig.chartType) {
      case 'line':
        return [{
          x: timestamps,
          y: Array.from({ length: points }, () => 20 + Math.random() * 60),
          type: 'scatter',
          mode: 'lines+markers',
          name: 'Temperature',
          line: { color: '#3b82f6' }
        }]
        
      case 'bar':
        return [{
          x: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          y: Array.from({ length: 6 }, () => Math.random() * 100),
          type: 'bar',
          name: 'Monthly Data',
          marker: { color: '#10b981' }
        }]
        
      case 'scatter':
        return [{
          x: Array.from({ length: points }, () => Math.random() * 100),
          y: Array.from({ length: points }, () => Math.random() * 100),
          mode: 'markers',
          type: 'scatter',
          name: 'Data Points',
          marker: { 
            color: Array.from({ length: points }, () => Math.random() * 100),
            colorscale: chartConfig.colorScheme,
            size: 8
          }
        }]
        
      case 'pie':
        return [{
          values: [30, 25, 20, 15, 10],
          labels: ['CPU', 'Memory', 'Disk', 'Network', 'Other'],
          type: 'pie',
          textinfo: 'label+percent',
          marker: {
            colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
          }
        }]
        
      case 'heatmap':
        const size = 10
        return [{
          z: Array.from({ length: size }, () => 
            Array.from({ length: size }, () => Math.random() * 100)
          ),
          type: 'heatmap',
          colorscale: chartConfig.colorScheme,
          showscale: true
        }]
        
      default:
        return []
    }
  }, [chartConfig])

  // Layout configuration
  const layout = useMemo(() => ({
    title: {
      text: chartConfig.title,
      font: { size: 14, color: '#374151' }
    },
    width: width - 20,
    height: height - 60,
    margin: { l: 40, r: 20, t: 40, b: 40 },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    showlegend: chartConfig.showLegend,
    xaxis: {
      title: chartConfig.xAxisLabel,
      gridcolor: '#e5e7eb',
      font: { size: 10 }
    },
    yaxis: {
      title: chartConfig.yAxisLabel,
      gridcolor: '#e5e7eb',
      font: { size: 10 }
    },
    font: { family: 'Inter, sans-serif' },
    transition: chartConfig.animated ? {
      duration: 500,
      easing: 'cubic-in-out'
    } : undefined
  }), [chartConfig, width, height])

  const config_plotly = {
    displayModeBar: false,
    responsive: true,
    staticPlot: false
  }

  const getChartIcon = () => {
    switch (chartConfig.chartType) {
      case 'line': return <Activity className="h-4 w-4" />
      case 'bar': return <BarChart3 className="h-4 w-4" />
      case 'scatter': return <TrendingUp className="h-4 w-4" />
      case 'pie': return <PieChart className="h-4 w-4" />
      case 'heatmap': return <Grid3X3 className="h-4 w-4" />
      default: return <BarChart3 className="h-4 w-4" />
    }
  }

  return (
    <Card className="h-full border-0 shadow-none">
      <CardContent className="p-3 h-full">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {getChartIcon()}
            <span className="text-sm font-medium truncate">{title}</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {chartConfig.chartType}
          </Badge>
        </div>
        
        <div className="relative h-[calc(100%-40px)]">
          <Plot
            data={chartData as any}
            layout={layout as any}
            config={config_plotly}
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      </CardContent>
    </Card>
  )
}

// Dummy data generator for different chart types
const generateDummyData = (): AriesModData => {
  return {
    value: Math.random() * 100,
    timestamp: new Date().toISOString(),
    metadata: {
      chartType: 'line',
      dataPoints: 20,
      generated: true
    }
  }
}

// Configuration validator
const validateConfig = (config: Record<string, any>): boolean => {
  const validChartTypes: PlotlyChartType[] = ['line', 'bar', 'scatter', 'pie', 'heatmap']
  const validColorSchemes = ['viridis', 'plasma', 'blues', 'greens', 'oranges']
  
  if (config.chartType && !validChartTypes.includes(config.chartType)) {
    return false
  }
  
  if (config.colorScheme && !validColorSchemes.includes(config.colorScheme)) {
    return false
  }
  
  if (config.dataPoints && (typeof config.dataPoints !== 'number' || config.dataPoints < 1)) {
    return false
  }
  
  return true
}

// Export the AriesMod
export const PlotlyChartMod: AriesMod = {
  metadata: {
    id: 'plotly-chart',
    name: 'PlotlyChart',
    displayName: 'Plotly Visualization',
    description: 'Advanced data visualization with multiple chart types using Plotly.js',
    version: '1.0.0',
    author: 'AriesUI',
    category: 'visualization',
    icon: '📊',
    defaultWidth: 400,
    defaultHeight: 300,
    minWidth: 300,
    minHeight: 200,
    maxWidth: 800,
    maxHeight: 600,
    configSchema: {
      chartType: {
        type: 'select',
        label: 'Chart Type',
        options: [
          { value: 'line', label: 'Line Chart' },
          { value: 'bar', label: 'Bar Chart' },
          { value: 'scatter', label: 'Scatter Plot' },
          { value: 'pie', label: 'Pie Chart' },
          { value: 'heatmap', label: 'Heatmap' }
        ],
        default: 'line'
      },
      title: {
        type: 'text',
        label: 'Chart Title',
        default: 'Data Visualization'
      },
      xAxisLabel: {
        type: 'text',
        label: 'X-Axis Label',
        default: 'Time'
      },
      yAxisLabel: {
        type: 'text',
        label: 'Y-Axis Label',
        default: 'Value'
      },
      showLegend: {
        type: 'boolean',
        label: 'Show Legend',
        default: true
      },
      colorScheme: {
        type: 'select',
        label: 'Color Scheme',
        options: [
          { value: 'viridis', label: 'Viridis' },
          { value: 'plasma', label: 'Plasma' },
          { value: 'blues', label: 'Blues' },
          { value: 'greens', label: 'Greens' },
          { value: 'oranges', label: 'Oranges' }
        ],
        default: 'viridis'
      },
      animated: {
        type: 'boolean',
        label: 'Animated Transitions',
        default: true
      },
      dataPoints: {
        type: 'number',
        label: 'Data Points',
        default: 20,
        min: 5,
        max: 100
      }
    },
    tags: ['plotly', 'charts', 'visualization', 'graphs', 'analytics']
  },
  component: PlotlyChart,
  generateDummyData,
  validateConfig
} 