import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Camera, 
  Video, 
  Square, 
  Play, 
  Pause, 
  Download, 
  Settings, 
  Maximize2,
  Minimize2,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Crosshair,
  Grid3X3,
  Eye,
  EyeOff
} from 'lucide-react'
import type { AriesModProps, AriesMod, AriesModData } from '@/types/ariesmods'

export interface ImageCameraConfig {
  title: string
  streamUrl?: string
  resolution: '720p' | '1080p' | '4K' | 'auto'
  frameRate: number
  showOverlay: boolean
  overlayType: 'crosshair' | 'grid' | 'custom' | 'none'
  showControls: boolean
  autoRecord: boolean
  recordingQuality: 'low' | 'medium' | 'high'
  zoom: number
  brightness: number
  contrast: number
  saturation: number
  exposure: number
  flipHorizontal: boolean
  flipVertical: boolean
  rotation: 0 | 90 | 180 | 270
}

export interface CameraFrame {
  imageData: string // Base64 or URL
  timestamp: number
  frameNumber: number
  width: number
  height: number
  format: 'jpeg' | 'png' | 'raw'
}

export interface ImageCameraData extends AriesModData {
  currentFrame: CameraFrame
  isStreaming: boolean
  isRecording: boolean
  recordingDuration: number
  frameRate: number
  resolution: { width: number; height: number }
  cameraStatus: 'connected' | 'disconnected' | 'error' | 'initializing'
  storageUsed: number
  storageTotal: number
  overlayData?: Array<{
    type: 'text' | 'marker' | 'box' | 'line'
    x: number
    y: number
    width?: number
    height?: number
    text?: string
    color?: string
  }>
}

