"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useComms } from "@/components/comms-context"

export function WidgetConfigModal() {
  const { state, dispatch } = useComms()

  return (
    <Dialog open={true} onOpenChange={() => dispatch({ type: "SET_MODAL", payload: null })}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Widget Configuration</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="grid-select">Target Grid</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select grid" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="main">Main Grid</SelectItem>
                <SelectItem value="nested-1">Nested Grid 1</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="widget-type">Widget Type</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select widget type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sensor">Sensor Display</SelectItem>
                <SelectItem value="chart">Chart Widget</SelectItem>
                <SelectItem value="status">Status Indicator</SelectItem>
                <SelectItem value="gauge">Gauge Widget</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="stream-select">Data Stream</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select data stream" />
              </SelectTrigger>
              <SelectContent>
                {state.streams.map((stream) => (
                  <SelectItem key={stream.id} value={stream.id}>
                    {stream.name} ({stream.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => dispatch({ type: "SET_MODAL", payload: null })}>
            Cancel
          </Button>
          <Button onClick={() => dispatch({ type: "SET_MODAL", payload: null })}>Save Configuration</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
