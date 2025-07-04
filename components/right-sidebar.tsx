"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PanelRightClose, Settings, Trash2, Grid, Cpu } from "lucide-react"
import { HardwareInspector } from "@/components/hardware/hardware-inspector"
import type { AriesWidget, NestedAriesWidget } from "@/types/ariesmods"

interface BaseWidget {
  id: string
  type: string
  title: string
  content: string
  x: number
  y: number
  w: number
  h: number
  createdAt: string
  updatedAt: string
}

interface MainGridWidget extends BaseWidget {
  container: "main"
}

interface NestedWidget extends BaseWidget {
  container: "nest"
  nestId: string
}

interface NestContainer {
  id: string
  type: string
  title: string
  x: number
  y: number
  w: number
  h: number
  createdAt: string
  updatedAt: string
}

interface GridState {
  mainWidgets: MainGridWidget[]
  nestContainers: NestContainer[]
  nestedWidgets: NestedWidget[]
  mainAriesWidgets: AriesWidget[]
  nestedAriesWidgets: NestedAriesWidget[]
  viewport: {
    x: number
    y: number
    zoom: number
  }
  gridSize: number
  lastSaved: string | null
  version: string
}

interface RightSidebarProps {
  isOpen: boolean
  gridState: GridState
  onToggle: () => void
}

type GroupedItem = (MainGridWidget | NestedWidget | NestContainer | AriesWidget | NestedAriesWidget) & {
  group: string
  nestId?: string
}

const RightSidebar = ({ isOpen, gridState, onToggle }: RightSidebarProps) => {
  const allItems: GroupedItem[] = [
    ...gridState.mainAriesWidgets.map((w: AriesWidget) => ({ ...w, group: 'AriesMods (Main)' })),
    ...gridState.mainWidgets.map((w: MainGridWidget) => ({ ...w, group: 'Widgets (Main)' })),
    ...gridState.nestContainers.map((w: NestContainer) => ({ ...w, group: 'Nests', type: 'nest' })),
    ...gridState.nestedAriesWidgets.map((w: NestedAriesWidget) => ({ ...w, group: `AriesMods (Nest: ${w.nestId.slice(-4)})` })),
    ...gridState.nestedWidgets.map((w: NestedWidget) => ({ ...w, group: `Widgets (Nest: ${w.nestId.slice(-4)})` })),
  ]

  const groupedItems = allItems.reduce<Record<string, GroupedItem[]>>((acc, item) => {
    const group = item.group || 'Other';
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(item);
    return acc;
  }, {});

  return (
    <div className={`
      h-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 
      flex flex-col
      transition-all duration-300 ease-in-out
      overflow-hidden
      ${isOpen ? 'w-80 border-l border-border/40' : 'w-0 border-none'}
    `}>
      <div className="flex items-center justify-between p-2 border-b border-border/40 min-w-max">
        <h2 className="text-lg font-semibold">Inspector</h2>
        <Button variant="ghost" size="icon" onClick={onToggle}>
          <PanelRightClose className="h-4 w-4" />
        </Button>
      </div>

      <Tabs defaultValue="grid" className="flex-1 flex flex-col">
        <div className="border-b border-border/40 px-2">
          <TabsList className="w-full">
            <TabsTrigger value="grid" className="flex-1">
              <Grid className="h-4 w-4 mr-2" />
              Grid
            </TabsTrigger>
            <TabsTrigger value="hardware" className="flex-1">
              <Cpu className="h-4 w-4 mr-2" />
              Hardware
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="grid" className="flex-1 p-0">
          <ScrollArea className="h-full">
            <Accordion type="multiple" className="w-full p-2" defaultValue={Object.keys(groupedItems)}>
              {Object.entries(groupedItems).map(([groupName, items]) => (
                <AccordionItem value={groupName} key={groupName}>
                  <AccordionTrigger>{groupName} ({items.length})</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {items.map(item => (
                        <div key={item.id} className="p-2 border rounded-md text-sm">
                          <div className="font-semibold">{item.title || item.type}</div>
                          <div className="text-xs text-muted-foreground truncate">ID: {item.id}</div>
                          <div className="flex justify-end space-x-1 mt-1">
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <Settings className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="hardware" className="flex-1 p-0">
          <ScrollArea className="h-full">
            <HardwareInspector />
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default RightSidebar 