const ImageCamera: React.FC<AriesModProps> = ({
  id,
  title,
  width = 400,
  height = 300,
  data,
  config,
  onConfigChange,
  onDataRequest
}) => {
  const cameraConfig = config as ImageCameraConfig
  const cameraData = data as ImageCameraData

  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [capturedFrames, setCapturedFrames] = useState<CameraFrame[]>([])
  const videoRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Dummy data for demo purposes
  const getDummyData = useCallback((): ImageCameraData => ({
    value: cameraData?.currentFrame || {},
    timestamp: new Date().toISOString(),
    currentFrame: cameraData?.currentFrame || {
      imageData: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjI0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkNhbWVyYSBGZWVkPC90ZXh0Pjwvc3ZnPg==',
      timestamp: Date.now(),
      frameNumber: Math.floor(Math.random() * 10000),
      width: 1920,
      height: 1080,
      format: 'jpeg'
    },
    isStreaming: cameraData?.isStreaming ?? true,
    isRecording: cameraData?.isRecording ?? false,
    recordingDuration: cameraData?.recordingDuration || 0,
    frameRate: cameraData?.frameRate || 30,
    resolution: cameraData?.resolution || { width: 1920, height: 1080 },
    cameraStatus: cameraData?.cameraStatus || 'connected',
    storageUsed: cameraData?.storageUsed || 2.5,
    storageTotal: cameraData?.storageTotal || 32.0,
    overlayData: cameraData?.overlayData || [
      { type: 'marker', x: 160, y: 120, color: '#ff0000' },
      { type: 'text', x: 50, y: 30, text: 'CAM 01', color: '#ffffff' }
    ],
    metadata: { source: 'camera', device: 'cam01' }
  }), [cameraData])

  const currentData = cameraData || getDummyData()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800'
      case 'initializing':
        return 'bg-yellow-100 text-yellow-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const formatFileSize = (sizeInGB: number) => {
    return sizeInGB >= 1 ? `${sizeInGB.toFixed(1)} GB` : `${(sizeInGB * 1024).toFixed(0)} MB`
  }

  const handleConfigChange = (key: keyof ImageCameraConfig, value: any) => {
    onConfigChange?.({
      ...cameraConfig,
      [key]: value
    })
  }

  const handleStartRecording = () => {
    onDataRequest?.(id, {
      action: 'start_recording',
      config: {
        quality: cameraConfig?.recordingQuality || 'medium',
        duration: 'continuous'
      }
    })
  }

  const handleStopRecording = () => {
    onDataRequest?.(id, {
      action: 'stop_recording'
    })
  }

  const handleCaptureFrame = () => {
    const newFrame = { ...currentData.currentFrame, timestamp: Date.now() }
    setCapturedFrames(prev => [newFrame, ...prev.slice(0, 9)]) // Keep last 10 frames
    
    onDataRequest?.(id, {
      action: 'capture_frame',
      save: true
    })
  }

  const handleZoomChange = (value: number[]) => {
    handleConfigChange('zoom', value[0])
  }

  const renderCameraView = () => {
    const transform = `
      scale(${(cameraConfig?.zoom || 100) / 100})
      ${cameraConfig?.flipHorizontal ? 'scaleX(-1)' : ''}
      ${cameraConfig?.flipVertical ? 'scaleY(-1)' : ''}
      rotate(${cameraConfig?.rotation || 0}deg)
    `

    return (
      <div className="relative bg-black rounded overflow-hidden h-48">
        <div 
          ref={videoRef}
          className="w-full h-full flex items-center justify-center"
          style={{ transform }}
        >
          <img
            src={currentData.currentFrame?.imageData || ''}
            alt="Camera feed"
            className="max-w-full max-h-full object-contain"
            style={{
              filter: `
                brightness(${(cameraConfig?.brightness || 100) / 100})
                contrast(${(cameraConfig?.contrast || 100) / 100})
                saturate(${(cameraConfig?.saturation || 100) / 100})
              `
            }}
          />
        </div>

        {/* Overlay */}
        {cameraConfig?.showOverlay && cameraConfig?.overlayType !== 'none' && (
          <div className="absolute inset-0 pointer-events-none">
            {cameraConfig.overlayType === 'crosshair' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Crosshair className="h-8 w-8 text-red-500" />
              </div>
            )}
            {cameraConfig.overlayType === 'grid' && (
              <div className="absolute inset-0">
                <Grid3X3 className="w-full h-full text-white/30" />
              </div>
            )}
            {currentData.overlayData?.map((overlay, index) => (
              <div
                key={index}
                className="absolute"
                style={{
                  left: overlay.x,
                  top: overlay.y,
                  color: overlay.color || '#fff'
                }}
              >
                {overlay.type === 'text' && (
                  <span className="text-xs font-mono bg-black/50 px-1 rounded">
                    {overlay.text}
                  </span>
                )}
                {overlay.type === 'marker' && (
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: overlay.color }}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Controls overlay */}
        {cameraConfig?.showControls && (
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
            <div className="flex gap-1">
              <Button
                variant="secondary"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handleCaptureFrame}
                title="Capture frame"
              >
                <Camera className="h-4 w-4" />
              </Button>
              <Button
                variant={currentData.isRecording ? "destructive" : "secondary"}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={currentData.isRecording ? handleStopRecording : handleStartRecording}
                title={currentData.isRecording ? "Stop recording" : "Start recording"}
              >
                {currentData.isRecording ? <Square className="h-4 w-4" /> : <Video className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex gap-1">
              <Button
                variant="secondary"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setIsFullscreen(!isFullscreen)}
                title="Toggle fullscreen"
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setIsExpanded(!isExpanded)}
                title="Settings"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Status overlay */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
          <Badge className={`text-xs ${getStatusColor(currentData.cameraStatus)}`}>
            {currentData.cameraStatus}
          </Badge>
          <div className="flex items-center gap-2">
            {currentData.isRecording && (
              <div className="flex items-center gap-1 bg-red-600 text-white px-2 py-1 rounded text-xs">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                REC {formatDuration(currentData.recordingDuration)}
              </div>
            )}
            <span className="text-xs text-white bg-black/50 px-1 rounded">
              {currentData.frameRate} FPS
            </span>
          </div>
        </div>
      </div>
    )
  }

  const renderCameraInfo = () => (
    <div className="grid grid-cols-2 gap-2 text-xs">
      <div>
        <div className="text-muted-foreground">Resolution</div>
        <div className="font-mono">{currentData.resolution?.width || 0}x{currentData.resolution?.height || 0}</div>
      </div>
      <div>
        <div className="text-muted-foreground">Frame Rate</div>
        <div className="font-mono">{currentData.frameRate || 0} FPS</div>
      </div>
      <div>
        <div className="text-muted-foreground">Frame #</div>
        <div className="font-mono">{currentData.currentFrame?.frameNumber || 0}</div>
      </div>
      <div>
        <div className="text-muted-foreground">Format</div>
        <div className="font-mono">{currentData.currentFrame?.format?.toUpperCase() || 'UNKNOWN'}</div>
      </div>
      <div>
        <div className="text-muted-foreground">Storage</div>
        <div className="font-mono">
          {formatFileSize(currentData.storageUsed || 0)} / {formatFileSize(currentData.storageTotal || 0)}
        </div>
      </div>
      <div>
        <div className="text-muted-foreground">Stream URL</div>
        <div className="font-mono text-xs truncate">
          {cameraConfig?.streamUrl || 'Local camera'}
        </div>
      </div>
    </div>
  )

  const renderControls = () => (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label className="text-xs">Zoom: {cameraConfig?.zoom || 100}%</Label>
        <Slider
          value={[cameraConfig?.zoom || 100]}
          onValueChange={handleZoomChange}
          min={50}
          max={300}
          step={10}
          className="w-full"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Brightness</Label>
          <Slider
            value={[cameraConfig?.brightness || 100]}
            onValueChange={(value) => handleConfigChange('brightness', value[0])}
            min={50}
            max={150}
            step={5}
            className="w-full"
          />
        </div>
        <div>
          <Label className="text-xs">Contrast</Label>
          <Slider
            value={[cameraConfig?.contrast || 100]}
            onValueChange={(value) => handleConfigChange('contrast', value[0])}
            min={50}
            max={150}
            step={5}
            className="w-full"
          />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Switch
            id="flip-h"
            checked={cameraConfig?.flipHorizontal || false}
            onCheckedChange={(checked) => handleConfigChange('flipHorizontal', checked)}
          />
          <Label htmlFor="flip-h" className="text-xs">Flip H</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="flip-v"
            checked={cameraConfig?.flipVertical || false}
            onCheckedChange={(checked) => handleConfigChange('flipVertical', checked)}
          />
          <Label htmlFor="flip-v" className="text-xs">Flip V</Label>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const rotations = [0, 90, 180, 270]
            const currentIndex = rotations.indexOf(cameraConfig?.rotation || 0)
            const nextRotation = rotations[(currentIndex + 1) % rotations.length]
            handleConfigChange('rotation', nextRotation)
          }}
        >
          <RotateCw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  const renderSettings = () => (
    <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded">
      <div className="space-y-2">
        <Label className="text-xs">Resolution</Label>
        <Select
          value={cameraConfig?.resolution || 'auto'}
          onValueChange={(value) => handleConfigChange('resolution', value)}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="auto">Auto</SelectItem>
            <SelectItem value="720p">720p (HD)</SelectItem>
            <SelectItem value="1080p">1080p (FHD)</SelectItem>
            <SelectItem value="4K">4K (UHD)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Recording Quality</Label>
        <Select
          value={cameraConfig?.recordingQuality || 'medium'}
          onValueChange={(value) => handleConfigChange('recordingQuality', value)}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Overlay Type</Label>
        <Select
          value={cameraConfig?.overlayType || 'none'}
          onValueChange={(value) => handleConfigChange('overlayType', value)}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="crosshair">Crosshair</SelectItem>
            <SelectItem value="grid">Grid</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Stream URL</Label>
        <Input
          value={cameraConfig?.streamUrl || ''}
          onChange={(e) => handleConfigChange('streamUrl', e.target.value)}
          placeholder="rtsp://..."
          className="h-8 text-xs"
        />
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="show-overlay"
          checked={cameraConfig?.showOverlay || false}
          onCheckedChange={(checked) => handleConfigChange('showOverlay', checked)}
        />
        <Label htmlFor="show-overlay" className="text-xs">Show Overlay</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="auto-record"
          checked={cameraConfig?.autoRecord || false}
          onCheckedChange={(checked) => handleConfigChange('autoRecord', checked)}
        />
        <Label htmlFor="auto-record" className="text-xs">Auto Record</Label>
      </div>
    </div>
  )

  return (
    <Card className="w-full h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            {cameraConfig?.title || title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge 
              variant={currentData.isStreaming ? "default" : "secondary"}
              className="text-xs"
            >
              {currentData.isStreaming ? 'Live' : 'Offline'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isExpanded && renderSettings()}
        
        {renderCameraView()}
        
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info" className="text-xs">Camera Info</TabsTrigger>
            <TabsTrigger value="controls" className="text-xs">Controls</TabsTrigger>
          </TabsList>
          <TabsContent value="info" className="mt-3">
            {renderCameraInfo()}
          </TabsContent>
          <TabsContent value="controls" className="mt-3">
            {renderControls()}
          </TabsContent>
        </Tabs>

        <div className="text-xs text-muted-foreground text-center">
          Last Frame: {new Date(currentData.currentFrame.timestamp).toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  )
}

// AriesMod configuration
export const ImageCameraMod: AriesMod = {
  metadata: {
    id: 'image-camera',
    name: 'ImageCamera',
    displayName: 'Image/Camera Widget',
    description: 'Live camera feed widget with overlay support, recording, and image controls',
    category: 'visualization',
    tags: ['camera', 'video', 'image', 'live', 'recording', 'overlay'],
    version: '1.0.0',
    author: 'AriesUI',
    icon: Camera,
    thumbnail: '/thumbnails/image-camera.png',
    defaultWidth: 400,
    defaultHeight: 400,
    minWidth: 300,
    minHeight: 250,
    maxWidth: 800,
    maxHeight: 600,
    supportedDataTypes: ['camera', 'video', 'image'],
    configurable: true,
    hardwareIntegrated: true
  },
  component: ImageCamera,
  defaultConfig: {
    title: 'Camera Feed',
    resolution: 'auto',
    frameRate: 30,
    showOverlay: false,
    overlayType: 'none',
    showControls: true,
    autoRecord: false,
    recordingQuality: 'medium',
    zoom: 100,
    brightness: 100,
    contrast: 100,
    saturation: 100,
    exposure: 100,
    flipHorizontal: false,
    flipVertical: false,
    rotation: 0
  },
  generateDummyData: () => ({
    value: 'camera_frame',
    timestamp: new Date().toISOString(),
    currentFrame: {
      imageData: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjI0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkNhbWVyYSBGZWVkPC90ZXh0Pjwvc3ZnPg==',
      timestamp: Date.now(),
      frameNumber: Math.floor(Math.random() * 10000),
      width: 1920,
      height: 1080,
      format: 'jpeg' as const
    },
    isStreaming: true,
    isRecording: false,
    recordingDuration: 0,
    frameRate: 30,
    resolution: { width: 1920, height: 1080 },
    cameraStatus: 'connected' as const,
    storageUsed: 2.5,
    storageTotal: 32.0,
    metadata: { source: 'demo' }
  }),
  validateConfig: (config: Record<string, any>) => {
    return typeof config.title === 'string' && 
           typeof config.frameRate === 'number' &&
           config.frameRate > 0 && config.frameRate <= 60
  }
}

export default ImageCamera 