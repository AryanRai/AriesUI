import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  TrendingUp, 
  BarChart3, 
  Scatter3D, 
  Activity, 
  Settings, 
  Download, 
  Maximize2,
  Grid3X3,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Play,
  Pause,
  Eye,
  EyeOff
} from 'lucide-react'
import type { AriesModProps, AriesMod, AriesModData } from '@/types/ariesmods'

export interface PlotChartConfig {
  title: string
  chartType: 'line' | 'scatter' | 'bar' | 'histogram' | 'heatmap' | 'surface' | 'parametric'
  plotStyle: 'default' | 'matlab' | 'scientific' | 'engineering'
  xAxisLabel: string
  yAxisLabel: string
  zAxisLabel?: string
  showGrid: boolean
  showLegend: boolean
  showDataPoints: boolean
  showTrendLines: boolean
  animateData: boolean
  maxDataPoints: number
  timeWindow: number // seconds
  updateRate: number // ms
  autoScale: boolean
  xRange: [number, number]
  yRange: [number, number]
  colorScheme: 'default' | 'viridis' | 'plasma' | 'turbo' | 'rainbow'
  lineWidth: number
  markerSize: number
  gridOpacity: number
}

export interface DataSeries {
  id: string
  name: string
  data: Array<{ x: number; y: number; z?: number; timestamp?: number }>
  color: string
  visible: boolean
  type: 'line' | 'scatter' | 'bar'
  lineStyle: 'solid' | 'dashed' | 'dotted'
  markerStyle: 'circle' | 'square' | 'triangle' | 'cross'
}

export interface PlotChartData extends AriesModData {
  series: DataSeries[]
  equations: string[]
  statistics: {
    mean: number
    median: number
    stdDev: number
    min: number
    max: number
    range: number
  }
  isRealTime: boolean
  sampleRate: number
  totalSamples: number
}

