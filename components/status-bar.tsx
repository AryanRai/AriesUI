"use client"

import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { useComms } from "@/components/comms-context"
import { useAnimationPreferences } from "@/hooks/use-animation-preferences"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { PreloaderIcon } from "@/components/preloader-icon"
import { useThemeColors } from "@/hooks/use-theme-colors"

// Futuristic background for status bar
const StatusBarBackground = ({ animationsEnabled }: { animationsEnabled: boolean }) => {
  if (!animationsEnabled) {
    return (
      <div className="absolute inset-0 bg-gradient-to-r from-muted/50 to-muted/30" />
    )
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-muted/50 to-muted/30" />
      
      {/* Animated status indicator */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(var(--theme-primary),0.3)] to-transparent"
        animate={{
          x: [-200, window.innerWidth + 200],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      
      {/* Subtle data flow particles */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-[rgba(var(--theme-primary),0.2)] rounded-full"
          animate={{
            x: [-20, window.innerWidth + 20],
            opacity: [0, 0.5, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            delay: i * 2,
            ease: "linear",
          }}
          style={{
            bottom: '50%',
            transform: 'translateY(50%)',
          }}
        />
      ))}
    </div>
  )
}

export function StatusBar() {
  const { state } = useComms()
  const { animationsEnabled } = useAnimationPreferences()
  const { colors } = useThemeColors()
  const [widgetCount, setWidgetCount] = useState(0)

  // Listen for widget count updates from main content
  useEffect(() => {
    const handleWidgetCountUpdate = (event: CustomEvent) => {
      setWidgetCount(event.detail.count)
    }

    window.addEventListener("widgetCountUpdate", handleWidgetCountUpdate as EventListener)
    return () => window.removeEventListener("widgetCountUpdate", handleWidgetCountUpdate as EventListener)
  }, [])

  const connectedStreams = state.streams.filter((s) => s.status === "connected").length
  const totalStreams = state.streams.length
  const MotionWrapper = animationsEnabled ? motion.div : 'div'

  return (
    <div className="h-6 border-t border-border/40 relative overflow-hidden">
      {/* Futuristic Background */}
      <StatusBarBackground animationsEnabled={animationsEnabled} />
      
      {/* Content */}
      <div className="relative z-10 h-full flex items-center justify-between px-4 text-xs">
        <MotionWrapper 
          className="flex items-center gap-4"
          {...(animationsEnabled ? {
            initial: { opacity: 0, x: -20 },
            animate: { opacity: 1, x: 0 },
            transition: { delay: 0.1, type: "spring", stiffness: 400, damping: 30 }
          } : {})}
        >
          <div className="flex items-center gap-2">
            <PreloaderIcon 
              size={12} 
              animationsEnabled={animationsEnabled}
              className="opacity-80"
            />
            <span className="text-[rgb(var(--theme-primary))]">Ready</span>
          </div>
          
          <MotionWrapper
            {...(animationsEnabled ? {
              whileHover: { scale: 1.05 },
              transition: { duration: 0.2 }
            } : {})}
          >
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs border-[rgba(var(--theme-primary),0.3)] bg-[rgba(var(--theme-primary),0.1)] text-[rgb(var(--theme-primary))]",
                "hover:border-[rgba(var(--theme-primary),0.5)] hover:bg-[rgba(var(--theme-primary),0.2)] transition-all"
              )}
            >
              Streams: {connectedStreams}/{totalStreams}
            </Badge>
          </MotionWrapper>
          
          <MotionWrapper
            {...(animationsEnabled ? {
              whileHover: { scale: 1.05 },
              transition: { duration: 0.2 }
            } : {})}
          >
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs border-[rgba(var(--theme-primary),0.3)] bg-[rgba(var(--theme-primary),0.1)] text-[rgb(var(--theme-primary))]",
                "hover:border-[rgba(var(--theme-primary),0.5)] hover:bg-[rgba(var(--theme-primary),0.2)] transition-all"
              )}
            >
              Widgets: {widgetCount}
            </Badge>
          </MotionWrapper>
        </MotionWrapper>
        
        <MotionWrapper 
          className="flex items-center gap-2"
          {...(animationsEnabled ? {
            initial: { opacity: 0, x: 20 },
            animate: { opacity: 1, x: 0 },
            transition: { delay: 0.2, type: "spring", stiffness: 400, damping: 30 }
          } : {})}
        >
          <span className="text-muted-foreground">AriesUI</span>
          <span className="text-[rgb(var(--theme-primary))]">v1.0.0</span>
        </MotionWrapper>
      </div>
    </div>
  )
}
