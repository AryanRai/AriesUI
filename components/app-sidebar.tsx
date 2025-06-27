"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { LayoutDashboard, Settings, FileText, Terminal, Puzzle, Activity, Pin, PinOff } from "lucide-react"
import { useComms } from "@/components/comms-context"
import { useSidebar } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { useState } from "react"

const menuItems = [
  { title: "Dashboard", icon: LayoutDashboard, id: "dashboard" },
  { title: "Config", icon: Settings, id: "config" },
  { title: "Logs", icon: FileText, id: "logs" },
  { title: "Terminal", icon: Terminal, id: "terminal" },
  { title: "AriesMods", icon: Puzzle, id: "ariesmods" },
  { title: "Performance", icon: Activity, id: "performance" },
]

export function AppSidebar() {
  const { dispatch } = useComms()
  const { open } = useSidebar()
  const [isPinned, setIsPinned] = useState(false)

  const handleMenuClick = (id: string) => {
    if (id === "dashboard") {
      dispatch({ type: "SET_MODAL", payload: null })
    } else {
      dispatch({ type: "SET_MODAL", payload: id })
    }
  }

  const togglePin = () => {
    setIsPinned(!isPinned)
    // You can add logic here to persist the pinned state
  }

  return (
    <Sidebar
      className={`border-r border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300 ${
        open ? "translate-x-0" : "-translate-x-full"
      } ${isPinned ? "relative" : "fixed"} z-40`}
      collapsible={isPinned ? "none" : "offcanvas"}
    >
      <SidebarHeader className="border-b border-border/40 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">C</span>
            </div>
            <span className="font-semibold text-lg">comms</span>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-60 hover:opacity-100" onClick={togglePin}>
            {isPinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
          </Button>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton onClick={() => handleMenuClick(item.id)} className="w-full justify-start">
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Auto-hide indicator */}
      {!isPinned && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="text-xs text-muted-foreground text-center bg-muted/50 rounded px-2 py-1">
            Auto-hide enabled • Click pin to keep open
          </div>
        </div>
      )}
    </Sidebar>
  )
}
