'use client'

import { useCommsSocket } from '@/hooks/use-comms-socket'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

export function HardwareInspector() {
  const { isConnected, modules } = useCommsSocket()

  return (
    <div className="h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">DynamicModules</h2>
        <Badge variant={isConnected ? "default" : "destructive"}>
          {isConnected ? "Connected" : "Disconnected"}
        </Badge>
      </div>

      <ScrollArea className="h-[calc(100vh-10rem)] px-4">
        <Accordion type="multiple" className="w-full">
          {Array.from(modules.entries()).map(([moduleId, module]) => (
            <AccordionItem key={moduleId} value={moduleId}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center justify-between w-full pr-4">
                  <span>{module.name}</span>
                  <Badge variant={module.status === 'active' ? "default" : "secondary"} className="ml-2">
                    {module.status}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 p-2">
                  {/* Module Configuration */}
                  <Card>
                    <CardHeader className="py-2">
                      <CardTitle className="text-sm">Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2 text-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div>Update Rate:</div>
                        <div>{module.config.update_rate}s</div>
                        <div>Debug Mode:</div>
                        <div>{module.config.debug_mode ? 'On' : 'Off'}</div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Streams */}
                  <Card>
                    <CardHeader className="py-2">
                      <CardTitle className="text-sm">Streams</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                      <div className="space-y-3">
                        {Object.entries(module.streams).map(([streamId, stream]) => (
                          <div key={streamId} className="text-sm">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-medium">{stream.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {stream.priority}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-1 text-muted-foreground">
                              <div>Value:</div>
                              <div className="font-mono">
                                {stream.value} {stream.unit}
                              </div>
                              <div>Type:</div>
                              <div>{stream.datatype}</div>
                              <div>Status:</div>
                              <div>{stream.status}</div>
                              <div>Last Update:</div>
                              <div className="text-xs">
                                {new Date(stream['stream-update-timestamp']).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </ScrollArea>
    </div>
  )
} 