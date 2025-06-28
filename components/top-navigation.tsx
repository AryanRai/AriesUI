"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, Wifi, WifiOff, Menu, Users, LayoutGrid } from "lucide-react"
import { useSidebar } from "@/components/ui/sidebar"
import { useComms } from "@/components/comms-context"

export function TopNavigation() {
  const { toggleSidebar } = useSidebar()
  const { state, dispatch, loadProfile } = useComms()
  const [marqueeText] = useState("System Status: All systems operational • Data streams active • Connection stable")

  return (
    <div className="h-[60px] border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center px-4 gap-4 relative z-[60]">
      {/* Left side */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleSidebar}>
          <Menu className="h-4 w-4" />
        </Button>
      </div>

      {/* Center - Scrolling marquee */}
      <div className="flex-1 overflow-hidden">
        <div className="animate-marquee whitespace-nowrap text-sm text-muted-foreground">{marqueeText}</div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Streams dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
              Streams
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            {state.streams.map((stream) => (
              <DropdownMenuItem key={stream.id} className="flex items-center justify-between">
                <span className="truncate">{stream.name}</span>
                <Badge variant={stream.status === "connected" ? "default" : "destructive"} className="ml-2">
                  {stream.status === "connected" ? (
                    <Wifi className="h-3 w-3 mr-1" />
                  ) : (
                    <WifiOff className="h-3 w-3 mr-1" />
                  )}
                  {stream.status}
                </Badge>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Link status dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              Link
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Connection Status: Active</DropdownMenuItem>
            <DropdownMenuItem>Reconnect</DropdownMenuItem>
            <DropdownMenuItem>Disconnect</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

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
              <DropdownMenuItem key={name} onClick={() => loadProfile(name)}>
                {name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="outline"
          size="sm"
          onClick={() => dispatch({ type: "SET_MODAL", payload: "profiles" })}
        >
          <LayoutGrid className="h-4 w-4 mr-2" />
          Manage Layouts
        </Button>
      </div>
    </div>
  )
}
