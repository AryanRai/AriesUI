"use client"

import React, { useState, useEffect } from 'react'
import { usePingMonitor } from '@/hooks/use-ping-monitor'
import { useCommsSocket } from '@/hooks/use-comms-socket'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
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
  XCircle,
  Clock,
  Save
} from 'lucide-react'

const ConnectionControls = () => {
  const { 
    pingData, 
    isConnected, 
    reconnect,
    updatePingInterval,
    pingIntervals
  } = usePingMonitor()

  const { 
    modules: shModules,
    sendCommand: shSendCommand
  } = useCommsSocket()

  // Local state for ping interval inputs - initialize with current values
  const [shPingInterval, setShPingInterval] = useState(pingIntervals.sh)
  const [enPingInterval, setEnPingInterval] = useState(pingIntervals.en)
  const [uiUpdateInterval, setUiUpdateInterval] = useState(pingIntervals.ui)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

  // Update local state when pingIntervals change
  useEffect(() => {
    setShPingInterval(pingIntervals.sh)
    setEnPingInterval(pingIntervals.en)
    setUiUpdateInterval(pingIntervals.ui)
  }, [pingIntervals])

  const handleSavePingSettings = () => {
    if (updatePingInterval) {
      setSaveStatus('saving')
      updatePingInterval({
        sh: shPingInterval,
        en: enPingInterval,
        ui: uiUpdateInterval
      })
      
      // Show success feedback
      setTimeout(() => {
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      }, 100)
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Connection Controls</h2>
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => reconnect()} 
            variant="outline" 
            size="sm"
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Reconnect
          </Button>
          <Badge variant={isConnected ? "default" : "destructive"}>
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
        </div>
      </div>

      <Accordion type="single" collapsible className="w-full">
        {/* Ping Settings */}
        <AccordionItem value="ping-settings">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Ping Settings</span>
              <Badge variant="outline" className="ml-2">
                Configuration
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Ping & Update Intervals</CardTitle>
                <CardDescription>
                  Configure how often the system checks connection status and updates the UI
                </CardDescription>
                <div className="text-xs text-muted-foreground mt-2">
                  Active intervals: SH: {pingIntervals.sh}ms | EN: {pingIntervals.en}ms | UI: {pingIntervals.ui}ms
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sh-ping">StreamHandler Ping (ms)</Label>
                    <Input
                      id="sh-ping"
                      type="number"
                      value={shPingInterval}
                      onChange={(e) => setShPingInterval(Number(e.target.value))}
                      min="100"
                      max="10000"
                      step="100"
                    />
                    <p className="text-xs text-muted-foreground">
                      Current: {pingData.sh.latency}ms | Active: {pingIntervals.sh}ms
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="en-ping">Engine Ping (ms)</Label>
                    <Input
                      id="en-ping"
                      type="number"
                      value={enPingInterval}
                      onChange={(e) => setEnPingInterval(Number(e.target.value))}
                      min="100"
                      max="10000"
                      step="100"
                    />
                    <p className="text-xs text-muted-foreground">
                      Current: {pingData.en.latency}ms | Active: {pingIntervals.en}ms
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ui-update">UI Update Rate (ms)</Label>
                  <Input
                    id="ui-update"
                    type="number"
                    value={uiUpdateInterval}
                    onChange={(e) => setUiUpdateInterval(Number(e.target.value))}
                    min="50"
                    max="5000"
                    step="50"
                  />
                  <p className="text-xs text-muted-foreground">
                    How often the UI updates its display | Active: {pingIntervals.ui}ms
                  </p>
                </div>
                <Button 
                  onClick={handleSavePingSettings} 
                  className="w-full"
                  disabled={saveStatus === 'saving'}
                  variant={saveStatus === 'saved' ? 'default' : 'default'}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saveStatus === 'saving' ? 'Saving...' : 
                   saveStatus === 'saved' ? 'Saved!' : 
                   'Save Ping Settings'}
                </Button>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
        {/* StreamHandler Controls */}
        <AccordionItem value="sh">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              <span>StreamHandler</span>
              <Badge variant={pingData.sh.status === 'connected' ? "default" : "destructive"} className="ml-2">
                {pingData.sh.status}
              </Badge>
              {pingData.sh.latency > 0 && (
                <Badge variant={pingData.sh.latency > 30 ? "secondary" : "outline"} className="ml-2">
                  {pingData.sh.latency}ms
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
                      {pingData.sh.status === 'connected' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm">{pingData.sh.status}</span>
                    </div>
                  </div>
                  <Button onClick={() => reconnect()} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reconnect
                  </Button>
                </div>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Connection Details</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Latency</div>
                    <div>{pingData.sh.latency}ms</div>
                    <div>Last Ping</div>
                    <div>{new Date(pingData.sh.lastPing).toLocaleTimeString()}</div>
                    <div>Last Pong</div>
                    <div>{new Date(pingData.sh.lastPong).toLocaleTimeString()}</div>
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
              <Badge variant={pingData.en.status === 'connected' ? "default" : "destructive"} className="ml-2">
                {pingData.en.status}
              </Badge>
              {pingData.en.latency > 0 && (
                <Badge variant={pingData.en.latency > 30 ? "secondary" : "outline"} className="ml-2">
                  {pingData.en.latency}ms
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
                      {pingData.en.status === 'connected' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm">{pingData.en.status}</span>
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Connection Details</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Latency</div>
                    <div>{pingData.en.latency}ms</div>
                    <div>Last Update</div>
                    <div>{new Date(pingData.en.lastPong).toLocaleTimeString()}</div>
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
                {shModules.size} Active
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {Array.from(shModules.entries()).map(([moduleId, module]) => (
                <Card key={moduleId}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Cpu className="h-4 w-4" />
                        <span className="font-medium">{module.name}</span>
                        <Badge variant={module.status === 'active' ? "default" : "destructive"}>
                          {module.status}
                        </Badge>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => shSendCommand(moduleId, { action: 'restart' })}
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