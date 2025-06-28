import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Zap, Plus } from 'lucide-react'
import { ariesModsRegistry, getAllAriesMods, getAriesModsByCategory } from '@/lib/ariesmods-registry'
import { ARIESMODS_CATEGORIES } from '@/types/ariesmods'
import type { AriesMod } from '@/types/ariesmods'

interface AriesModSelectorProps {
  onSelect: (modId: string) => void
  selectedModId?: string
  className?: string
}

export const AriesModSelector: React.FC<AriesModSelectorProps> = ({
  onSelect,
  selectedModId,
  className = ''
}) => {
  const [availableMods, setAvailableMods] = useState<AriesMod[]>([])
  const [filteredMods, setFilteredMods] = useState<AriesMod[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [isInitialized, setIsInitialized] = useState<boolean>(false)

  useEffect(() => {
    const initializeRegistry = async () => {
      try {
        await ariesModsRegistry.initialize()
        const mods = Object.values(getAllAriesMods())
        setAvailableMods(mods)
        setFilteredMods(mods)
        setIsInitialized(true)
      } catch (error) {
        console.error('Failed to initialize AriesMods registry:', error)
      }
    }

    initializeRegistry()
  }, [])

  useEffect(() => {
    let filtered = availableMods

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = getAriesModsByCategory(selectedCategory)
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(mod => 
        mod.metadata.displayName.toLowerCase().includes(query) ||
        mod.metadata.description.toLowerCase().includes(query) ||
        mod.metadata.tags?.some(tag => tag.toLowerCase().includes(query))
      )
    }

    setFilteredMods(filtered)
  }, [availableMods, selectedCategory, searchQuery])

  const handleModSelect = (mod: AriesMod) => {
    onSelect(mod.metadata.id)
  }

  const getCategoryIcon = (category: string) => {
    return ARIESMODS_CATEGORIES[category as keyof typeof ARIESMODS_CATEGORIES]?.icon || '⚡'
  }

  if (!isInitialized) {
    return (
      <Card className={`w-full h-full ${className}`}>
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <div className="text-sm text-muted-foreground">Loading AriesMods...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`w-full h-full ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Zap className="h-4 w-4" />
          Select AriesMod Type
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search AriesMods..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9"
          />
        </div>

        {/* Category Filter */}
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.entries(ARIESMODS_CATEGORIES).map(([key, category]) => (
              <SelectItem key={key} value={key}>
                {category.icon} {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Available AriesMods */}
        <ScrollArea className="h-48">
          <div className="space-y-2">
            {filteredMods.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <div className="text-sm">No AriesMods found</div>
                <div className="text-xs">Try changing your search or category filter</div>
              </div>
            ) : (
              filteredMods.map((mod) => (
                <Card
                  key={mod.metadata.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedModId === mod.metadata.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                      : 'hover:border-gray-300'
                  }`}
                  onClick={() => handleModSelect(mod)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm">{mod.metadata.icon}</span>
                          <h3 className="font-medium text-sm truncate">
                            {mod.metadata.displayName}
                          </h3>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {mod.metadata.description}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {getCategoryIcon(mod.metadata.category)} {ARIESMODS_CATEGORIES[mod.metadata.category]?.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            v{mod.metadata.version}
                          </span>
                        </div>
                      </div>
                      {selectedModId === mod.metadata.id && (
                        <div className="ml-2 text-blue-500">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Selected Mod Info */}
        {selectedModId && (
          <div className="text-xs text-muted-foreground border-t pt-2">
            <div>Selected: {availableMods.find(m => m.metadata.id === selectedModId)?.metadata.displayName}</div>
          </div>
        )}

        {/* Stats */}
        <div className="flex justify-between text-xs text-muted-foreground border-t pt-2">
          <span>Showing {filteredMods.length} of {availableMods.length}</span>
          <span>{availableMods.length} total AriesMods</span>
        </div>
      </CardContent>
    </Card>
  )
} 