const PlotChart: React.FC<AriesModProps> = ({
  id,
  title,
  width = 400,
  height = 300,
  data,
  config,
  onConfigChange,
  onDataRequest
}) => {
  const chartConfig = config as PlotChartConfig
  const chartData = data as PlotChartData

  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedSeries, setSelectedSeries] = useState<string | null>(null)
  const [customEquation, setCustomEquation] = useState('')
  const [zoomLevel, setZoomLevel] = useState(1)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [isPlaying, setIsPlaying] = useState(false)

  // Generate mathematical functions for demo
  const generateMathData = useCallback((equation: string, xMin: number, xMax: number, points: number = 100) => {
    const data: Array<{ x: number; y: number }> = []
    const step = (xMax - xMin) / points
    
    for (let i = 0; i <= points; i++) {
      const x = xMin + i * step
      let y: number
      
      try {
        switch (equation) {
          case 'sin(x)':
            y = Math.sin(x)
            break
          case 'cos(x)':
            y = Math.cos(x)
            break
          case 'tan(x)':
            y = Math.tan(x)
            break
          case 'x^2':
            y = x * x
            break
          case 'sqrt(x)':
            y = x >= 0 ? Math.sqrt(x) : NaN
            break
          case 'log(x)':
            y = x > 0 ? Math.log(x) : NaN
            break
          case 'exp(x)':
            y = Math.exp(x)
            break
          case 'sin(x)/x':
            y = x !== 0 ? Math.sin(x) / x : 1
            break
          default:
            y = 0
        }
        
        if (!isNaN(y) && isFinite(y)) {
          data.push({ x, y })
        }
      } catch (error) {
        // Skip invalid points
      }
    }
    
    return data
  }, [])

  // Dummy data for demo purposes
  const getDummyData = useCallback((): PlotChartData => {
    const timeSeriesData = Array.from({ length: 50 }, (_, i) => ({
      x: i * 0.1,
      y: Math.sin(i * 0.1) + 0.1 * Math.random(),
      timestamp: Date.now() - (50 - i) * 100
    }))

    const mathData = generateMathData('sin(x)', -2 * Math.PI, 2 * Math.PI, 100)

    return {
      value: chartData?.series?.[0]?.data?.[0]?.y || 0,
      timestamp: new Date().toISOString(),
      series: chartData?.series || [
        {
          id: 'timeseries',
          name: 'Sensor Data',
          data: timeSeriesData,
          color: '#3b82f6',
          visible: true,
          type: 'line',
          lineStyle: 'solid',
          markerStyle: 'circle'
        },
        {
          id: 'function',
          name: 'sin(x)',
          data: mathData,
          color: '#ef4444',
          visible: true,
          type: 'line',
          lineStyle: 'solid',
          markerStyle: 'circle'
        }
      ],
      equations: ['sin(x)', 'cos(x)', 'x^2', 'sqrt(x)', 'log(x)'],
      statistics: {
        mean: 0.12,
        median: 0.08,
        stdDev: 0.85,
        min: -1.0,
        max: 1.2,
        range: 2.2
      },
      isRealTime: chartData?.isRealTime ?? true,
      sampleRate: chartData?.sampleRate || 10,
      totalSamples: chartData?.totalSamples || 1000,
      metadata: { source: 'plot', type: 'mathematical' }
    }
  }, [chartData, generateMathData])

  const currentData = chartData || getDummyData()

  const handleConfigChange = (key: keyof PlotChartConfig, value: any) => {
    onConfigChange?.({
      ...chartConfig,
      [key]: value
    })
  }

  const addEquation = () => {
    if (customEquation.trim()) {
      const newData = generateMathData(customEquation, -10, 10, 200)
      onDataRequest?.(id, {
        action: 'add_series',
        series: {
          id: `equation_${Date.now()}`,
          name: customEquation,
          data: newData,
          color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
          visible: true,
          type: 'line',
          lineStyle: 'solid',
          markerStyle: 'circle'
        }
      })
      setCustomEquation('')
    }
  }

  const toggleSeries = (seriesId: string) => {
    onDataRequest?.(id, {
      action: 'toggle_series',
      seriesId
    })
  }

  const resetZoom = () => {
    setZoomLevel(1)
    setPanOffset({ x: 0, y: 0 })
  }

  const exportData = () => {
    const csvData = currentData.series.map(series => 
      series.data.map(point => `${point.x},${point.y}`).join('\n')
    ).join('\n\n')
    
    const blob = new Blob([csvData], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title || 'plot'}_data.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const renderPlotArea = () => {
    const plotWidth = 280
    const plotHeight = 160
    const margin = { top: 10, right: 10, bottom: 30, left: 40 }
    
    // Calculate bounds
    const allPoints = currentData.series.flatMap(s => s.visible ? s.data : [])
    const xMin = Math.min(...allPoints.map(p => p.x))
    const xMax = Math.max(...allPoints.map(p => p.x))
    const yMin = Math.min(...allPoints.map(p => p.y))
    const yMax = Math.max(...allPoints.map(p => p.y))
    
    const xScale = (x: number) => 
      margin.left + ((x - xMin) / (xMax - xMin)) * (plotWidth - margin.left - margin.right)
    const yScale = (y: number) => 
      plotHeight - margin.bottom - ((y - yMin) / (yMax - yMin)) * (plotHeight - margin.top - margin.bottom)

    return (
      <div className="relative bg-background border rounded p-2">
        <svg width={plotWidth} height={plotHeight} className="overflow-visible">
          {/* Grid */}
          {chartConfig?.showGrid && (
            <g className="opacity-30">
              {Array.from({ length: 6 }, (_, i) => (
                <g key={i}>
                  <line
                    x1={margin.left + (i / 5) * (plotWidth - margin.left - margin.right)}
                    y1={margin.top}
                    x2={margin.left + (i / 5) * (plotWidth - margin.left - margin.right)}
                    y2={plotHeight - margin.bottom}
                    stroke="currentColor"
                    strokeWidth="0.5"
                  />
                  <line
                    x1={margin.left}
                    y1={margin.top + (i / 5) * (plotHeight - margin.top - margin.bottom)}
                    x2={plotWidth - margin.right}
                    y2={margin.top + (i / 5) * (plotHeight - margin.top - margin.bottom)}
                    stroke="currentColor"
                    strokeWidth="0.5"
                  />
                </g>
              ))}
            </g>
          )}
          
          {/* Axes */}
          <g>
            <line
              x1={margin.left}
              y1={plotHeight - margin.bottom}
              x2={plotWidth - margin.right}
              y2={plotHeight - margin.bottom}
              stroke="currentColor"
              strokeWidth="1"
            />
            <line
              x1={margin.left}
              y1={margin.top}
              x2={margin.left}
              y2={plotHeight - margin.bottom}
              stroke="currentColor"
              strokeWidth="1"
            />
          </g>

          {/* Data series */}
          {currentData.series.filter(s => s.visible).map((series, seriesIndex) => (
            <g key={series.id}>
              {series.type === 'line' && series.data.length > 1 && (
                <path
                  d={`M ${series.data.map(point => 
                    `${xScale(point.x)},${yScale(point.y)}`
                  ).join(' L ')}`}
                  fill="none"
                  stroke={series.color}
                  strokeWidth={chartConfig?.lineWidth || 2}
                  strokeDasharray={series.lineStyle === 'dashed' ? '5,5' : 
                                 series.lineStyle === 'dotted' ? '2,2' : 'none'}
                />
              )}
              
              {chartConfig?.showDataPoints && series.data.map((point, pointIndex) => (
                <circle
                  key={pointIndex}
                  cx={xScale(point.x)}
                  cy={yScale(point.y)}
                  r={chartConfig?.markerSize || 2}
                  fill={series.color}
                  className="opacity-80"
                />
              ))}
            </g>
          ))}
          
          {/* Axis labels */}
          <text
            x={plotWidth / 2}
            y={plotHeight - 5}
            textAnchor="middle"
            className="text-xs fill-current"
          >
            {chartConfig?.xAxisLabel || 'X'}
          </text>
          <text
            x={15}
            y={plotHeight / 2}
            textAnchor="middle"
            className="text-xs fill-current"
            transform={`rotate(-90, 15, ${plotHeight / 2})`}
          >
            {chartConfig?.yAxisLabel || 'Y'}
          </text>
        </svg>
        
        {/* Plot controls */}
        <div className="absolute top-2 right-2 flex gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setZoomLevel(prev => Math.min(prev * 1.2, 5))}
            title="Zoom in"
          >
            <ZoomIn className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setZoomLevel(prev => Math.max(prev / 1.2, 0.5))}
            title="Zoom out"
          >
            <ZoomOut className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={resetZoom}
            title="Reset zoom"
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        </div>
      </div>
    )
  }

  const renderSeriesList = () => (
    <div className="space-y-2">
      {currentData.series.map((series) => (
        <div 
          key={series.id}
          className={`
            flex items-center justify-between p-2 rounded border cursor-pointer
            ${selectedSeries === series.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'}
          `}
          onClick={() => setSelectedSeries(
            selectedSeries === series.id ? null : series.id
          )}
        >
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded"
              style={{ backgroundColor: series.color }}
            />
            <span className="text-sm font-medium">{series.name}</span>
            <Badge variant={series.visible ? "default" : "secondary"} className="text-xs">
              {series.data.length} pts
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation()
              toggleSeries(series.id)
            }}
          >
            {series.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          </Button>
        </div>
      ))}
    </div>
  )

  const renderStatistics = () => (
    <div className="grid grid-cols-2 gap-2 text-xs">
      <div>
        <div className="text-muted-foreground">Mean</div>
        <div className="font-mono">{currentData.statistics.mean.toFixed(3)}</div>
      </div>
      <div>
        <div className="text-muted-foreground">Median</div>
        <div className="font-mono">{currentData.statistics.median.toFixed(3)}</div>
      </div>
      <div>
        <div className="text-muted-foreground">Std Dev</div>
        <div className="font-mono">{currentData.statistics.stdDev.toFixed(3)}</div>
      </div>
      <div>
        <div className="text-muted-foreground">Range</div>
        <div className="font-mono">{currentData.statistics.range.toFixed(3)}</div>
      </div>
      <div>
        <div className="text-muted-foreground">Min</div>
        <div className="font-mono">{currentData.statistics.min.toFixed(3)}</div>
      </div>
      <div>
        <div className="text-muted-foreground">Max</div>
        <div className="font-mono">{currentData.statistics.max.toFixed(3)}</div>
      </div>
      <div>
        <div className="text-muted-foreground">Sample Rate</div>
        <div className="font-mono">{currentData.sampleRate} Hz</div>
      </div>
      <div>
        <div className="text-muted-foreground">Total Samples</div>
        <div className="font-mono">{currentData.totalSamples}</div>
      </div>
    </div>
  )

  const renderEquationInput = () => (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={customEquation}
          onChange={(e) => setCustomEquation(e.target.value)}
          placeholder="Enter equation (e.g., sin(x), x^2)"
          className="text-xs"
          onKeyPress={(e) => e.key === 'Enter' && addEquation()}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={addEquation}
          disabled={!customEquation.trim()}
        >
          Add
        </Button>
      </div>
      <div className="flex flex-wrap gap-1">
        {currentData.equations.map((eq, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            className="h-6 text-xs"
            onClick={() => setCustomEquation(eq)}
          >
            {eq}
          </Button>
        ))}
      </div>
    </div>
  )

  const renderSettings = () => (
    <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded">
      <div className="space-y-2">
        <Label className="text-xs">Chart Type</Label>
        <Select
          value={chartConfig?.chartType || 'line'}
          onValueChange={(value) => handleConfigChange('chartType', value)}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="line">Line Plot</SelectItem>
            <SelectItem value="scatter">Scatter Plot</SelectItem>
            <SelectItem value="bar">Bar Chart</SelectItem>
            <SelectItem value="histogram">Histogram</SelectItem>
            <SelectItem value="heatmap">Heatmap</SelectItem>
            <SelectItem value="surface">3D Surface</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Plot Style</Label>
        <Select
          value={chartConfig?.plotStyle || 'default'}
          onValueChange={(value) => handleConfigChange('plotStyle', value)}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default</SelectItem>
            <SelectItem value="matlab">MATLAB</SelectItem>
            <SelectItem value="scientific">Scientific</SelectItem>
            <SelectItem value="engineering">Engineering</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">X-Axis Label</Label>
        <Input
          value={chartConfig?.xAxisLabel || ''}
          onChange={(e) => handleConfigChange('xAxisLabel', e.target.value)}
          className="h-8 text-xs"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Y-Axis Label</Label>
        <Input
          value={chartConfig?.yAxisLabel || ''}
          onChange={(e) => handleConfigChange('yAxisLabel', e.target.value)}
          className="h-8 text-xs"
        />
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="show-grid"
          checked={chartConfig?.showGrid || false}
          onCheckedChange={(checked) => handleConfigChange('showGrid', checked)}
        />
        <Label htmlFor="show-grid" className="text-xs">Show Grid</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="show-legend"
          checked={chartConfig?.showLegend || false}
          onCheckedChange={(checked) => handleConfigChange('showLegend', checked)}
        />
        <Label htmlFor="show-legend" className="text-xs">Show Legend</Label>
      </div>
    </div>
  )

  return (
    <Card className="w-full h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            {chartConfig?.title || title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge 
              variant={currentData.isRealTime ? "default" : "secondary"}
              className="text-xs"
            >
              {currentData.isRealTime ? 'Live' : 'Static'}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={exportData}
              title="Export data"
            >
              <Download className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <Settings className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isExpanded && renderSettings()}
        
        {renderPlotArea()}
        
        <Tabs defaultValue="series" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="series" className="text-xs">Series</TabsTrigger>
            <TabsTrigger value="equations" className="text-xs">Equations</TabsTrigger>
            <TabsTrigger value="stats" className="text-xs">Statistics</TabsTrigger>
          </TabsList>
          <TabsContent value="series" className="mt-3">
            {renderSeriesList()}
          </TabsContent>
          <TabsContent value="equations" className="mt-3">
            {renderEquationInput()}
          </TabsContent>
          <TabsContent value="stats" className="mt-3">
            {renderStatistics()}
          </TabsContent>
        </Tabs>

        <div className="text-xs text-muted-foreground text-center">
          Last Update: {new Date(currentData.timestamp).toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  )
}

