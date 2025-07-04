"use client"

import React from 'react'
import { useCommsSocket } from '@/hooks/use-comms-socket'
import { Button } from './ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion'
import { Badge } from './ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Separator } from './ui/separator'
import { 
  Power, 
  RefreshCw, 
  Settings, 
  Database, 
  Server, 
  Cpu, 
  Puzzle, 
  AlertCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react'

const ConnectionControls = () => {
  const { 
    isConnected: shConnected, 
    latency: shLatency, 
    reconnect: shReconnect,
    modules: shModules,
    sendCommand: shSendCommand,
    connectionStatus: shStatus
  } = useCommsSocket('sh')

  const { 
    isConnected: enConnected, 
    latency: enLatency, 
    reconnect: enReconnect,
    modules: enModules,
    sendCommand: enSendCommand,
    connectionStatus: enStatus
  } = useCommsSocket('en')

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Connection Controls</h2>
        <div className="flex items-center gap-2">
          <Badge variant={shConnected && enConnected ? "success" : "destructive"}>
            {shConnected && enConnected ? "All Systems Connected" : "Connection Issues"}
          </Badge>
        </div>
      </div>

      <Accordion type="single" collapsible className="w-full">
        {/* StreamHandler Controls */}
        <AccordionItem value="sh">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              <span>StreamHandler</span>
              <Badge variant={shConnected ? "success" : "destructive"} className="ml-2">
                {shStatus}
              </Badge>
              {shLatency > 0 && (
                <Badge variant={shLatency > 30 ? "warning" : "outline"} className="ml-2">
                  {shLatency}ms
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Status</p>
                    <div className="flex items-center gap-2">
                      {shConnected ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm">{shStatus}</span>
                    </div>
                  </div>
                  <Button onClick={() => shReconnect()} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reconnect
                  </Button>
                </div>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Connection Details</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Latency</div>
                    <div>{shLatency}ms</div>
                    <div>Active Modules</div>
                    <div>{shModules.size}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        {/* Engine Controls */}
        <AccordionItem value="en">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span>Engine</span>
              <Badge variant={enConnected ? "success" : "destructive"} className="ml-2">
                {enStatus}
              </Badge>
              {enLatency > 0 && (
                <Badge variant={enLatency > 30 ? "warning" : "outline"} className="ml-2">
                  {enLatency}ms
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Status</p>
                    <div className="flex items-center gap-2">
                      {enConnected ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm">{enStatus}</span>
                    </div>
                  </div>
                  <Button onClick={() => enReconnect()} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reconnect
                  </Button>
                </div>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Connection Details</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Latency</div>
                    <div>{enLatency}ms</div>
                    <div>Active Modules</div>
                    <div>{enModules.size}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        {/* Dynamic Modules */}
        <AccordionItem value="modules">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              <span>Dynamic Modules</span>
              <Badge variant="outline" className="ml-2">
                {enModules.size} Active
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {Array.from(enModules.entries()).map(([moduleId, module]) => (
                <Card key={moduleId}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Cpu className="h-4 w-4" />
                        <span className="font-medium">{module.name}</span>
                        <Badge variant={module.status === 'active' ? "success" : "destructive"}>
                          {module.status}
                        </Badge>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => enSendCommand(moduleId, { action: 'restart' })}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Restart
                      </Button>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      Last Update: {new Date(module['module-update-timestamp']).toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* AriesMods (Scaffold) */}
        <AccordionItem value="ariesmods">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Puzzle className="h-4 w-4" />
              <span>AriesMods</span>
              <Badge variant="secondary" className="ml-2">
                Coming Soon
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent className="p-4">
                <div className="text-center space-y-2">
                  <Puzzle className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    AriesMods control panel is coming soon. This section will allow you to manage
                    and configure AriesMods plugins.
                  </p>
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}

export default ConnectionControls 