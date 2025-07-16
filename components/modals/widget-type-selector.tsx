import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { ariesModsRegistry } from '@/lib/ariesmods-registry'
import { useComms } from '@/components/comms-context'
import type { AriesMod } from '@/types/ariesmods'

interface WidgetTypeSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  widgetId: string
  currentType: string
  onTypeChange: (widgetId: string, newType: string) => void
}

export function WidgetTypeSelector({
  open,
  onOpenChange,
  widgetId,
  currentType,
  onTypeChange
}: WidgetTypeSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState(currentType)
  const [availableMods, setAvailableMods] = useState<Record<string, AriesMod>>({})
  const { state } = useComms()
  
  // Load available mods
  useEffect(() => {
    const mods = ariesModsRegistry.getAllMods()
    setAvailableMods(mods)
    
    // Reset selected type when modal opens
    if (open) {
      setSelectedType(currentType)
      setSearchQuery('')
    }
  }, [open, currentType])
  
  // Filter mods based on search query
  const filteredMods = Object.values(availableMods).filter(mod => {
    if (!searchQuery) return true
    
    const query = searchQuery.toLowerCase()
    return (
      mod.metadata.displayName.toLowerCase().includes(query) ||
      mod.metadata.description.toLowerCase().includes(query) ||
      mod.metadata.tags?.some(tag => tag.toLowerCase().includes(query))
    )
  })
  
  // Group mods by category
  const modsByCategory = filteredMods.reduce((acc, mod) => {
    const category = mod.metadata.category
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(mod)
    return acc
  }, {} as Record<string, AriesMod[]>)
  
  // Handle type change
  const handleTypeChange = () => {
    if (selectedType !== currentType) {
      onTypeChange(widgetId, selectedType)
    }
    onOpenChange(false)
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Change Widget Type</DialogTitle>
          <DialogDescription>
            Select a new widget type for this widget. Current type: <Badge variant="outline">{currentType}</Badge>
          </DialogDescription>
        </DialogHeader>
        
        <div className="mb-4">
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            placeholder="Search widgets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <ScrollArea className="flex-1 pr-4">
          <RadioGroup value={selectedType} onValueChange={setSelectedType}>
            {Object.entries(modsByCategory).map(([category, mods]) => (
              <div key={category} className="mb-6">
                <h3 className="text-sm font-medium mb-2 capitalize">{category}</h3>
                <div className="space-y-2">
                  {mods.map((mod) => (
                    <div
                      key={mod.metadata.id}
                      className={`flex items-start space-x-2 p-2 rounded-md ${
                        selectedType === mod.metadata.id ? 'bg-primary/10' : 'hover:bg-muted/50'
                      }`}
                    >
                      <RadioGroupItem
                        value={mod.metadata.id}
                        id={mod.metadata.id}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <Label
                          htmlFor={mod.metadata.id}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {mod.metadata.displayName}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {mod.metadata.description}
                        </p>
                        {mod.metadata.tags && mod.metadata.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {mod.metadata.tags.slice(0, 3).map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="text-xs px-1 py-0"
                              >
                                {tag}
                              </Badge>
                            ))}
                            {mod.metadata.tags.length > 3 && (
                              <span className="text-xs text-muted-foreground">
                                +{mod.metadata.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </RadioGroup>
        </ScrollArea>
        
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleTypeChange}>
            Change Type
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}