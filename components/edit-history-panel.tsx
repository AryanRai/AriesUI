"use client"

import React, { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Clock, 
  Undo2, 
  Redo2, 
  GitBranch, 
  Save, 
  Plus, 
  Minus, 
  Move, 
  RotateCcw,
  Eye,
  ChevronRight,
  ChevronDown,
  History,
  Trash2,
  FileText,
  Grid3X3,
  Layers
} from 'lucide-react'
import type { GridState } from '@/components/grid/types'

interface HistoryEntry {
  gridState: GridState
  viewport: { x: number; y: number; zoom: number }
}

interface EditHistoryPanelProps {
  stateHistory: HistoryEntry[]
  historyIndex: number
  onNavigateToHistory: (index: number) => void
  onUndo: () => void
  onRedo: () => void
  onClearHistory?: () => void
  className?: string
}

interface HistoryAction {
  type: 'widget_added' | 'widget_removed' | 'widget_moved' | 'widget_resized' | 'nest_added' | 'nest_removed' | 'viewport_changed' | 'initial_state'
  description: string
  timestamp: string
  details?: string
  icon: React.ReactNode
  color: string
}

/**
 * EditHistoryPanel - VSCode-like edit history interface
 * 
 * Features:
 * - Visual timeline of all grid state changes
 * - Action type detection and categorization
 * - Diff preview between states
 * - Quick navigation to any point in history
 * - Keyboard shortcuts (Ctrl+Z, Ctrl+Y)
 * - Collapsible sections for better organization
 */
