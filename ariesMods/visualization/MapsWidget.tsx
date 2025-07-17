import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  MapPin, 
  Navigation, 
  Crosshair, 
  Layers, 
  Route, 
  Settings, 
  Satellite,
  Map as MapIcon,
  Target,
  Compass
} from 'lucide-react'
import type { AriesModProps, AriesMod, AriesModData } from '@/types/ariesmods'

export interface MapsWidgetConfig {
  title: string
  mapType: 'satellite' | 'roadmap' | 'hybrid' | 'terrain'
  showTrail: boolean
  trailLength: number
  showMarkers: boolean
  showCompass: boolean
  showScale: boolean
  centerOnRobot: boolean
  zoom: number
  theme: 'light' | 'dark' | 'auto'
  units: 'metric' | 'imperial'
}

export interface LocationPoint {
  lat: number
  lng: number
  timestamp: number
  heading?: number
  speed?: number
  altitude?: number
  accuracy?: number
}

export interface Waypoint {
  id: string
  name: string
  lat: number
  lng: number
  type: 'destination' | 'checkpoint' | 'home' | 'poi'
  description?: string
}

export interface MapsData extends AriesModData {
  currentLocation: LocationPoint
  trail: LocationPoint[]
  waypoints: Waypoint[]
  route?: LocationPoint[]
  targetLocation?: LocationPoint
  isTracking: boolean
  gpsStatus: 'connected' | 'disconnected' | 'searching' | 'error'
  satelliteCount?: number
  hdop?: number
}

