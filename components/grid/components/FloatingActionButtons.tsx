import React from "react"
import { Save, Download, Upload, Grid3X3, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FloatingActionButtonsProps {
  hasUnsavedChanges: boolean
  onSave: () => void
  onExport: () => void
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void
  onAddNest: () => void
  onAddWidget: () => void
}

export const FloatingActionButtons: React.FC<FloatingActionButtonsProps> = ({
  hasUnsavedChanges,
  onSave,
  onExport,
  onImport,
  onAddNest,
  onAddWidget,
}) => {
  return (
    <div className="absolute top-4 right-4 z-30 flex gap-2">
      <Button
        onClick={onSave}
        size="sm"
        className={`gap-2 bg-background/80 backdrop-blur border-border/50 ${hasUnsavedChanges ? "border-orange-500/50" : ""}`}
      >
        <Save className="h-4 w-4" />
        Save {hasUnsavedChanges && "*"}
      </Button>
      <Button onClick={onExport} size="sm" className="gap-2 bg-background/80 backdrop-blur border-border/50">
        <Download className="h-4 w-4" />
        Export
      </Button>
      <label className="cursor-pointer">
        <input type="file" accept=".json" onChange={onImport} className="hidden" />
        <Button size="sm" className="gap-2 bg-background/80 backdrop-blur border-border/50" asChild>
          <span>
            <Upload className="h-4 w-4" />
            Import
          </span>
        </Button>
      </label>
      <Button onClick={onAddNest} size="sm" className="gap-2 bg-background/80 backdrop-blur border-border/50">
        <Grid3X3 className="h-4 w-4" />
        Add Nest
      </Button>
      <Button onClick={onAddWidget} size="sm" className="gap-2 bg-background/80 backdrop-blur border-border/50">
        <Plus className="h-4 w-4" />
        Add Widget
      </Button>
    </div>
  )
}