"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useComms } from "@/components/comms-context"
import { Download, Trash2, ExternalLink } from "lucide-react"

export function AriesModsModal() {
  const { dispatch } = useComms()

  const availableMods = [
    { name: "Chart Widget Pro", version: "1.2.0", description: "Advanced charting capabilities" },
    { name: "Data Export", version: "0.8.1", description: "Export data to various formats" },
    { name: "Custom Themes", version: "2.1.0", description: "Additional theme options" },
  ]

  const installedMods = [{ name: "Basic Widgets", version: "1.0.0", description: "Core widget collection" }]

  return (
    <Dialog open={true} onOpenChange={() => dispatch({ type: "SET_MODAL", payload: null })}>
      <DialogContent className="sm:max-w-4xl h-[600px]">
        <DialogHeader>
          <DialogTitle>AriesMods Marketplace</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-6 h-full">
          {/* Left side - Configuration */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="git-url">Git Repository URL</Label>
              <Input id="git-url" placeholder="https://github.com/user/repo.git" className="mt-1" />
            </div>

            <div className="border-2 border-dashed border-border/50 rounded-lg p-8 text-center">
              <p className="text-sm text-muted-foreground mb-2">Drop .js mod files here</p>
              <Button variant="outline" size="sm">
                Browse Files
              </Button>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Installed Mods</h3>
              <div className="space-y-2">
                {installedMods.map((mod, index) => (
                  <Card key={index}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">{mod.name}</div>
                          <div className="text-xs text-muted-foreground">{mod.description}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{mod.version}</Badge>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Right side - Available Mods */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Available Mods</h3>
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <ExternalLink className="h-3 w-3" />
                Browse Online
              </Button>
            </div>
            <div className="space-y-2">
              {availableMods.map((mod, index) => (
                <Card key={index}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{mod.name}</div>
                        <div className="text-xs text-muted-foreground">{mod.description}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{mod.version}</Badge>
                        <Button variant="default" size="icon" className="h-6 w-6">
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
