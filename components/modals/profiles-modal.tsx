"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useComms } from "@/components/comms-context"
import { Trash2, Save, PlusCircle } from "lucide-react"

interface ProfilesModalProps {
  profiles: Record<string, any>
  activeProfile: string
  onLoadProfile: (name: string) => void
  onSaveProfile: (name: string) => void
  onDeleteProfile: (name: string) => void
  onClearAllProfiles: () => void
  onClose: () => void
}

export function ProfilesModal({
  profiles,
  activeProfile,
  onLoadProfile,
  onSaveProfile,
  onDeleteProfile,
  onClearAllProfiles,
  onClose,
}: ProfilesModalProps) {
  const [newProfileName, setNewProfileName] = useState("")

  const handleSaveAsNew = () => {
    if (newProfileName && !profiles[newProfileName]) {
      onSaveProfile(newProfileName)
      setNewProfileName("")
    }
  }

  const handleDelete = () => {
    if (activeProfile !== 'default') {
      onDeleteProfile(activeProfile)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Layout Profiles</DialogTitle>
          <DialogDescription>
            Save, load, or delete grid layouts.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="profile-select">Load Profile</Label>
            <div className="flex gap-2">
              <Select value={activeProfile} onValueChange={onLoadProfile}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a profile" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(profiles).map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={handleDelete} disabled={activeProfile === 'default'}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Clear All Layouts</Label>
            <Button 
              variant="destructive" 
              onClick={onClearAllProfiles}
              className="w-full"
              disabled={Object.keys(profiles).length <= 1}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All Layouts
            </Button>
            <p className="text-sm text-muted-foreground">
              This will remove all saved layouts except the default one.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="new-profile-name">Save as New Profile</Label>
             <div className="flex gap-2">
                <Input
                  id="new-profile-name"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  placeholder="Enter new profile name..."
                />
                <Button onClick={handleSaveAsNew} disabled={!newProfileName || !!profiles[newProfileName]}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Save New
                </Button>
             </div>
          </div>
        </div>
        <DialogFooter className="sm:justify-between">
            <Button variant="ghost" onClick={onClose}>
                Close
            </Button>
            <Button onClick={() => onSaveProfile(activeProfile)}>
              <Save className="h-4 w-4 mr-2" />
              Save Current Profile
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 