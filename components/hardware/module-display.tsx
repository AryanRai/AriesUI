'use client'

import { useCommsSocket } from '@/hooks/use-comms-socket'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

export function ModuleDisplay() {
  const { isConnected, modules, error } = useCommsSocket()

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Hardware Modules</h2>
        <Badge variant={isConnected ? "default" : "destructive"}>
          {isConnected ? "Connected" : "Disconnected"}
        </Badge>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!isConnected && !error && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Connecting to StreamHandler...
          </AlertDescription>
        </Alert>
      )}

      {isConnected && modules.size === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No modules found. Make sure your Engine is running with modules loaded.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from(modules.values()).map(module => (
          <Card key={module.module_id} className="relative">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{module.name}</span>
                <Badge variant={module.status === 'active' ? "default" : "secondary"}>
                  {module.status}
                </Badge>
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                ID: {module.module_id}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(module.streams).map(([streamId, stream]) => (
                  <div key={streamId} className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{stream.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {stream.datatype} • {stream.unit || 'no unit'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono">
                        {typeof stream.value === 'number' 
                          ? stream.value.toFixed(stream.metadata.precision || 2)
                          : stream.value
                        } {stream.unit}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(stream['stream-update-timestamp']).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 