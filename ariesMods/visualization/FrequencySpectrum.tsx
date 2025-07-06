import React, { useState, useMemo, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { 
  BarChart3, 
  Activity,
  Settings,
  Play,
  Pause,
  RotateCcw,
  TrendingUp
} from 'lucide-react'
import type { AriesMod, AriesModProps, AriesModData } from '@/types/ariesmods'

interface FrequencyData {
  frequencies: Float32Array | number[]
  magnitudes: Float32Array | number[]
  phases?: Float32Array | number[]
  sampleRate: number
  fftSize: number
  timestamp: string
}

interface FrequencyConfig {
  fftSize?: number // 256, 512, 1024, 2048, 4096
  windowFunction?: 'hanning' | 'hamming' | 'blackman' | 'none'
  frequencyRange?: [number, number] // [min, max] in Hz
  magnitudeRange?: [number, number] // [min, max] in dB
  logScale?: boolean
  showPhase?: boolean
  smoothing?: number // 0-1
  peakDetection?: boolean
  showGrid?: boolean
  colorScheme?: 'default' | 'fire' | 'cool' | 'spectrum'
  autoScale?: boolean
  updateRate?: number // Hz
}

const FrequencySpectrumComponent: React.FC<AriesModProps> = ({
  id,
  title,
  width,
  height,
  data,
  config,
  onConfigChange,
  onDataRequest
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  const [isRunning, setIsRunning] = useState(true)
  const [peakFrequency, setPeakFrequency] = useState(0)
  const [peakMagnitude, setPeakMagnitude] = useState(0)
  
  const spectrumConfig = config as FrequencyConfig
  const frequencyData = data?.value as FrequencyData
  
  const isCompact = width < 350 || height < 250

  // Generate dummy FFT data if no real data available
  const processedData = useMemo(() => {
    if (!frequencyData?.frequencies || !frequencyData?.magnitudes) {
      const fftSize = spectrumConfig?.fftSize || 1024
      const sampleRate = 48000 // 48kHz default
      const frequencies = Array.from({ length: fftSize / 2 }, (_, i) => 
        (i * sampleRate) / fftSize
      )
      
      // Generate dummy spectrum with some peaks
      const magnitudes = frequencies.map(freq => {
        let magnitude = -60 // Noise floor
        
        // Add some peaks at common frequencies
        if (Math.abs(freq - 1000) < 50) magnitude += 40 * Math.exp(-Math.pow((freq - 1000) / 50, 2))
        if (Math.abs(freq - 5000) < 100) magnitude += 30 * Math.exp(-Math.pow((freq - 5000) / 100, 2))
        if (Math.abs(freq - 10000) < 200) magnitude += 25 * Math.exp(-Math.pow((freq - 10000) / 200, 2))
        
        // Add random noise
        magnitude += (Math.random() - 0.5) * 10
        
        return magnitude
      })
      
      return {
        frequencies,
        magnitudes,
        sampleRate,
        fftSize,
        timestamp: new Date().toISOString()
      }
    }
    
    return frequencyData
  }, [frequencyData, spectrumConfig])

  // Find peak frequency and magnitude
  useEffect(() => {
    if (processedData?.magnitudes) {
      const maxIndex = processedData.magnitudes.indexOf(
        Math.max(...processedData.magnitudes)
      )
      if (maxIndex >= 0 && processedData.frequencies) {
        setPeakFrequency(processedData.frequencies[maxIndex])
        setPeakMagnitude(processedData.magnitudes[maxIndex])
      }
    }
  }, [processedData])

  // Canvas drawing function
  const drawSpectrum = useMemo(() => {
    return () => {
      const canvas = canvasRef.current
      if (!canvas || !processedData) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const { width: canvasWidth, height: canvasHeight } = canvas
      const { frequencies, magnitudes } = processedData

      // Clear canvas
      ctx.fillStyle = '#0f172a'
      ctx.fillRect(0, 0, canvasWidth, canvasHeight)

      if (!frequencies || !magnitudes || frequencies.length === 0) return

      // Configure frequency and magnitude ranges
      const freqRange = spectrumConfig?.frequencyRange || [0, Math.max(...frequencies)]
      const magRange = spectrumConfig?.magnitudeRange || [
        Math.min(...magnitudes) - 10,
        Math.max(...magnitudes) + 10
      ]

      // Filter data to frequency range
      const startIndex = frequencies.findIndex(f => f >= freqRange[0])
      const endIndex = frequencies.findIndex(f => f > freqRange[1])
      const visibleFreqs = frequencies.slice(startIndex, endIndex === -1 ? undefined : endIndex)
      const visibleMags = magnitudes.slice(startIndex, endIndex === -1 ? undefined : endIndex)

      if (visibleFreqs.length === 0) return

      // Draw grid
      if (spectrumConfig?.showGrid !== false) {
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)'
        ctx.lineWidth = 1

        // Frequency grid lines
        const freqStep = (freqRange[1] - freqRange[0]) / 10
        for (let i = 0; i <= 10; i++) {
          const freq = freqRange[0] + i * freqStep
          const x = (freq - freqRange[0]) / (freqRange[1] - freqRange[0]) * canvasWidth
          ctx.beginPath()
          ctx.moveTo(x, 0)
          ctx.lineTo(x, canvasHeight)
          ctx.stroke()
        }

        // Magnitude grid lines
        const magStep = (magRange[1] - magRange[0]) / 8
        for (let i = 0; i <= 8; i++) {
          const mag = magRange[0] + i * magStep
          const y = canvasHeight - ((mag - magRange[0]) / (magRange[1] - magRange[0]) * canvasHeight)
          ctx.beginPath()
          ctx.moveTo(0, y)
          ctx.lineTo(canvasWidth, y)
          ctx.stroke()
        }
      }

      // Draw spectrum
      const barWidth = canvasWidth / visibleFreqs.length
      
      visibleMags.forEach((magnitude, index) => {
        const freq = visibleFreqs[index]
        const x = (freq - freqRange[0]) / (freqRange[1] - freqRange[0]) * canvasWidth
        const normalizedMag = (magnitude - magRange[0]) / (magRange[1] - magRange[0])
        const barHeight = Math.max(0, normalizedMag * canvasHeight)
        const y = canvasHeight - barHeight

        // Color based on frequency and magnitude
        let color: string
        switch (spectrumConfig?.colorScheme) {
          case 'fire':
            color = `hsl(${Math.max(0, 60 - normalizedMag * 60)}, 100%, 50%)`
            break
          case 'cool':
            color = `hsl(${180 + normalizedMag * 60}, 70%, 50%)`
            break
          case 'spectrum':
            color = `hsl(${(freq / Math.max(...frequencies)) * 300}, 80%, 50%)`
            break
          default:
            color = `rgba(59, 130, 246, ${0.3 + normalizedMag * 0.7})`
        }

        ctx.fillStyle = color
        ctx.fillRect(x, y, Math.max(1, barWidth - 1), barHeight)

        // Highlight peaks
        if (spectrumConfig?.peakDetection && magnitude === Math.max(...visibleMags)) {
          ctx.strokeStyle = '#ef4444'
          ctx.lineWidth = 2
          ctx.strokeRect(x - 1, y - 1, barWidth + 2, barHeight + 2)
        }
      })

      // Draw frequency labels
      if (!isCompact) {
        ctx.fillStyle = '#94a3b8'
        ctx.font = '10px monospace'
        ctx.textAlign = 'center'
        
        const labelStep = Math.ceil(visibleFreqs.length / 8)
        for (let i = 0; i < visibleFreqs.length; i += labelStep) {
          const freq = visibleFreqs[i]
          const x = (freq - freqRange[0]) / (freqRange[1] - freqRange[0]) * canvasWidth
          const label = freq >= 1000 ? `${(freq / 1000).toFixed(1)}k` : `${freq.toFixed(0)}`
          ctx.fillText(label, x, canvasHeight - 5)
        }
      }
    }
  }, [processedData, spectrumConfig, isCompact])

  // Animation loop
  useEffect(() => {
    if (!isRunning) return

    const animate = () => {
      drawSpectrum()
      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [drawSpectrum, isRunning])

  // Canvas resize handling
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * window.devicePixelRatio
      canvas.height = rect.height * window.devicePixelRatio
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
      
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
      }
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [width, height])

  const formatFrequency = (freq: number) => {
    if (freq >= 1000) return `${(freq / 1000).toFixed(1)}kHz`
    return `${freq.toFixed(0)}Hz`
  }

  const formatMagnitude = (mag: number) => {
    return `${mag.toFixed(1)}dB`
  }

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className={`pb-2 ${isCompact ? 'py-1' : ''}`}>
        <div className="flex items-center justify-between">
          <CardTitle className={`${isCompact ? 'text-sm' : 'text-base'} flex items-center gap-2`}>
            <BarChart3 className="h-4 w-4" />
            {title}
            {processedData && (
              <Badge variant="outline" className="text-xs">
                {processedData.sampleRate / 1000}kHz
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={() => setIsRunning(!isRunning)}>
              {isRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => onDataRequest?.(id, { action: 'reset' })}
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        {!isCompact && (
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-3 w-3" />
              <span>Peak: {formatFrequency(peakFrequency)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-3 w-3" />
              <span>{formatMagnitude(peakMagnitude)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="log-scale" className="text-xs">Log</Label>
              <Switch
                id="log-scale"
                checked={spectrumConfig?.logScale || false}
                onCheckedChange={(checked) => onConfigChange?.({
                  ...spectrumConfig,
                  logScale: checked
                })}
              />
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 p-2">
        <canvas
          ref={canvasRef}
          className="w-full h-full border border-border rounded"
          style={{ 
            background: 'linear-gradient(to bottom, #0f172a, #1e293b)',
            minHeight: '150px'
          }}
        />
      </CardContent>
    </Card>
  )
}

export const FrequencySpectrumMod: AriesMod = {
  metadata: {
    id: 'frequency-spectrum',
    name: 'FrequencySpectrum',
    displayName: 'Frequency Spectrum Analyzer',
    description: 'Real-time FFT visualization with configurable parameters and peak detection',
    version: '1.0.0',
    author: 'AriesUI Team',
    category: 'visualization',
    icon: '📊',
    defaultWidth: 500,
    defaultHeight: 300,
    minWidth: 300,
    minHeight: 200,
    tags: ['fft', 'spectrum', 'audio', 'signal', 'frequency']
  },
  component: FrequencySpectrumComponent,
  generateDummyData: (): AriesModData => {
    const fftSize = 1024
    const sampleRate = 48000
    const frequencies = Array.from({ length: fftSize / 2 }, (_, i) => 
      (i * sampleRate) / fftSize
    )
    
    const magnitudes = frequencies.map(freq => {
      let magnitude = -60 + Math.random() * 10 // Noise floor
      
      // Add prominent peaks
      if (Math.abs(freq - 1000) < 50) magnitude += 35
      if (Math.abs(freq - 5000) < 100) magnitude += 25
      if (Math.abs(freq - 15000) < 200) magnitude += 20
      
      return magnitude
    })
    
    return {
      value: {
        frequencies,
        magnitudes,
        sampleRate,
        fftSize,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    }
  },
  validateConfig: (config: FrequencyConfig): boolean => {
    if (config.fftSize && ![256, 512, 1024, 2048, 4096].includes(config.fftSize)) return false
    if (config.smoothing && (config.smoothing < 0 || config.smoothing > 1)) return false
    if (config.updateRate && (config.updateRate < 1 || config.updateRate > 60)) return false
    return true
  }
} 