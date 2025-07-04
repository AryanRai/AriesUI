"use client"

import { useState, useEffect } from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { TopNavigation } from "@/components/top-navigation"
import { MainContent } from "@/components/main-content"
import { FloatingToolbar } from "@/components/floating-toolbar"
import { ModalSystem } from "@/components/modal-system"
import { StatusBar } from "@/components/status-bar"
import { ThemeProvider } from "@/components/theme-provider"
import { CommsProvider, useComms } from "@/components/comms-context"
import { WidgetPalette } from "@/components/widget-palette"
import RightSidebar from "./right-sidebar"

// Redefining types here to avoid export/import issues.
// Ideally, these would be in a central types file.
interface BaseWidget {
  id: string;
  type: string;
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
  createdAt: string;
  updatedAt: string;
}
interface MainGridWidget extends BaseWidget { container: "main"; content: string; }
interface NestedWidget extends BaseWidget { container: "nest"; nestId: string; content: string; }
interface NestContainer { id: string; type: string; title: string; x: number; y: number; w: number; h: number; createdAt: string; updatedAt: string; }
interface AriesWidget { id: string; type: 'ariesmods'; ariesModType: string; title: string; x: number; y: number; w: number; h: number; config: any; data?: any; createdAt: string; updatedAt: string; }
interface NestedAriesWidget extends AriesWidget { nestId: string; }

export interface GridState {
  mainWidgets: MainGridWidget[];
  nestContainers: NestContainer[];
  nestedWidgets: NestedWidget[];
  mainAriesWidgets: AriesWidget[];
  nestedAriesWidgets: NestedAriesWidget[];
  viewport: { x: number; y: number; zoom: number; };
  gridSize: number;
  lastSaved: string | null;
  version: string;
}

function AppContent() {
  const { state, dispatch } = useComms()
  const { isRightSidebarOpen } = state

  const [gridState, setGridState] = useState<GridState>({
    mainWidgets: [],
    nestContainers: [],
    nestedWidgets: [],
    mainAriesWidgets: [],
    nestedAriesWidgets: [],
    viewport: { x: 0, y: 0, zoom: 1 },
    gridSize: 20,
    lastSaved: null,
    version: "1.0.0",
  });

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Left Sidebar */}
      <AppSidebar />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Navigation */}
        <TopNavigation />

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          <MainContent gridState={gridState} setGridState={setGridState} />
          {/* Right Sidebar */}
          <RightSidebar isOpen={isRightSidebarOpen} gridState={gridState} onToggle={() => dispatch({ type: 'TOGGLE_RIGHT_SIDEBAR' })} />
        </div>

        {/* Status Bar */}
        <StatusBar />
      </div>
    </div>
  )
}

export function CommsApp() {
  const [mounted, setMounted] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    let hoverTimeout: NodeJS.Timeout

    const handleMouseMove = (e: MouseEvent) => {
      // Show sidebar when mouse is near left edge (within 10px)
      if (e.clientX <= 10) {
        clearTimeout(hoverTimeout)
        setSidebarOpen(true)
      }
      // Hide sidebar when mouse moves away from left area (beyond 280px from left)
      else if (e.clientX > 280 && sidebarOpen) {
        clearTimeout(hoverTimeout)
        hoverTimeout = setTimeout(() => {
          setSidebarOpen(false)
        }, 300) // 300ms delay before hiding
      }
    }

    const handleMouseLeave = () => {
      // Hide sidebar when mouse leaves the window
      clearTimeout(hoverTimeout)
      hoverTimeout = setTimeout(() => {
        setSidebarOpen(false)
      }, 500)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseleave", handleMouseLeave)
      clearTimeout(hoverTimeout)
    }
  }, [sidebarOpen])

  if (!mounted) {
    return null
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <CommsProvider>
        <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <div className="min-h-screen bg-background text-foreground">
            {/* Futuristic hover trigger zone */}
            <div
              className="fixed left-0 top-0 w-2 h-full z-50 bg-gradient-to-r from-teal-500/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"
              onMouseEnter={() => setSidebarOpen(true)}
            >
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-20 bg-gradient-to-b from-transparent via-teal-400 to-transparent animate-pulse" />
            </div>

            <AppContent />
            <FloatingToolbar />
            <WidgetPalette />
            <ModalSystem />
          </div>
        </SidebarProvider>
      </CommsProvider>
    </ThemeProvider>
  )
}
