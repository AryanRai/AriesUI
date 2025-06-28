"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { PanelRightClose, Settings, Trash2 } from "lucide-react"

// We can't easily import GridState, so we'll use a generic 'any' for now.
// This is not ideal, but unblocks the main issue.
interface RightSidebarProps {
  isOpen: boolean;
  gridState: any; 
  onToggle: () => void;
}

const RightSidebar = ({ isOpen, gridState, onToggle }: RightSidebarProps) => {

  const allItems = [
    ...gridState.mainAriesWidgets.map((w: any) => ({ ...w, group: 'AriesMods (Main)' })),
    ...gridState.mainWidgets.map((w: any) => ({ ...w, group: 'Widgets (Main)' })),
    ...gridState.nestContainers.map((w: any) => ({ ...w, group: 'Nests' })),
    ...gridState.nestedAriesWidgets.map((w: any) => ({ ...w, group: `AriesMods (Nest: ${w.nestId.slice(-4)})` })),
    ...gridState.nestedWidgets.map((w: any) => ({ ...w, group: `Widgets (Nest: ${w.nestId.slice(-4)})` })),
  ]

  const groupedItems = allItems.reduce((acc: Record<string, any[]>, item: any) => {
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
      ${isOpen ? 'w-80 border-l border-border/40' : 'w-0'}
    `}>
      <div className="flex-shrink-0 flex items-center justify-between p-2 border-b border-border/40">
        <h2 className="text-lg font-semibold whitespace-nowrap">Grid Inspector</h2>
        <Button variant="ghost" size="icon" onClick={onToggle}>
          <PanelRightClose className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1 w-full">
        <Accordion type="multiple" className="w-full p-2" defaultValue={Object.keys(groupedItems)}>
          {Object.entries(groupedItems).map(([groupName, items]) => (
            <AccordionItem value={groupName} key={groupName}>
              <AccordionTrigger>{groupName} ({items.length})</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {(items as any[]).map((item: any) => (
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