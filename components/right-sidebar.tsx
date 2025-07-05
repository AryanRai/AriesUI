"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PanelRightClose, Settings, Trash2, Grid, Cpu, Zap } from "lucide-react"
import { HardwareInspector } from "@/components/hardware/hardware-inspector"
import { useAnimationPreferences } from "@/hooks/use-animation-preferences"
import { cn } from "@/lib/utils"
import type { AriesWidget, NestedAriesWidget } from "@/types/ariesmods"

// Futuristic background for right sidebar
const RightSidebarBackground = ({ animationsEnabled }: { animationsEnabled: boolean }) => {
  if (!animationsEnabled) {
    return (
      <div className="absolute inset-0 bg-gradient-to-l from-background/95 to-background/85" />
    )
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-l from-background/95 to-background/85" />
      
      {/* Animated scan line */}
      <motion.div
        className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[rgba(var(--theme-primary),0.5)] to-transparent"
        animate={{
          y: [-100, window.innerHeight + 100],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(20,184,166,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(20,184,166,0.02)_1px,transparent_1px)] bg-[size:30px_30px]" />
      
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-[rgba(var(--theme-primary),0.3)]" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-[rgba(var(--theme-primary),0.3)]" />
    </div>
  )
}

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
  const { animationsEnabled } = useAnimationPreferences()
  
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

  const MotionWrapper = animationsEnabled ? motion.div : 'div'

  return (
    <AnimatePresence>
      {isOpen && (
        <MotionWrapper
          {...(animationsEnabled ? {
            initial: { width: 0, opacity: 0 },
            animate: { width: 320, opacity: 1 },
            exit: { width: 0, opacity: 0 },
            transition: { type: "spring", stiffness: 400, damping: 30 }
          } : {})}
          className="h-full relative overflow-hidden"
        >
          {/* Futuristic Background */}
          <RightSidebarBackground animationsEnabled={animationsEnabled} />
          
          {/* Content */}
          <div className="relative z-10 h-full flex flex-col border-l border-[rgba(var(--theme-primary),0.2)]">
            {/* Header */}
            <MotionWrapper 
              className="flex items-center justify-between p-2 border-b border-[rgba(var(--theme-primary),0.2)]"
              {...(animationsEnabled ? {
                initial: { opacity: 0, y: -10 },
                animate: { opacity: 1, y: 0 },
                transition: { delay: 0.1 }
              } : {})}
            >
              <div className="flex items-center gap-2">
                <motion.div
                  className="w-2 h-2 bg-[rgb(var(--theme-primary))] rounded-full"
                  {...(animationsEnabled ? {
                    animate: { opacity: [0.5, 1, 0.5] },
                    transition: { duration: 2, repeat: Infinity }
                  } : {})}
                />
                <h2 className="text-lg font-semibold bg-gradient-to-r from-[rgb(var(--theme-primary))] to-slate-200 bg-clip-text text-transparent">
                  Inspector
                </h2>
              </div>
              <MotionWrapper
                {...(animationsEnabled ? {
                  whileHover: { scale: 1.1, rotate: 90 },
                  whileTap: { scale: 0.9 }
                } : {})}
              >
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={onToggle}
                  className="hover:bg-[rgba(var(--theme-primary),0.1)] border border-transparent hover:border-[rgba(var(--theme-primary),0.2)] transition-all"
                >
                  <PanelRightClose className="h-4 w-4" />
                </Button>
              </MotionWrapper>
            </MotionWrapper>

            <Tabs defaultValue="grid" className="flex-1 flex flex-col">
              <MotionWrapper 
                className="border-b border-[rgba(var(--theme-primary),0.2)] px-2"
                {...(animationsEnabled ? {
                  initial: { opacity: 0, y: -5 },
                  animate: { opacity: 1, y: 0 },
                  transition: { delay: 0.2 }
                } : {})}
              >
                <TabsList className="w-full bg-background/50 border border-[rgba(var(--theme-primary),0.2)]">
                  <TabsTrigger 
                    value="grid" 
                    className="flex-1 data-[state=active]:bg-[rgba(var(--theme-primary),0.1)] data-[state=active]:text-[rgb(var(--theme-primary))] data-[state=active]:border-[rgba(var(--theme-primary),0.3)]"
                  >
                    <Grid className="h-4 w-4 mr-2" />
                    Grid
                  </TabsTrigger>
                  <TabsTrigger 
                    value="hardware" 
                    className="flex-1 data-[state=active]:bg-[rgba(var(--theme-primary),0.1)] data-[state=active]:text-[rgb(var(--theme-primary))] data-[state=active]:border-[rgba(var(--theme-primary),0.3)]"
                  >
                    <Cpu className="h-4 w-4 mr-2" />
                    Hardware
                  </TabsTrigger>
                </TabsList>
              </MotionWrapper>

              <TabsContent value="grid" className="flex-1 p-0">
                <ScrollArea className="h-full">
                  <MotionWrapper 
                    {...(animationsEnabled ? {
                      initial: { opacity: 0 },
                      animate: { opacity: 1 },
                      transition: { delay: 0.3, staggerChildren: 0.1 }
                    } : {})}
                  >
                    <Accordion type="multiple" className="w-full p-2" defaultValue={Object.keys(groupedItems)}>
                      {Object.entries(groupedItems).map(([groupName, items], groupIndex) => (
                        <MotionWrapper
                          key={groupName}
                          {...(animationsEnabled ? {
                            initial: { opacity: 0, x: -20 },
                            animate: { opacity: 1, x: 0 },
                            transition: { delay: 0.4 + groupIndex * 0.1 }
                          } : {})}
                        >
                          <AccordionItem value={groupName} className="border-[rgba(var(--theme-primary),0.2)]">
                            <AccordionTrigger className="hover:bg-[rgba(var(--theme-primary),0.1)] hover:text-[rgb(var(--theme-primary))] transition-all rounded px-2">
                              <div className="flex items-center gap-2">
                                <Zap className="h-4 w-4 text-[rgb(var(--theme-primary))]" />
                                {groupName} ({items.length})
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-2 pl-2">
                                {items.map((item, itemIndex) => (
                                  <MotionWrapper
                                    key={item.id}
                                    className="p-2 border border-[rgba(var(--theme-primary),0.2)] rounded-md text-sm bg-background/30 hover:bg-[rgba(var(--theme-primary),0.05)] transition-all"
                                    {...(animationsEnabled ? {
                                      initial: { opacity: 0, scale: 0.95 },
                                      animate: { opacity: 1, scale: 1 },
                                      whileHover: { scale: 1.02, x: 4 },
                                      transition: { delay: 0.5 + itemIndex * 0.05 }
                                    } : {})}
                                  >
                                    <div className="font-semibold text-slate-200">{item.title || item.type}</div>
                                    <div className="text-xs text-[rgb(var(--theme-primary))] truncate">ID: {item.id}</div>
                                    <div className="flex justify-end space-x-1 mt-1">
                                      <MotionWrapper
                                        {...(animationsEnabled ? {
                                          whileHover: { scale: 1.1, rotate: 45 },
                                          whileTap: { scale: 0.9 }
                                        } : {})}
                                      >
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="h-6 w-6 hover:bg-[rgba(var(--theme-primary),0.1)] border border-transparent hover:border-[rgba(var(--theme-primary),0.2)] transition-all"
                                        >
                                          <Settings className="h-3 w-3" />
                                        </Button>
                                      </MotionWrapper>
                                      <MotionWrapper
                                        {...(animationsEnabled ? {
                                          whileHover: { scale: 1.1, rotate: 10 },
                                          whileTap: { scale: 0.9 }
                                        } : {})}
                                      >
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="h-6 w-6 text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </MotionWrapper>
                                    </div>
                                  </MotionWrapper>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </MotionWrapper>
                      ))}
                    </Accordion>
                  </MotionWrapper>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="hardware" className="flex-1 p-0">
                <ScrollArea className="h-full">
                  <MotionWrapper
                    {...(animationsEnabled ? {
                      initial: { opacity: 0, y: 20 },
                      animate: { opacity: 1, y: 0 },
                      transition: { delay: 0.3 }
                    } : {})}
                  >
                    <HardwareInspector />
                  </MotionWrapper>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        </MotionWrapper>
      )}
    </AnimatePresence>
  )
}

export default RightSidebar 