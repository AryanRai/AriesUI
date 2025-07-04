"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { ChevronDown, Menu, Users, PanelRightOpen } from "lucide-react"
import { useSidebar } from "@/components/ui/sidebar"
import { useComms } from "@/components/comms-context"
import HeartbeatVisualizer from './heartbeat-visualizer'

export function TopNavigation() {
  const { toggleSidebar } = useSidebar()
  const { state, dispatch, loadProfile } = useComms()
  const [marqueeText] = useState("System Status: All systems operational • Data streams active • Connection stable")

  const handleProfileSwitch = (name: string) => {
    const profile = state.profiles[name]
    if (profile) {
      // Dispatch event to save current state before switching
      window.dispatchEvent(new CustomEvent("beforeProfileChange"))
      
      // Save the profile data to localStorage
      localStorage.setItem("comms-grid-state", JSON.stringify(profile))
      
      // Set the active profile
      loadProfile(name)
      
      // Dispatch a custom event to trigger grid state reload
      window.dispatchEvent(new CustomEvent("profileChanged", { detail: { profileName: name } }))
      
      dispatch({ type: "ADD_LOG", payload: `Switched to profile: ${name}` })
    } else {
      dispatch({ type: "ADD_LOG", payload: `Failed to switch to profile "${name}" - profile not found` })
    }
  }

  return (
    <div className="h-[60px] border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center px-4 gap-4 relative z-[60]">
      {/* Left side */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleSidebar}>
          <Menu className="h-4 w-4" />
        </Button>
      </div>

      {/* Center - Heartbeat visualizer */}
      <div className="flex-1 flex items-center justify-center">
        <HeartbeatVisualizer />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Streams functionality moved to Inspector panel */}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Users className="h-4 w-4 mr-2" />
              <span>{state.activeProfile}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Switch Profile</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {Object.keys(state.profiles).map((name) => (
              <DropdownMenuItem key={name} onClick={() => handleProfileSwitch(name)}>
                {name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" onClick={() => dispatch({ type: "SET_MODAL", payload: "profiles" })}>
          Profiles
        </Button>
        <Button variant="ghost" onClick={() => dispatch({ type: "SET_MODAL", payload: "marketplace" })}>
          Marketplace
        </Button>
        <Button 
          variant="outline" 
          onClick={() => dispatch({ type: "TOGGLE_RIGHT_SIDEBAR" })} 
          className="gap-2 bg-transparent"
        >
          <PanelRightOpen className="h-4 w-4" />
          Inspector
        </Button>
      </div>
    </div>
  )
}
