"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { PanelRightClose, Settings, Trash2 } from "lucide-react"

const RightSidebar = ({ gridState, onToggle }) => {

  const allItems = [
    ...gridState.mainAriesWidgets.map(w => ({ ...w, group: 'AriesMods (Main)' })),
    ...gridState.mainWidgets.map(w => ({ ...w, group: 'Widgets (Main)' })),
    ...gridState.nestContainers.map(w => ({ ...w, group: 'Nests' })),
    ...gridState.nestedAriesWidgets.map(w => ({ ...w, group: `AriesMods (Nest: ${w.nestId.slice(-4)})` })),
    ...gridState.nestedWidgets.map(w => ({ ...w, group: `Widgets (Nest: ${w.nestId.slice(-4)})` })),
  ]

  const groupedItems = allItems.reduce((acc, item) => {
    const group = item.group || 'Other';
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(item);
    return acc;
  }, {});


  return (
    <div className="h-full w-80 border-l border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex flex-col">
      <div className="flex items-center justify-between p-2 border-b border-border/40">
        <h2 className="text-lg font-semibold">Grid Inspector</h2>
        <Button variant="ghost" size="icon" onClick={onToggle}>
          <PanelRightClose className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
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
    </div>
  )
}

export default RightSidebar 