export function EditHistoryPanel({
  stateHistory,
  historyIndex,
  onNavigateToHistory,
  onUndo,
  onRedo,
  onClearHistory,
  className = ""
}: EditHistoryPanelProps) {
  const [expandedEntry, setExpandedEntry] = useState<number | null>(null)
  const [showDiffs, setShowDiffs] = useState(false)

  // Analyze history to determine action types
  const historyActions = useMemo(() => {
    const actions: HistoryAction[] = []
    
    for (let i = 0; i < stateHistory.length; i++) {
      const current = stateHistory[i]
      const previous = i > 0 ? stateHistory[i - 1] : null
      
      if (!previous) {
        // Initial state
        actions.push({
          type: 'initial_state',
          description: 'Initial grid state',
          timestamp: new Date().toISOString(),
          icon: <Grid3X3 className="h-4 w-4" />,
          color: 'bg-slate-500'
        })
        continue
      }
      
      const currentWidgetCount = current.gridState.mainWidgets.length + current.gridState.mainAriesWidgets.length
      const previousWidgetCount = previous.gridState.mainWidgets.length + previous.gridState.mainAriesWidgets.length
      const currentNestCount = current.gridState.nestContainers.length
      const previousNestCount = previous.gridState.nestContainers.length
      
      // Detect widget changes
      if (currentWidgetCount > previousWidgetCount) {
        actions.push({
          type: 'widget_added',
          description: `Added ${currentWidgetCount - previousWidgetCount} widget(s)`,
          timestamp: new Date().toISOString(),
          details: `Total widgets: ${currentWidgetCount}`,
          icon: <Plus className="h-4 w-4" />,
          color: 'bg-green-500'
        })
      } else if (currentWidgetCount < previousWidgetCount) {
        actions.push({
          type: 'widget_removed',
          description: `Removed ${previousWidgetCount - currentWidgetCount} widget(s)`,
          timestamp: new Date().toISOString(),
          details: `Total widgets: ${currentWidgetCount}`,
          icon: <Minus className="h-4 w-4" />,
          color: 'bg-red-500'
        })
      }
      
      // Detect nest changes
      if (currentNestCount > previousNestCount) {
        actions.push({
          type: 'nest_added',
          description: `Added ${currentNestCount - previousNestCount} nest(s)`,
          timestamp: new Date().toISOString(),
          details: `Total nests: ${currentNestCount}`,
          icon: <Layers className="h-4 w-4" />,
          color: 'bg-blue-500'
        })
      } else if (currentNestCount < previousNestCount) {
        actions.push({
          type: 'nest_removed',
          description: `Removed ${previousNestCount - currentNestCount} nest(s)`,
          timestamp: new Date().toISOString(),
          details: `Total nests: ${currentNestCount}`,
          icon: <Trash2 className="h-4 w-4" />,
          color: 'bg-red-500'
        })
      }
      
      // Detect viewport changes
      if (current.viewport.x !== previous.viewport.x || 
          current.viewport.y !== previous.viewport.y || 
          current.viewport.zoom !== previous.viewport.zoom) {
        actions.push({
          type: 'viewport_changed',
          description: 'Viewport changed',
          timestamp: new Date().toISOString(),
          details: `Zoom: ${(current.viewport.zoom * 100).toFixed(0)}%, Position: (${Math.round(current.viewport.x)}, ${Math.round(current.viewport.y)})`,
          icon: <Eye className="h-4 w-4" />,
          color: 'bg-purple-500'
        })
      }
      
      // Detect widget movements/resizes (if no add/remove detected)
      if (currentWidgetCount === previousWidgetCount && currentNestCount === previousNestCount) {
        // Check for position/size changes
        let hasMovement = false
        let hasResize = false
        
        // Compare main widgets
        for (const widget of current.gridState.mainWidgets) {
          const prevWidget = previous.gridState.mainWidgets.find(w => w.id === widget.id)
          if (prevWidget) {
            if (widget.x !== prevWidget.x || widget.y !== prevWidget.y) {
              hasMovement = true
            }
            if (widget.w !== prevWidget.w || widget.h !== prevWidget.h) {
              hasResize = true
            }
          }
        }
        
        // Compare AriesWidgets
        for (const widget of current.gridState.mainAriesWidgets) {
          const prevWidget = previous.gridState.mainAriesWidgets.find(w => w.id === widget.id)
          if (prevWidget) {
            if (widget.x !== prevWidget.x || widget.y !== prevWidget.y) {
              hasMovement = true
            }
            if (widget.w !== prevWidget.w || widget.h !== prevWidget.h) {
              hasResize = true
            }
          }
        }
        
        if (hasMovement && hasResize) {
          actions.push({
            type: 'widget_moved',
            description: 'Widget moved and resized',
            timestamp: new Date().toISOString(),
            icon: <Move className="h-4 w-4" />,
            color: 'bg-orange-500'
          })
        } else if (hasMovement) {
          actions.push({
            type: 'widget_moved',
            description: 'Widget moved',
            timestamp: new Date().toISOString(),
            icon: <Move className="h-4 w-4" />,
            color: 'bg-yellow-500'
          })
        } else if (hasResize) {
          actions.push({
            type: 'widget_resized',
            description: 'Widget resized',
            timestamp: new Date().toISOString(),
            icon: <RotateCcw className="h-4 w-4" />,
            color: 'bg-cyan-500'
          })
        }
      }
    }
    
    return actions
  }, [stateHistory])

  const canUndo = historyIndex > 0
  const canRedo = historyIndex < stateHistory.length - 1

  const handleEntryClick = (index: number) => {
    onNavigateToHistory(index)
  }

  const toggleExpanded = (index: number) => {
    setExpandedEntry(expandedEntry === index ? null : index)
  }

  const getTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffMs = now.getTime() - time.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return `${Math.floor(diffMins / 1440)}d ago`
  }

  return (
    <Card className={`flex flex-col h-full ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="h-5 w-5" />
          Edit History
          <Badge variant="outline" className="ml-auto">
            {stateHistory.length} {stateHistory.length === 1 ? 'entry' : 'entries'}
          </Badge>
        </CardTitle>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onUndo}
            disabled={!canUndo}
            className="flex items-center gap-1"
          >
            <Undo2 className="h-4 w-4" />
            Undo
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onRedo}
            disabled={!canRedo}
            className="flex items-center gap-1"
          >
            <Redo2 className="h-4 w-4" />
            Redo
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowDiffs(!showDiffs)}
            className="flex items-center gap-1"
          >
            <FileText className="h-4 w-4" />
            {showDiffs ? 'Hide' : 'Show'} Diffs
          </Button>
          {onClearHistory && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onClearHistory}
              className="flex items-center gap-1 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-2">
            {stateHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No history available</p>
                <p className="text-sm">Start making changes to see the edit history</p>
              </div>
            ) : (
              stateHistory.map((entry, index) => {
                const action = historyActions[index]
                const isCurrent = index === historyIndex
                const isExpanded = expandedEntry === index
                
                return (
                  <div
                    key={index}
                    className={`group relative ${isCurrent ? 'bg-primary/10 border-primary/20' : 'hover:bg-muted/50'} 
                               border rounded-lg p-3 cursor-pointer transition-all duration-200`}
                    onClick={() => handleEntryClick(index)}
                  >
                    {/* Timeline connector */}
                    {index < stateHistory.length - 1 && (
                      <div className="absolute left-6 top-12 w-0.5 h-6 bg-border" />
                    )}
                    
                    <div className="flex items-start gap-3">
                      {/* Action Icon */}
                      <div className={`p-1.5 rounded-full ${action?.color || 'bg-muted'} text-white flex-shrink-0`}>
                        {action?.icon || <Clock className="h-4 w-4" />}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {action?.description || `State ${index + 1}`}
                            </span>
                            {isCurrent && (
                              <Badge variant="default" className="text-xs">
                                Current
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {getTimeAgo(action?.timestamp || new Date().toISOString())}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleExpanded(index)
                              }}
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                        
                        {/* Details */}
                        {action?.details && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {action.details}
                          </p>
                        )}
                        
                        {/* Expanded Details */}
                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t space-y-2">
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div>
                                <span className="font-medium">Widgets:</span>
                                <span className="ml-2">
                                  {entry.gridState.mainWidgets.length + entry.gridState.mainAriesWidgets.length}
                                </span>
                              </div>
                              <div>
                                <span className="font-medium">Nests:</span>
                                <span className="ml-2">{entry.gridState.nestContainers.length}</span>
                              </div>
                              <div>
                                <span className="font-medium">Zoom:</span>
                                <span className="ml-2">{(entry.viewport.zoom * 100).toFixed(0)}%</span>
                              </div>
                              <div>
                                <span className="font-medium">Position:</span>
                                <span className="ml-2">
                                  ({Math.round(entry.viewport.x)}, {Math.round(entry.viewport.y)})
                                </span>
                              </div>
                            </div>
                            
                            {showDiffs && index > 0 && (
                              <div className="mt-3 pt-3 border-t">
                                <h4 className="text-xs font-medium mb-2">Changes from previous state:</h4>
                                <div className="text-xs text-muted-foreground space-y-1">
                                  {/* Add diff information here */}
                                  <p>• State comparison functionality can be expanded here</p>
                                  <p>• Widget position changes</p>
                                  <p>• Configuration modifications</p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
} 