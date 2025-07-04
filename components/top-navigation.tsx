"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { ChevronDown, Menu, Users, PanelRightOpen, Zap, Settings2 } from "lucide-react"
import { useSidebar } from "@/components/ui/sidebar"
import { useComms } from "@/components/comms-context"
import { useAnimationPreferences, standardAnimationVariants } from "@/hooks/use-animation-preferences"
import { cn } from "@/lib/utils"
import HeartbeatVisualizer from './heartbeat-visualizer'

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
        className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-400/50 to-transparent"
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
      <div className="absolute inset-0 bg-[linear-gradient(rgba(20,184,166,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(20,184,166,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
    </div>
  )
}

export function TopNavigation() {
  const { toggleSidebar } = useSidebar()
  const { state, dispatch, loadProfile } = useComms()
  const { animationsEnabled, toggleAnimations } = useAnimationPreferences()
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
              className="h-8 w-8 hover:bg-teal-500/10 border border-transparent hover:border-teal-500/20 transition-colors" 
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
              className="h-8 w-8 hover:bg-teal-500/10 border border-transparent hover:border-teal-500/20 transition-colors opacity-70 hover:opacity-100" 
              onClick={toggleAnimations}
              title={animationsEnabled ? "Disable animations" : "Enable animations"}
            >
              <motion.div
                className={cn("w-4 h-4 rounded-full flex items-center justify-center", 
                  animationsEnabled ? "bg-teal-500/20" : "bg-slate-600/50"
                )}
                {...(animationsEnabled ? {
                  animate: { rotate: 360 },
                  transition: { duration: 2, repeat: Infinity, ease: "linear" }
                } : {})}
              >
                <Zap className={cn("w-2.5 h-2.5", animationsEnabled ? "text-teal-400" : "text-slate-400")} />
              </motion.div>
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
                  className="border-teal-500/20 hover:border-teal-500/40 hover:bg-teal-500/10 transition-all"
                >
                  <Users className="h-4 w-4 mr-2" />
                  <span>{state.activeProfile}</span>
                </Button>
              </MotionWrapper>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="border-teal-500/20 bg-background/95 backdrop-blur">
              <DropdownMenuLabel>Switch Profile</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-teal-500/20" />
              {Object.keys(state.profiles).map((name) => (
                <DropdownMenuItem 
                  key={name} 
                  onClick={() => handleProfileSwitch(name)}
                  className="hover:bg-teal-500/10 focus:bg-teal-500/10"
                >
                  {name}
                </DropdownMenuItem>
              ))}
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
              onClick={() => dispatch({ type: "SET_MODAL", payload: "profiles" })}
              className="hover:bg-teal-500/10 border border-transparent hover:border-teal-500/20 transition-all"
            >
              Profiles
            </Button>
          </MotionWrapper>
          
          <MotionWrapper
            {...(animationsEnabled ? {
              whileHover: { scale: 1.02 },
              whileTap: { scale: 0.98 }
            } : {})}
          >
            <Button 
              variant="ghost" 
              onClick={() => dispatch({ type: "SET_MODAL", payload: "marketplace" })}
              className="hover:bg-teal-500/10 border border-transparent hover:border-teal-500/20 transition-all"
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
            <Button 
              variant="outline" 
              onClick={() => dispatch({ type: "TOGGLE_RIGHT_SIDEBAR" })} 
              className="gap-2 bg-transparent border-teal-500/20 hover:border-teal-500/40 hover:bg-teal-500/10 transition-all"
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
