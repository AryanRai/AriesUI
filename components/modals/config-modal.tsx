"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useComms } from "@/components/comms-context"
import { useTheme } from "next-themes"

export function ConfigModal() {
  const { dispatch } = useComms()
  const { theme, setTheme } = useTheme()

  return (
    <Dialog open={true} onOpenChange={() => dispatch({ type: "SET_MODAL", payload: null })}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configuration</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="theme-toggle">Dark Mode</Label>
            <Switch
              id="theme-toggle"
              checked={theme === "dark"}
              onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="sound-toggle">Sound Effects</Label>
            <Switch id="sound-toggle" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="auto-save">Auto Save</Label>
            <Switch id="auto-save" defaultChecked />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => dispatch({ type: "SET_MODAL", payload: null })}>
            Cancel
          </Button>
          <Button onClick={() => dispatch({ type: "SET_MODAL", payload: null })}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
