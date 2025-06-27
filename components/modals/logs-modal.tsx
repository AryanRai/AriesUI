"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useComms } from "@/components/comms-context"
import { Trash2 } from "lucide-react"

export function LogsModal() {
  const { state, dispatch } = useComms()

  return (
    <Dialog open={true} onOpenChange={() => dispatch({ type: "SET_MODAL", payload: null })}>
      <DialogContent className="sm:max-w-2xl h-[600px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>System Logs</DialogTitle>
            <Button variant="outline" size="sm" onClick={() => dispatch({ type: "CLEAR_LOGS" })} className="gap-2">
              <Trash2 className="h-4 w-4" />
              Clear
            </Button>
          </div>
        </DialogHeader>
        <ScrollArea className="flex-1 w-full">
          <div className="font-mono text-sm space-y-1 p-4 bg-muted/20 rounded">
            {state.logs.map((log, index) => (
              <div key={index} className="text-xs">
                {log}
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