const MapsWidget: React.FC<AriesModProps> = ({
  id,
  title,
  width = 400,
  height = 300,
  data,
  config,
  onConfigChange,
  onDataRequest
}) => {
  const mapConfig = config as MapsWidgetConfig
  const mapData = data as MapsData

  const [selectedWaypoint, setSelectedWaypoint] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [mapCenter, setMapCenter] = useState<LocationPoint | null>(null)

  // Dummy data for demo purposes
  const getDummyData = useCallback((): MapsData => ({
    value: mapData?.currentLocation || { lat: 37.7749, lng: -122.4194 },
    timestamp: new Date().toISOString(),
    currentLocation: mapData?.currentLocation || {
      lat: 37.7749,
      lng: -122.4194,
      timestamp: Date.now(),
      heading: 45,
      speed: 2.5,
      altitude: 100,
      accuracy: 3.2
    },
    trail: mapData?.trail || [
      { lat: 37.7749, lng: -122.4194, timestamp: Date.now() - 10000, heading: 30 },
      { lat: 37.7750, lng: -122.4190, timestamp: Date.now() - 8000, heading: 35 },
      { lat: 37.7752, lng: -122.4185, timestamp: Date.now() - 6000, heading: 40 },
      { lat: 37.7755, lng: -122.4180, timestamp: Date.now() - 4000, heading: 42 },
      { lat: 37.7758, lng: -122.4175, timestamp: Date.now() - 2000, heading: 45 }
    ],
    waypoints: mapData?.waypoints || [
      { 
        id: 'home', 
        name: 'Home Base', 
        lat: 37.7749, 
        lng: -122.4194, 
        type: 'home',
        description: 'Starting point' 
      },
      { 
        id: 'checkpoint1', 
        name: 'Checkpoint Alpha', 
        lat: 37.7760, 
        lng: -122.4170, 
        type: 'checkpoint',
        description: 'First waypoint' 
      },
      { 
        id: 'destination', 
        name: 'Target Location', 
        lat: 37.7770, 
        lng: -122.4150, 
        type: 'destination',
        description: 'Final destination' 
      }
    ],
    targetLocation: {
      lat: 37.7770,
      lng: -122.4150,
      timestamp: Date.now()
    },
    isTracking: mapData?.isTracking ?? true,
    gpsStatus: mapData?.gpsStatus || 'connected',
    satelliteCount: mapData?.satelliteCount || 8,
    hdop: mapData?.hdop || 1.2,
    metadata: { source: 'gps', system: 'navigation' }
  }), [mapData])

  const currentData = mapData || getDummyData()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800'
      case 'searching':
        return 'bg-yellow-100 text-yellow-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getWaypointIcon = (type: string) => {
    switch (type) {
      case 'home':
        return <MapIcon className="h-4 w-4" />
      case 'destination':
        return <Target className="h-4 w-4" />
      case 'checkpoint':
        return <MapPin className="h-4 w-4" />
      default:
        return <MapPin className="h-4 w-4" />
    }
  }

  const formatCoordinate = (coord: number, type: 'lat' | 'lng') => {
    const direction = type === 'lat' ? (coord >= 0 ? 'N' : 'S') : (coord >= 0 ? 'E' : 'W')
    return `${Math.abs(coord).toFixed(6)}° ${direction}`
  }

  const formatDistance = (distanceInMeters: number) => {
    const units = mapConfig?.units || 'metric'
    if (units === 'imperial') {
      const feet = distanceInMeters * 3.28084
      return feet > 5280 ? `${(feet / 5280).toFixed(2)} mi` : `${feet.toFixed(0)} ft`
    } else {
      return distanceInMeters > 1000 ? `${(distanceInMeters / 1000).toFixed(2)} km` : `${distanceInMeters.toFixed(0)} m`
    }
  }

  const calculateDistance = (p1: LocationPoint, p2: LocationPoint) => {
    const R = 6371000 // Earth's radius in meters
    const dLat = (p2.lat - p1.lat) * Math.PI / 180
    const dLng = (p2.lng - p1.lng) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  const handleConfigChange = (key: keyof MapsWidgetConfig, value: any) => {
    onConfigChange?.({
      ...mapConfig,
      [key]: value
    })
  }

  const handleCenterOnRobot = () => {
    setMapCenter(currentData.currentLocation)
    onDataRequest?.(id, {
      action: 'center',
      location: currentData.currentLocation
    })
  }

  const handleSetTarget = (lat: number, lng: number) => {
    onDataRequest?.(id, {
      action: 'set_target',
      target: { lat, lng, timestamp: Date.now() }
    })
  }

  const renderMiniMap = () => {
    const center = mapCenter || currentData.currentLocation
    
    return (
      <div className="relative bg-muted rounded border h-32 overflow-hidden">
        {/* Simple coordinate display instead of actual map */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="text-lg font-mono">
            📍
          </div>
          <div className="text-xs text-muted-foreground">
            {formatCoordinate(center?.lat || 0, 'lat')}
          </div>
          <div className="text-xs text-muted-foreground">
            {formatCoordinate(center?.lng || 0, 'lng')}
          </div>
          {currentData.currentLocation?.heading !== undefined && (
            <div className="flex items-center gap-1 mt-1">
              <Compass className="h-3 w-3" />
              <span className="text-xs">{(currentData.currentLocation?.heading || 0).toFixed(0)}°</span>
            </div>
          )}
        </div>
        
        {/* GPS Status overlay */}
        <div className="absolute top-2 right-2">
          <Badge variant="outline" className={`text-xs ${getStatusColor(currentData.gpsStatus)}`}>
            GPS: {currentData.gpsStatus}
          </Badge>
        </div>
        
        {/* Map controls */}
        <div className="absolute bottom-2 right-2 flex gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={handleCenterOnRobot}
            title="Center on robot"
          >
            <Crosshair className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setIsExpanded(!isExpanded)}
            title="Settings"
          >
            <Settings className="h-3 w-3" />
          </Button>
        </div>
      </div>
    )
  }

  const renderLocationInfo = () => (
    <div className="grid grid-cols-2 gap-2 text-xs">
      <div>
        <div className="text-muted-foreground">Latitude</div>
        <div className="font-mono">{formatCoordinate(currentData.currentLocation?.lat || 0, 'lat')}</div>
      </div>
      <div>
        <div className="text-muted-foreground">Longitude</div>
        <div className="font-mono">{formatCoordinate(currentData.currentLocation?.lng || 0, 'lng')}</div>
      </div>
      {currentData.currentLocation?.speed !== undefined && (
        <div>
          <div className="text-muted-foreground">Speed</div>
          <div className="font-mono">{(currentData.currentLocation?.speed || 0).toFixed(1)} m/s</div>
        </div>
      )}
      {currentData.currentLocation?.heading !== undefined && (
        <div>
          <div className="text-muted-foreground">Heading</div>
          <div className="font-mono">{(currentData.currentLocation?.heading || 0).toFixed(0)}°</div>
        </div>
      )}
      {currentData.currentLocation?.altitude !== undefined && (
        <div>
          <div className="text-muted-foreground">Altitude</div>
          <div className="font-mono">{(currentData.currentLocation?.altitude || 0).toFixed(0)} m</div>
        </div>
      )}
      {currentData.currentLocation?.accuracy !== undefined && (
        <div>
          <div className="text-muted-foreground">Accuracy</div>
          <div className="font-mono">±{(currentData.currentLocation?.accuracy || 0).toFixed(1)} m</div>
        </div>
      )}
    </div>
  )

  const renderWaypoints = () => (
    <div className="space-y-2">
      {(currentData.waypoints || []).map((waypoint) => {
        const distance = calculateDistance(currentData.currentLocation, waypoint)
        return (
          <div 
            key={waypoint.id}
            className={`
              flex items-center justify-between p-2 rounded border cursor-pointer transition-colors
              ${selectedWaypoint === waypoint.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'}
            `}
            onClick={() => setSelectedWaypoint(
              selectedWaypoint === waypoint.id ? null : waypoint.id
            )}
          >
            <div className="flex items-center gap-2">
              {getWaypointIcon(waypoint.type)}
              <div>
                <div className="text-sm font-medium">{waypoint.name}</div>
                {selectedWaypoint === waypoint.id && waypoint.description && (
                  <div className="text-xs text-muted-foreground">{waypoint.description}</div>
                )}
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              {formatDistance(distance)}
            </div>
          </div>
        )
      })}
    </div>
  )

  const renderGPSStatus = () => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">GPS Status</span>
        <Badge className={getStatusColor(currentData.gpsStatus)}>
          {currentData.gpsStatus}
        </Badge>
      </div>
      {currentData.satelliteCount !== undefined && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Satellites</span>
          <span>{currentData.satelliteCount}/12</span>
        </div>
      )}
      {currentData.hdop !== undefined && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">HDOP</span>
          <span>{currentData.hdop.toFixed(1)}</span>
        </div>
      )}
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Tracking</span>
        <Badge variant={currentData.isTracking ? "default" : "secondary"}>
          {currentData.isTracking ? 'Active' : 'Inactive'}
        </Badge>
      </div>
    </div>
  )

  const renderSettings = () => (
    <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded">
      <div className="space-y-2">
        <Label className="text-xs">Map Type</Label>
        <Select
          value={mapConfig?.mapType || 'roadmap'}
          onValueChange={(value) => handleConfigChange('mapType', value)}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="roadmap">Roadmap</SelectItem>
            <SelectItem value="satellite">Satellite</SelectItem>
            <SelectItem value="hybrid">Hybrid</SelectItem>
            <SelectItem value="terrain">Terrain</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Units</Label>
        <Select
          value={mapConfig?.units || 'metric'}
          onValueChange={(value) => handleConfigChange('units', value)}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="metric">Metric</SelectItem>
            <SelectItem value="imperial">Imperial</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="show-trail"
          checked={mapConfig?.showTrail || false}
          onCheckedChange={(checked) => handleConfigChange('showTrail', checked)}
        />
        <Label htmlFor="show-trail" className="text-xs">Show Trail</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="center-on-robot"
          checked={mapConfig?.centerOnRobot || false}
          onCheckedChange={(checked) => handleConfigChange('centerOnRobot', checked)}
        />
        <Label htmlFor="center-on-robot" className="text-xs">Follow Robot</Label>
      </div>
    </div>
  )

  return (
    <Card className="w-full h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            {mapConfig?.title || title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge 
              variant={currentData.isTracking ? "default" : "secondary"}
              className="text-xs"
            >
              {currentData.isTracking ? 'Tracking' : 'Offline'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isExpanded && renderSettings()}
        
        {renderMiniMap()}
        
        <Tabs defaultValue="location" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="location" className="text-xs">Location</TabsTrigger>
            <TabsTrigger value="waypoints" className="text-xs">Waypoints</TabsTrigger>
            <TabsTrigger value="status" className="text-xs">GPS</TabsTrigger>
          </TabsList>
          <TabsContent value="location" className="mt-3">
            {renderLocationInfo()}
          </TabsContent>
          <TabsContent value="waypoints" className="mt-3">
            {renderWaypoints()}
          </TabsContent>
          <TabsContent value="status" className="mt-3">
            {renderGPSStatus()}
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
export const MapsWidgetMod: AriesMod = {
  metadata: {
    id: 'maps-widget',
    name: 'MapsWidget',
    displayName: 'GPS Maps Widget',
    description: 'GPS navigation and mapping widget for tracking location, routes, and waypoints',
    category: 'visualization',
    tags: ['gps', 'maps', 'navigation', 'location', 'tracking', 'waypoints'],
    version: '1.0.0',
    author: 'AriesUI',
    icon: MapPin,
    thumbnail: '/thumbnails/maps-widget.png',
    defaultWidth: 400,
    defaultHeight: 350,
    minWidth: 300,
    minHeight: 250,
    maxWidth: 800,
    maxHeight: 600,
    supportedDataTypes: ['gps', 'location', 'navigation'],
    configurable: true,
    hardwareIntegrated: true
  },
  component: MapsWidget,
  defaultConfig: {
    title: 'GPS Maps',
    mapType: 'roadmap',
    showTrail: true,
    trailLength: 100,
    showMarkers: true,
    showCompass: true,
    showScale: true,
    centerOnRobot: true,
    zoom: 15,
    theme: 'auto',
    units: 'metric'
  },
  generateDummyData: () => ({
    value: { lat: 37.7749, lng: -122.4194 },
    timestamp: new Date().toISOString(),
    currentLocation: {
      lat: 37.7749,
      lng: -122.4194,
      timestamp: Date.now(),
      heading: 45,
      speed: 2.5,
      altitude: 100,
      accuracy: 3.2
    },
    trail: [
      { lat: 37.7749, lng: -122.4194, timestamp: Date.now() - 10000 },
      { lat: 37.7752, lng: -122.4190, timestamp: Date.now() - 5000 }
    ],
    waypoints: [
      { id: 'home', name: 'Home', lat: 37.7749, lng: -122.4194, type: 'home' as const }
    ],
    isTracking: true,
    gpsStatus: 'connected' as const,
    satelliteCount: 8,
    hdop: 1.2,
    metadata: { source: 'demo' }
  }),
  validateConfig: (config: Record<string, any>) => {
    return typeof config.title === 'string' && 
           ['roadmap', 'satellite', 'hybrid', 'terrain'].includes(config.mapType)
  }
}

export default MapsWidget 