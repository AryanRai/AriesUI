"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { Maximize, Minimize, Square, Monitor, Fullscreen } from 'lucide-react'
import { Button } from './ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'
import { useWindowState } from '@/hooks/use-window-state'
import { cn } from '@/lib/utils'

interface WindowControlsProps {
  className?: string
  showLabels?: boolean
  variant?: 'default' | 'minimal'
}

export default function WindowControls({ 
  className, 
  showLabels = false, 
  variant = 'default' 
}: WindowControlsProps) {
  const { windowState, toggleFullscreen, toggleMaximize, minimize, setWindowMode } = useWindowState()

  const controls = [
    {
      id: 'minimize',
      icon: <Minimize className="h-4 w-4" />,
      label: 'Minimize',
      action: minimize,
      shortcut: 'Ctrl+M',
      active: false
    },
    {
      id: 'windowed',
      icon: <Square className="h-4 w-4" />,
      label: 'Windowed',
      action: () => setWindowMode('windowed'),
      shortcut: 'Ctrl+W',
      active: windowState.mode === 'windowed'
    },
    {
      id: 'maximized',
      icon: <Maximize className="h-4 w-4" />,
      label: 'Maximize',
      action: toggleMaximize,
      shortcut: 'Ctrl+↑',
      active: windowState.mode === 'maximized'
    },
    {
      id: 'fullscreen',
      icon: <Fullscreen className="h-4 w-4" />,
      label: 'Fullscreen',
      action: toggleFullscreen,
      shortcut: 'F11',
      active: windowState.mode === 'fullscreen'
    }
  ]

  if (variant === 'minimal') {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        {controls.map((control) => (
          <TooltipProvider key={control.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant={control.active ? "default" : "ghost"}
                  onClick={control.action}
                  className={cn(
                    "h-6 w-6 p-0 transition-all",
                    control.active && "bg-[rgba(var(--theme-primary),0.2)] text-[rgb(var(--theme-primary))]"
                  )}
                >
                  {control.icon}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">
                  {control.label} <span className="text-muted-foreground">({control.shortcut})</span>
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    )
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center gap-1 bg-background/50 backdrop-blur-sm rounded-lg p-1 theme-outline-primary">
        {controls.map((control) => (
          <TooltipProvider key={control.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <Button
                    size="sm"
                    variant={control.active ? "default" : "ghost"}
                    onClick={control.action}
                    className={cn(
                      "h-8 px-2 transition-all",
                      control.active && "bg-[rgba(var(--theme-primary),0.2)] text-[rgb(var(--theme-primary))]",
                      showLabels ? "gap-2" : "w-8 p-0"
                    )}
                  >
                    {control.icon}
                    {showLabels && (
                      <span className="text-xs font-medium">{control.label}</span>
                    )}
                  </Button>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">
                  {control.label} <span className="text-muted-foreground">({control.shortcut})</span>
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
      
      {/* Window State Indicator */}
      <div className="flex items-center gap-2 bg-background/50 backdrop-blur-sm rounded-lg px-3 py-1 theme-outline-primary">
        <Monitor className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-mono text-muted-foreground">
          {windowState.mode.charAt(0).toUpperCase() + windowState.mode.slice(1)}
        </span>
        {windowState.isElectron && (
          <span className="text-xs text-[rgb(var(--theme-primary))]">
            Electron
          </span>
        )}
      </div>
    </div>
  )
} 