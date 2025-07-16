"use client"

import React, { useState, useEffect } from 'react'
import { Settings, Plus, X, Calculator, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useComms } from '@/components/comms-context'
import { useAvailableStreams } from '@/hooks/use-comms-stream'

interface StreamMapping {
  id: string
  streamId: string
  streamName: string
  multiplier: number
  formula: string
  unit: string
  enabled: boolean
}

interface StreamConfiguratorProps {
  widgetId: string
  currentMappings: StreamMapping[]
  onMappingsChange: (mappings: StreamMapping[]) => void
  onClose: () => void
}

export function StreamConfigurator({ 
  widgetId, 
  currentMappings, 
  onMappingsChange, 
  onClose 
}: StreamConfiguratorProps) {
  const { state } = useComms()
  const { availableStreams, isConnected } = useAvailableStreams()
  const [mappings, setMappings] = useState<StreamMapping[]>(currentMappings)
  const [newMapping, setNewMapping] = useState<Partial<StreamMapping>>({
    multiplier: 1,
    formula: '',
    unit: '',
    enabled: true
  })

  // Format available streams for display
  const formattedStreams = React.useMemo(() => {
    return availableStreams.map(streamId => {
      // Better stream name formatting
      const parts = streamId.split('.')
      const streamName = parts.length > 1 
        ? `${parts[0]} - ${parts.slice(1).join('.')}`  // "module1 - temperature"
        : streamId
      
      return {
        id: streamId,
        name: streamName,
        unit: '',
        datatype: 'float'
      }
    })
  }, [availableStreams])

  const addMapping = () => {
    if (!newMapping.streamId) return

    const stream = formattedStreams.find(s => s.id === newMapping.streamId)
    if (!stream) return

    const mapping: StreamMapping = {
      id: `${widgetId}_${Date.now()}`,
      streamId: newMapping.streamId,
      streamName: stream.name,
      multiplier: newMapping.multiplier || 1,
      formula: newMapping.formula || '',
      unit: newMapping.unit || stream.unit || '',
      enabled: newMapping.enabled !== false
    }

    const updatedMappings = [...mappings, mapping]
    setMappings(updatedMappings)
    setNewMapping({
      multiplier: 1,
      formula: '',
      unit: '',
      enabled: true
    })
  }

  const removeMapping = (mappingId: string) => {
    const updatedMappings = mappings.filter(m => m.id !== mappingId)
    setMappings(updatedMappings)
  }

  const updateMapping = (mappingId: string, updates: Partial<StreamMapping>) => {
    const updatedMappings = mappings.map(m => 
      m.id === mappingId ? { ...m, ...updates } : m
    )
    setMappings(updatedMappings)
  }

  const handleSave = () => {
    // Validate all mappings before saving
    const validMappings = mappings.filter(mapping => {
      // Check if formula is valid
      if (mapping.formula && mapping.formula.trim()) {
        try {
          const testFormula = mapping.formula.replace(/x/g, '1')
          eval(testFormula)
          return true
        } catch (error) {
          console.warn(`Invalid formula for ${mapping.streamName}:`, error)
          return false
        }
      }
      return true
    })
    
    if (validMappings.length !== mappings.length) {
      alert('Some mappings have invalid formulas and will be removed.')
    }
    
    onMappingsChange(validMappings)
    onClose()
  }

  // Test formula evaluation
  const testFormula = (formula: string, testValue: number = 100) => {
    try {
      // Simple formula evaluation (x = input value)
      const result = eval(formula.replace(/x/g, testValue.toString()))
      return { valid: true, result }
    } catch (error) {
      return { valid: false, error: error.message }
    }
  }

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Enhanced Stream Configuration - Widget {widgetId}
          <Badge variant={isConnected ? "default" : "secondary"}>
            {isConnected ? 'Connected' : 'Offline'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{availableStreams.length}</div>
            <div className="text-sm text-muted-foreground">Available Streams</div>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{mappings.filter(m => m.enabled).length}</div>
            <div className="text-sm text-muted-foreground">Active Mappings</div>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{mappings.filter(m => m.formula && m.formula.trim()).length}</div>
            <div className="text-sm text-muted-foreground">With Formulas</div>
          </div>
        </div>
        
        {/* Current Mappings */}
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            Current Stream Mappings
            <Badge variant="outline">{mappings.length}</Badge>
          </h3>
          {mappings.length === 0 ? (
            <p className="text-muted-foreground">No streams configured</p>
          ) : (
            <div className="space-y-3">
              {mappings.map((mapping) => (
                <Card key={mapping.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={mapping.enabled ? "default" : "secondary"}>
                          {mapping.streamName}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {mapping.streamId}
                        </span>
                        {mapping.enabled ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <Label className="text-xs">Multiplier</Label>
                          <Input
                            type="number"
                            value={mapping.multiplier}
                            onChange={(e) => updateMapping(mapping.id, { 
                              multiplier: parseFloat(e.target.value) || 1 
                            })}
                            className="h-8"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Formula (optional)</Label>
                          <Input
                            value={mapping.formula}
                            onChange={(e) => updateMapping(mapping.id, { 
                              formula: e.target.value 
                            })}
                            placeholder="e.g., x * 2 + 10"
                            className="h-8"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Unit</Label>
                          <Input
                            value={mapping.unit}
                            onChange={(e) => updateMapping(mapping.id, { 
                              unit: e.target.value 
                            })}
                            className="h-8"
                          />
                        </div>
                      </div>
                      
                      {mapping.formula && (
                        <div className="mt-2 text-xs">
                          <span className="text-muted-foreground">
                            Test (x=100): {testFormula(mapping.formula).valid 
                              ? testFormula(mapping.formula).result 
                              : 'Invalid formula'}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={mapping.enabled ? "default" : "outline"}
                        onClick={() => updateMapping(mapping.id, { 
                          enabled: !mapping.enabled 
                        })}
                      >
                        <Zap className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeMapping(mapping.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Add New Mapping */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Add New Stream</h3>
          <div className="space-y-3">
            <div>
              <Label>Select Stream</Label>
              <Select 
                value={newMapping.streamId} 
                onValueChange={(value) => setNewMapping({ ...newMapping, streamId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a hardware stream" />
                </SelectTrigger>
                <SelectContent>
                  {formattedStreams.map((stream) => (
                    <SelectItem key={stream.id} value={stream.id}>
                      <div className="flex items-center gap-2">
                        <span>{stream.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {stream.datatype}
                        </Badge>
                        {stream.unit && (
                          <span className="text-xs text-muted-foreground">
                            {stream.unit}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Multiplier</Label>
                <Input
                  type="number"
                  value={newMapping.multiplier}
                  onChange={(e) => setNewMapping({ 
                    ...newMapping, 
                    multiplier: parseFloat(e.target.value) || 1 
                  })}
                  placeholder="1.0"
                />
              </div>
              <div>
                <Label>Formula (optional)</Label>
                <Input
                  value={newMapping.formula}
                  onChange={(e) => setNewMapping({ 
                    ...newMapping, 
                    formula: e.target.value 
                  })}
                  placeholder="x * 2 + 10"
                />
              </div>
              <div>
                <Label>Unit</Label>
                <Input
                  value={newMapping.unit}
                  onChange={(e) => setNewMapping({ 
                    ...newMapping, 
                    unit: e.target.value 
                  })}
                  placeholder="°C, V, etc."
                />
              </div>
            </div>

            <Button onClick={addMapping} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Stream Mapping
            </Button>
          </div>
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Configuration
          </Button>
        </div>

        {/* Connection Status */}
        <div className="text-sm text-muted-foreground">
          <p>Connection Status: {state.connectionStatus}</p>
          <p>Available Streams: {formattedStreams.length}</p>
          <p>Connected Modules: {state.connectedModules?.size || 0}</p>
        </div>
      </CardContent>
    </Card>
  )
} 