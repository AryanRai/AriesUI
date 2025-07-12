"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useComms } from "@/components/comms-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function AriesModsModal() {
  const { state, dispatch } = useComms()

  const handleClose = () => {
    dispatch({ type: "SET_MODAL", payload: null })
  }

  return (
    <Dialog open={state.activeModal === "ariesmods"} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[900px] h-[70vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>AriesMods Management</DialogTitle>
          <DialogDescription>
            Manage, create, and browse AriesMod modules.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="installed" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="installed">Installed</TabsTrigger>
            <TabsTrigger value="create">Create</TabsTrigger>
            <TabsTrigger value="docs">Documentation</TabsTrigger>
          </TabsList>
          <TabsContent value="installed" className="flex-1 overflow-auto p-4 mt-2">
            <p className="text-muted-foreground">List of locally installed mods will appear here.</p>
          </TabsContent>
          <TabsContent value="create" className="flex-1 overflow-auto p-4 mt-2">
            <p className="text-muted-foreground">An interface for creating new mods will be here.</p>
          </TabsContent>
          <TabsContent value="docs" className="flex-1 overflow-auto p-4 mt-2">
            <p className="text-muted-foreground">Guides and API documentation for mod development will be here.</p>
          </TabsContent>
        </Tabs>
        <DialogFooter className="mt-auto">
          <Button onClick={handleClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