// AriesMod configuration
export const PlotChartMod: AriesMod = {
  metadata: {
    id: 'plot-chart',
    displayName: 'Enhanced Plot/Chart Widget',
    description: 'Advanced plotting widget with mathematical functions, time-series data, and MATLAB-style visualization',
    category: 'visualization',
    tags: ['plot', 'chart', 'graph', 'mathematical', 'timeseries', 'matlab', 'data'],
    version: '1.0.0',
    author: 'AriesUI',
    thumbnail: '/thumbnails/plot-chart.png',
    defaultSize: { width: 400, height: 400 },
    minSize: { width: 300, height: 250 },
    maxSize: { width: 800, height: 600 },
    supportedDataTypes: ['timeseries', 'array', 'mathematical', 'sensor'],
    configurable: true,
    hardwareIntegrated: true
  },
  component: PlotChart,
  defaultConfig: {
    title: 'Plot Chart',
    chartType: 'line',
    plotStyle: 'default',
    xAxisLabel: 'X',
    yAxisLabel: 'Y',
    showGrid: true,
    showLegend: true,
    showDataPoints: false,
    showTrendLines: false,
    animateData: true,
    maxDataPoints: 1000,
    timeWindow: 60,
    updateRate: 100,
    autoScale: true,
    xRange: [-10, 10],
    yRange: [-2, 2],
    colorScheme: 'default',
    lineWidth: 2,
    markerSize: 3,
    gridOpacity: 0.3
  },
  generateDummyData: () => {
    const timeData = Array.from({ length: 50 }, (_, i) => ({
      x: i * 0.1,
      y: Math.sin(i * 0.1) + 0.1 * Math.random(),
      timestamp: Date.now() - (50 - i) * 100
    }))

    return {
      value: timeData[timeData.length - 1]?.y || 0,
      timestamp: new Date().toISOString(),
      series: [
        {
          id: 'sensor1',
          name: 'Sensor Data',
          data: timeData,
          color: '#3b82f6',
          visible: true,
          type: 'line' as const,
          lineStyle: 'solid' as const,
          markerStyle: 'circle' as const
        }
      ],
      equations: ['sin(x)', 'cos(x)', 'x^2', 'sqrt(x)'],
      statistics: {
        mean: 0.12,
        median: 0.08,
        stdDev: 0.85,
        min: -1.0,
        max: 1.2,
        range: 2.2
      },
      isRealTime: true,
      sampleRate: 10,
      totalSamples: 1000,
      metadata: { source: 'demo' }
    }
  },
  validateConfig: (config: Record<string, any>) => {
    return typeof config.title === 'string' && 
           typeof config.maxDataPoints === 'number' &&
           config.maxDataPoints > 0
  }
}

export default PlotChart 