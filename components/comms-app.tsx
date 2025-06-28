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

function AppContent() {
  const { state, dispatch } = useComms()
  const { isRightSidebarOpen } = state

  const [gridState, setGridState] = useState({
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
    <div className="flex h-screen">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNavigation />
        <div className="flex-1 relative">
          <MainContent gridState={gridState} setGridState={setGridState} />
        </div>
        <StatusBar />
      </div>
      <RightSidebar
        isOpen={isRightSidebarOpen}
        gridState={gridState}
        onToggle={() => dispatch({ type: "TOGGLE_RIGHT_SIDEBAR" })}
      />
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
            {/* Hover trigger zone */}
            <div
              className="fixed left-0 top-0 w-2 h-full z-50 bg-transparent"
              onMouseEnter={() => setSidebarOpen(true)}
            />

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
