"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { ChevronDown, Menu, Layout, PanelRightOpen, Zap, Settings2, Settings } from "lucide-react"
import { useSidebar } from "@/components/ui/sidebar"
import { useComms } from "@/components/comms-context"
import { useAnimationPreferences, standardAnimationVariants } from "@/hooks/use-animation-preferences"
import { cn } from "@/lib/utils"
import HeartbeatVisualizer from './heartbeat-visualizer'
import { PreloaderIcon } from "@/components/preloader-icon"
import { ThemeColorSelector } from "@/components/theme-color-selector"

// Futuristic background component for navbar
const NavbarBackground = ({ animationsEnabled }: { animationsEnabled: boolean }) => {
  if (!animationsEnabled) {
    return (
      <div className="absolute inset-0 bg-gradient-to-r from-background/95 to-background/80 backdrop-blur" />
    )
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-background/95 to-background/80 backdrop-blur" />
      
      {/* Animated scan line */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(var(--theme-primary),0.5)] to-transparent"
        animate={{
          x: [-100, window.innerWidth + 100],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(var(--theme-primary),0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(var(--theme-primary),0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
    </div>
  )
}

export function TopNavigation() {
  const { toggleSidebar } = useSidebar()
  const { state, dispatch, loadProfile } = useComms()
  const { animationsEnabled, toggleAnimations } = useAnimationPreferences()
  const [marqueeText] = useState("System Status: All systems operational • Data streams active • Connection stable")

  const handleLayoutSwitch = (name: string) => {
    const layout = state.profiles[name]
    if (layout) {
      // Dispatch event to save current state before switching
      window.dispatchEvent(new CustomEvent("beforeProfileChange"))
      
      // Save the layout data to localStorage
      localStorage.setItem("comms-grid-state", JSON.stringify(layout))
      
      // Set the active layout
      loadProfile(name)
      
      // Dispatch a custom event to trigger grid state reload
      window.dispatchEvent(new CustomEvent("profileChanged", { detail: { profileName: name } }))
      
      dispatch({ type: "ADD_LOG", payload: `Switched to layout: ${name}` })
    } else {
      dispatch({ type: "ADD_LOG", payload: `Failed to switch to layout "${name}" - layout not found` })
    }
  }

  const MotionWrapper = animationsEnabled ? motion.div : 'div'

  return (
    <div className="h-[60px] border-b border-border/40 relative z-[60] overflow-hidden">
      {/* Futuristic Background */}
      <NavbarBackground animationsEnabled={animationsEnabled} />
      
      {/* Content */}
      <div className="relative z-10 h-full flex items-center px-4 gap-4">
        {/* Left side */}
        <MotionWrapper 
          className="flex items-center gap-2"
          {...(animationsEnabled ? {
            initial: { opacity: 0, x: -20 },
            animate: { opacity: 1, x: 0 },
            transition: { delay: 0.1, type: "spring", stiffness: 400, damping: 30 }
          } : {})}
        >
          <MotionWrapper
            {...(animationsEnabled ? {
              whileHover: { scale: 1.05, rotate: 90 },
              whileTap: { scale: 0.95 }
            } : {})}
          >
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 hover:bg-[rgba(var(--theme-primary),0.1)] border border-transparent hover:border-[rgba(var(--theme-primary),0.2)] transition-colors" 
              onClick={toggleSidebar}
            >
              <Menu className="h-4 w-4" />
            </Button>
          </MotionWrapper>
          
          {/* Animation toggle button */}
          <MotionWrapper
            {...(animationsEnabled ? {
              whileHover: { scale: 1.05 },
              whileTap: { scale: 0.95 }
            } : {})}
          >
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 hover:bg-[rgba(var(--theme-primary),0.1)] border border-transparent hover:border-[rgba(var(--theme-primary),0.2)] transition-colors opacity-70 hover:opacity-100 flex items-center justify-center" 
              onClick={toggleAnimations}
              title={animationsEnabled ? "Disable animations" : "Enable animations"}
            >
              <PreloaderIcon 
                size={30} 
                animationsEnabled={animationsEnabled}
                className="opacity-90"
              />
            </Button>
          </MotionWrapper>
        </MotionWrapper>

        {/* Center - Heartbeat visualizer */}
        <MotionWrapper 
          className="flex-1 flex items-center justify-center"
          {...(animationsEnabled ? {
            initial: { opacity: 0, y: -10 },
            animate: { opacity: 1, y: 0 },
            transition: { delay: 0.2, type: "spring", stiffness: 400, damping: 30 }
          } : {})}
        >
          <HeartbeatVisualizer />
        </MotionWrapper>

        {/* Right side */}
        <MotionWrapper 
          className="flex items-center gap-2"
          {...(animationsEnabled ? {
            initial: { opacity: 0, x: 20 },
            animate: { opacity: 1, x: 0 },
            transition: { delay: 0.3, type: "spring", stiffness: 400, damping: 30 }
          } : {})}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <MotionWrapper
                {...(animationsEnabled ? {
                  whileHover: { scale: 1.02 },
                  whileTap: { scale: 0.98 }
                } : {})}
              >
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-[rgba(var(--theme-primary),0.2)] hover:border-[rgba(var(--theme-primary),0.4)] hover:bg-[rgba(var(--theme-primary),0.1)] transition-all"
                >
                  <Layout className="h-4 w-4 mr-2" />
                  <span>{state.activeProfile}</span>
                  <ChevronDown className="h-3 w-3 ml-2" />
                </Button>
              </MotionWrapper>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="border-[rgba(var(--theme-primary),0.2)] bg-background/95 backdrop-blur">
              <DropdownMenuLabel>Switch Layout</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[rgba(var(--theme-primary),0.2)]" />
              {Object.keys(state.profiles).map((name) => (
                <DropdownMenuItem 
                  key={name} 
                  onClick={() => handleLayoutSwitch(name)}
                  className="hover:bg-[rgba(var(--theme-primary),0.1)] focus:bg-[rgba(var(--theme-primary),0.1)]"
                >
                  {name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator className="bg-[rgba(var(--theme-primary),0.2)]" />
              <DropdownMenuItem 
                onClick={() => dispatch({ type: "SET_MODAL", payload: "profiles" })}
                className="hover:bg-[rgba(var(--theme-primary),0.1)] focus:bg-[rgba(var(--theme-primary),0.1)]"
              >
                <Settings className="h-4 w-4 mr-2" />
                Manage Layouts
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <MotionWrapper
            {...(animationsEnabled ? {
              whileHover: { scale: 1.02 },
              whileTap: { scale: 0.98 }
            } : {})}
          >
            <Button 
              variant="ghost" 
              onClick={() => dispatch({ type: "SET_MODAL", payload: "marketplace" })}
              className="hover:bg-[rgba(var(--theme-primary),0.1)] border border-transparent hover:border-[rgba(var(--theme-primary),0.2)] transition-all"
            >
              Marketplace
            </Button>
          </MotionWrapper>
          
          <MotionWrapper
            {...(animationsEnabled ? {
              whileHover: { scale: 1.02 },
              whileTap: { scale: 0.98 }
            } : {})}
          >
            <ThemeColorSelector showLabel={false} />
          </MotionWrapper>
          
          <MotionWrapper
            {...(animationsEnabled ? {
              whileHover: { scale: 1.02 },
              whileTap: { scale: 0.98 }
            } : {})}
          >
            <Button 
              variant="outline" 
              onClick={() => dispatch({ type: "TOGGLE_RIGHT_SIDEBAR" })} 
              className="gap-2 bg-transparent border-[rgba(var(--theme-primary),0.2)] hover:border-[rgba(var(--theme-primary),0.4)] hover:bg-[rgba(var(--theme-primary),0.1)] transition-all"
            >
              <PanelRightOpen className="h-4 w-4" />
              Inspector
            </Button>
          </MotionWrapper>
        </MotionWrapper>
      </div>
    </div>
  )
}
