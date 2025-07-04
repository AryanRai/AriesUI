'use client'

import { useState } from 'react'
import { useCommsSocket } from '@/hooks/use-comms-socket'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

interface ControlWidgetProps {
  moduleId: string
  streamId: string
}

export function ControlWidget({ moduleId, streamId }: ControlWidgetProps) {
  const { modules, sendCommand, error } = useCommsSocket()
  const [value, setValue] = useState('')
  const [isSending, setIsSending] = useState(false)

  const module = modules.get(moduleId)
  const stream = module?.streams[streamId]

  const handleSend = async () => {
    if (!stream) return

    setIsSending(true)
    try {
      // Convert value to the correct type based on stream.datatype
      let typedValue: any = value
      switch (stream.datatype.toLowerCase()) {
        case 'number':
        case 'float':
        case 'double':
          typedValue = parseFloat(value)
          break
        case 'integer':
        case 'int':
          typedValue = parseInt(value, 10)
          break
        case 'boolean':
          typedValue = value.toLowerCase() === 'true'
          break
        // String and other types don't need conversion
      }

      await sendCommand(moduleId, {
        stream_id: streamId,
        value: typedValue
      })

      // Clear input on success
      setValue('')
    } catch (err) {
      console.error('Failed to send command:', err)
    } finally {
      setIsSending(false)
    }
  }

  if (!stream) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>{stream.name} Control</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Current value: {' '}
            <span className="font-mono">
              {typeof stream.value === 'number' 
                ? stream.value.toFixed(stream.metadata.precision || 2)
                : stream.value
              } {stream.unit}
            </span>
          </div>

          <div className="flex space-x-2">
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={`Enter ${stream.datatype} value`}
              type={stream.datatype.toLowerCase().includes('int') ? 'number' : 'text'}
              disabled={isSending}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSend()
                }
              }}
            />
            <Button 
              onClick={handleSend} 
              disabled={isSending || !value.trim()}
            >
              {isSending ? 'Sending...' : 'Send'}
            </Button>
          </div>

          {stream.metadata.sensor && (
            <div className="text-xs text-muted-foreground">
              Sensor: {stream.metadata.sensor}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 