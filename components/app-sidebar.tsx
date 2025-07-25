"use client"

import { motion, AnimatePresence } from "framer-motion"
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
import { LayoutDashboard, Settings, FileText, Terminal, Puzzle, Activity, Pin, PinOff, Zap } from "lucide-react"
import { useComms } from "@/components/comms-context"
import { useSidebar } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { PreloaderIcon } from "@/components/preloader-icon"
import { ThemeColorSelector } from "@/components/theme-color-selector"

const menuItems = [
  { title: "Dashboard", icon: LayoutDashboard, id: "dashboard" },
  { title: "Config", icon: Settings, id: "config" },
  { title: "Logs", icon: FileText, id: "logs" },
  { title: "Terminal", icon: Terminal, id: "terminal" },
  { title: "AriesMods", icon: Puzzle, id: "ariesmods" },
  { title: "Performance", icon: Activity, id: "performance" },
]

// Animation preferences hook
const useAnimationPreferences = () => {
  const [animationsEnabled, setAnimationsEnabled] = useState(true)
  
  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setAnimationsEnabled(!mediaQuery.matches)
    
    const handleChange = () => setAnimationsEnabled(!mediaQuery.matches)
    mediaQuery.addEventListener('change', handleChange)
    
    // Check localStorage for user preference
    const savedPreference = localStorage.getItem('comms-animations-enabled')
    if (savedPreference !== null) {
      setAnimationsEnabled(JSON.parse(savedPreference))
    }
    
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])
  
  const toggleAnimations = () => {
    const newValue = !animationsEnabled
    setAnimationsEnabled(newValue)
    localStorage.setItem('comms-animations-enabled', JSON.stringify(newValue))
  }
  
  return { animationsEnabled, toggleAnimations }
}

// Background animation component
const FuturisticBackground = ({ animationsEnabled }: { animationsEnabled: boolean }) => {
  if (!animationsEnabled) {
    return (
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background/95 to-background/80" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px]" />
      </div>
    )
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Animated grid pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-background/95 to-background/80" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px]" />
      
      {/* Animated beams - monochrome with teal accent */}
      <motion.div
        className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[rgba(var(--theme-primary),0.3)] to-transparent"
        animate={{
          x: [-100, 400],
        }}
        transition={{
          duration: 6, // Increased from 4 for smoother animation
          repeat: Infinity,
          ease: "linear",
        }}
      />
      <motion.div
        className="absolute top-20 left-0 w-full h-px bg-gradient-to-r from-transparent via-muted-foreground/20 to-transparent"
        animate={{
          x: [400, -100],
        }}
        transition={{
          duration: 8, // Increased from 5 for smoother animation
          repeat: Infinity,
          ease: "linear",
          delay: 2,
        }}
      />
      
      {/* Floating particles - reduced and monochrome */}
      {[...Array(2)].map((_, i) => ( // Reduced from 3 to 2 particles for better performance
        <motion.div
          key={i}
          className="absolute w-0.5 h-0.5 bg-[rgba(var(--theme-primary),0.2)] rounded-full"
          animate={{
            y: [-10, -80],
            opacity: [0, 0.3, 0], // Reduced max opacity from 0.5 to 0.3
          }}
          transition={{
            duration: 6, // Increased from 4 for smoother animation
            repeat: Infinity,
            delay: i * 2, // Increased from 1.5 for less frequent animations
            ease: "easeOut",
          }}
          style={{
            left: `${30 + i * 40}%`, // Adjusted spacing
            bottom: 0,
          }}
        />
      ))}
    </div>
  )
}

export function AppSidebar() {
  const { dispatch } = useComms()
  const { open } = useSidebar()
  const [isPinned, setIsPinned] = useState(() => {
    // Load pinned state from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('comms-sidebar-pinned')
      return saved ? JSON.parse(saved) : false
    }
    return false
  })
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [showAutoNeuralMsg, setShowAutoNeuralMsg] = useState(true)
  const { animationsEnabled, toggleAnimations } = useAnimationPreferences()

  // Auto-hide the auto-neural mode message after 2.5 seconds (faster)
  useEffect(() => {
    if (!isPinned && showAutoNeuralMsg) {
      // Start pulse warning at 2 seconds
      const pulseTimer = setTimeout(() => {
        const messageElement = document.querySelector('.auto-neural-message')
        if (messageElement) {
          messageElement.classList.add('auto-neural-message-pulse')
        }
      }, 2000) // Pulse at 2 seconds
      
      // Start fade-out at 2.5 seconds
      const fadeTimer = setTimeout(() => {
        const messageElement = document.querySelector('.auto-neural-message')
        if (messageElement) {
          messageElement.classList.add('auto-neural-auto-hide')
          // Wait for animation to complete before hiding
          setTimeout(() => {
            setShowAutoNeuralMsg(false)
          }, 300) // Match CSS animation duration
        } else {
          setShowAutoNeuralMsg(false)
        }
      }, 2500) // Start fade-out after 2.5 seconds (faster)
      
      return () => {
        clearTimeout(pulseTimer)
        clearTimeout(fadeTimer)
      }
    }
  }, [isPinned, showAutoNeuralMsg])

  // Show message again when sidebar opens and is not pinned
  useEffect(() => {
    if (open && !isPinned) {
      setShowAutoNeuralMsg(true)
    }
  }, [open, isPinned])

  const handleMenuClick = (id: string) => {
    if (id === "dashboard") {
      dispatch({ type: "SET_MODAL", payload: null })
    } else {
      dispatch({ type: "SET_MODAL", payload: id })
    }
  }

  const togglePin = () => {
    const newPinnedState = !isPinned
    setIsPinned(newPinnedState)
    
    // Reset message visibility when pinning/unpinning
    if (isPinned) {
      setShowAutoNeuralMsg(true) // Show message when unpinning
    }
    
    // Persist the pinned state and notify the parent
    localStorage.setItem('comms-sidebar-pinned', JSON.stringify(newPinnedState))
    
    // Dispatch custom event to notify the main app
    window.dispatchEvent(new CustomEvent('sidebarPinChanged', { 
      detail: { pinned: newPinnedState } 
    }))
  }

  const sidebarVariants = {
    hidden: { 
      x: "-100%",
      opacity: 0,
    },
    visible: { 
      x: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 200, // Reduced from 400 for smoother performance
        damping: 30, // Reduced from 40
        staggerChildren: 0.05, // Reduced from 0.1 for faster stagger
      }
    },
    exit: {
      x: "-100%",
      opacity: 0,
      transition: {
        type: "spring" as const,
        stiffness: 300, // Reduced from 400
        damping: 30, // Reduced from 40
      }
    }
  }

  const itemVariants = {
    hidden: { 
      x: -10, // Reduced from -20 for subtler animation
      opacity: 0,
      scale: 0.95, // Reduced from 0.9 for subtler scaling
    },
    visible: { 
      x: 0, 
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 250, // Reduced from 400
        damping: 20, // Reduced from 25
      }
    }
  }

  const MotionWrapper = animationsEnabled ? motion.div : 'div'
  const AnimationPresenceWrapper = animationsEnabled ? AnimatePresence : ({ children }: { children: React.ReactNode }) => <>{children}</>

  return (
    <AnimationPresenceWrapper>
      {open && (
        animationsEnabled ? (
          <motion.div
            variants={sidebarVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-y-0 left-0 z-[100]"
          >
            <Sidebar
              className={cn(
                "border-r border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
                "relative overflow-hidden",
                isPinned ? "relative" : "fixed"
              )}
              collapsible={isPinned ? "none" : "offcanvas"}
            >
              {/* Content continues below */}
            {/* Futuristic Background */}
            <FuturisticBackground animationsEnabled={animationsEnabled} />
            
            {/* Content */}
            <div className="relative z-10">
              <SidebarHeader className="border-b border-border/40 p-4">
                <MotionWrapper 
                  className="flex items-center justify-between"
                  {...(animationsEnabled ? {
                    initial: { opacity: 0, y: -20 },
                    animate: { opacity: 1, y: 0 },
                    transition: { delay: 0.2 }
                  } : {})}
                >
                  <div className="flex items-center gap-3">
                    <PreloaderIcon 
                      size={40} 
                      animationsEnabled={animationsEnabled}
                      className="flex-shrink-0"
                    />
                    <div>
                      <MotionWrapper 
                        className="font-bold text-xl bg-gradient-to-r from-[rgb(var(--theme-primary))] to-slate-200 bg-clip-text text-transparent"
                        {...(animationsEnabled ? {
                          initial: { opacity: 0 },
                          animate: { opacity: 1 },
                          transition: { delay: 0.3 }
                        } : {})}
                      >
                        comms
                      </MotionWrapper>
                      <MotionWrapper 
                        className="text-xs text-muted-foreground flex items-center gap-1"
                        {...(animationsEnabled ? {
                          initial: { opacity: 0 },
                          animate: { opacity: 1 },
                          transition: { delay: 0.4 }
                        } : {})}
                      >
                        <div className={cn("w-1 h-1 bg-[rgb(var(--theme-primary))] rounded-full", animationsEnabled && "animate-pulse")} />
                        nominal interface
                      </MotionWrapper>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
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
                        className="h-6 w-6 opacity-60 hover:opacity-100 hover:bg-[rgba(var(--theme-primary),0.1)]" 
                        onClick={toggleAnimations}
                        title={animationsEnabled ? "Disable animations" : "Enable animations"}
                      >
                        <motion.div
                          className={cn("w-3 h-3 rounded-full", animationsEnabled ? "bg-[rgb(var(--theme-primary))]" : "bg-muted-foreground")}
                          {...(animationsEnabled ? {
                            animate: { scale: [1, 1.2, 1] },
                            transition: { duration: 1.5, repeat: Infinity }
                          } : {})}
                        />
                      </Button>
                    </MotionWrapper>
                    
                    <MotionWrapper
                      {...(animationsEnabled ? {
                        whileHover: { scale: 1.1 },
                        whileTap: { scale: 0.9 }
                      } : {})}
                    >
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 opacity-60 hover:opacity-100 hover:bg-[rgba(var(--theme-primary),0.1)]" 
                        onClick={togglePin}
                      >
                        <MotionWrapper
                          {...(animationsEnabled ? {
                            animate: { rotate: isPinned ? 45 : 0 },
                            transition: { duration: 0.2 }
                          } : {})}
                        >
                          {isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                        </MotionWrapper>
                      </Button>
                    </MotionWrapper>
                  </div>
                </MotionWrapper>
              </SidebarHeader>
              
              <SidebarContent>
                <SidebarGroup>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      <MotionWrapper
                        {...(animationsEnabled ? {
                          variants: {
                            visible: {
                              transition: {
                                staggerChildren: 0.05
                              }
                            }
                          }
                        } : {})}
                      >
                        {menuItems.map((item, index) => (
                          animationsEnabled ? (
                            <motion.div key={item.id} variants={itemVariants}>
                              <SidebarMenuItem>
                                <motion.div
                                  className="relative group"
                                  onHoverStart={() => setHoveredItem(item.id)}
                                  onHoverEnd={() => setHoveredItem(null)}
                                  whileHover={{ x: 4 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                <SidebarMenuButton 
                                  onClick={() => handleMenuClick(item.id)} 
                                  className={cn(
                                    "w-full justify-start relative overflow-hidden",
                                    "hover:bg-gradient-to-r hover:from-[rgba(var(--theme-primary),0.1)] hover:to-slate-500/5",
                                    "border border-transparent hover:border-[rgba(var(--theme-primary),0.2)]",
                                    "transition-all duration-300"
                                  )}
                                >
                                  {/* Icon with monochrome background and teal accent */}
                                  <MotionWrapper
                                    className={cn(
                                      "p-1.5 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800",
                                      "border border-slate-600/50",
                                      "relative overflow-hidden"
                                    )}
                                    {...(animationsEnabled ? {
                                      whileHover: { 
                                        scale: 1.05,
                                        boxShadow: "0 0 10px rgba(20, 184, 166, 0.2)"
                                      }
                                    } : {})}
                                  >
                                    <item.icon className={cn(
                                      "h-4 w-4 relative z-10 transition-colors duration-200",
                                      hoveredItem === item.id ? "text-[rgb(var(--theme-secondary))]" : "text-slate-300"
                                    )} />
                                    <AnimationPresenceWrapper>
                                      {hoveredItem === item.id && animationsEnabled && (
                                        <motion.div
                                          className="absolute inset-0 bg-[rgba(var(--theme-primary),0.2)]"
                                          initial={{ scale: 0, opacity: 0 }}
                                          animate={{ scale: 1, opacity: 1 }}
                                          exit={{ scale: 0, opacity: 0 }}
                                          transition={{ duration: 0.2 }}
                                        />
                                      )}
                                    </AnimationPresenceWrapper>
                                  </MotionWrapper>
                                  
                                  <span className="font-medium text-foreground">{item.title}</span>
                                  
                                  {/* Hover effect beam - teal accent */}
                                  <AnimationPresenceWrapper>
                                    {hoveredItem === item.id && (
                                      <MotionWrapper
                                        className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[rgb(var(--theme-primary))] to-[rgb(var(--theme-accent))]"
                                        {...(animationsEnabled ? {
                                          initial: { scaleY: 0, opacity: 0 },
                                          animate: { scaleY: 1, opacity: 1 },
                                          exit: { scaleY: 0, opacity: 0 },
                                          transition: { duration: 0.2 }
                                        } : {})}
                                      />
                                    )}
                                  </AnimationPresenceWrapper>
                                  
                                  {/* Subtle ripple effect */}
                                  <AnimationPresenceWrapper>
                                    {hoveredItem === item.id && (
                                      <MotionWrapper
                                        className="absolute inset-0 bg-gradient-to-r from-[rgba(var(--theme-primary),0.05)] to-transparent rounded-lg"
                                        {...(animationsEnabled ? {
                                          initial: { scale: 0, opacity: 0 },
                                          animate: { scale: 1, opacity: 1 },
                                          exit: { scale: 0, opacity: 0 },
                                          transition: { duration: 0.3 }
                                        } : {})}
                                      />
                                    )}
                                  </AnimationPresenceWrapper>
                                </SidebarMenuButton>
                              </motion.div>
                            </SidebarMenuItem>
                          </motion.div>
                          ) : (
                            <div key={item.id}>
                              <SidebarMenuItem>
                                <div
                                  className="relative group"
                                  onMouseEnter={() => setHoveredItem(item.id)}
                                  onMouseLeave={() => setHoveredItem(null)}
                                >
                                  <SidebarMenuButton 
                                    onClick={() => handleMenuClick(item.id)} 
                                    className={cn(
                                      "w-full justify-start relative overflow-hidden",
                                      "hover:bg-gradient-to-r hover:from-teal-500/10 hover:to-slate-500/5",
                                      "border border-transparent hover:border-teal-500/20",
                                      "transition-all duration-300"
                                    )}
                                  >
                                    {/* Icon with monochrome background and teal accent */}
                                    <div
                                      className={cn(
                                        "p-1.5 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800",
                                        "border border-slate-600/50",
                                        "relative overflow-hidden"
                                      )}
                                    >
                                      <item.icon className={cn(
                                        "h-4 w-4 relative z-10 transition-colors duration-200",
                                        hoveredItem === item.id ? "text-teal-300" : "text-slate-300"
                                      )} />
                                      {hoveredItem === item.id && (
                                        <div className="absolute inset-0 bg-teal-500/20" />
                                      )}
                                    </div>
                                    
                                    <span className="font-medium text-foreground">{item.title}</span>
                                    
                                    {/* Hover effect beam - teal accent */}
                                    {hoveredItem === item.id && (
                                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-teal-400 to-teal-600" />
                                    )}
                                    
                                    {/* Subtle ripple effect */}
                                    {hoveredItem === item.id && (
                                      <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-transparent rounded-lg" />
                                    )}
                                  </SidebarMenuButton>
                                </div>
                              </SidebarMenuItem>
                            </div>
                          )
                        ))}
                      </MotionWrapper>
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              </SidebarContent>

              {/* Auto-hide indicator - compact top-right corner */}
              <AnimationPresenceWrapper>
                {!isPinned && showAutoNeuralMsg && (
                  <MotionWrapper 
                    className="absolute top-2 right-2 z-50"
                    {...(animationsEnabled ? {
                      initial: { opacity: 0, scale: 0.8, x: 20 },
                      animate: { opacity: 1, scale: 1, x: 0 },
                      exit: { opacity: 0, scale: 0.8, x: 20 },
                      transition: { delay: 0.3, duration: 0.2 }
                    } : {})}
                  >
                    <MotionWrapper 
                      className="text-xs text-muted-foreground bg-gradient-to-r from-teal-500/15 to-slate-500/10 border border-teal-500/30 rounded-md px-2 py-1 backdrop-blur-sm auto-neural-message auto-neural-message-fadein shadow-sm"
                      {...(animationsEnabled ? {
                        animate: {
                          boxShadow: [
                            "0 0 0px rgba(20, 184, 166, 0)",
                            "0 0 4px rgba(20, 184, 166, 0.2)",
                            "0 0 0px rgba(20, 184, 166, 0)"
                          ]
                        },
                        transition: {
                          duration: 3,
                          repeat: Infinity,
                        }
                      } : {})}
                    >
                      <div className="flex items-center gap-1.5">
                        <MotionWrapper
                          className="w-1 h-1 bg-[rgb(var(--theme-primary))] rounded-full"
                          {...(animationsEnabled ? {
                            animate: { opacity: [1, 0.3, 1] },
                            transition: { duration: 2, repeat: Infinity }
                          } : {})}
                        />
                        <span className="whitespace-nowrap">auto • pin</span>
                      </div>
                    </MotionWrapper>
                  </MotionWrapper>
                )}
              </AnimationPresenceWrapper>
            </div>
          </Sidebar>
          </motion.div>
        ) : (
          <div className="fixed inset-y-0 left-0 z-[100]">
            <Sidebar
              className={cn(
                "border-r border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
                "relative overflow-hidden",
                isPinned ? "relative" : "fixed"
              )}
              collapsible={isPinned ? "none" : "offcanvas"}
            >
              {/* Futuristic Background */}
              <FuturisticBackground animationsEnabled={animationsEnabled} />
              
              {/* Content */}
              <div className="relative z-10">
                <SidebarHeader className="border-b border-border/40 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-teal-600 to-slate-700 flex items-center justify-center shadow-lg border border-teal-500/20">
                        <Zap className="h-5 w-5 text-teal-100" />
                      </div>
                      <div>
                        <div className="font-bold text-xl bg-gradient-to-r from-teal-400 to-slate-200 bg-clip-text text-transparent">
                          comms
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <div className="w-1 h-1 bg-[rgb(var(--theme-primary))] rounded-full" />
                          nominal interface
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Animation toggle button */}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 opacity-60 hover:opacity-100 hover:bg-[rgba(var(--theme-primary),0.1)]" 
                        onClick={toggleAnimations}
                        title={animationsEnabled ? "Disable animations" : "Enable animations"}
                      >
                        <div className={cn("w-3 h-3 rounded-full", animationsEnabled ? "bg-[rgb(var(--theme-primary))]" : "bg-muted-foreground")} />
                      </Button>
                      
                      {/* Theme color selector */}
                      <ThemeColorSelector showLabel={false} className="opacity-60 hover:opacity-100" />
                      
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 opacity-60 hover:opacity-100 hover:bg-teal-500/10" 
                        onClick={togglePin}
                      >
                        {isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </SidebarHeader>
                
                <SidebarContent>
                  <SidebarGroup>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        <div>
                          {menuItems.map((item, index) => (
                            <div key={item.id}>
                              <SidebarMenuItem>
                                <div
                                  className="relative group"
                                  onMouseEnter={() => setHoveredItem(item.id)}
                                  onMouseLeave={() => setHoveredItem(null)}
                                >
                                  <SidebarMenuButton 
                                    onClick={() => handleMenuClick(item.id)} 
                                    className={cn(
                                      "w-full justify-start relative overflow-hidden",
                                      "hover:bg-gradient-to-r hover:from-teal-500/10 hover:to-slate-500/5",
                                      "border border-transparent hover:border-teal-500/20",
                                      "transition-all duration-300"
                                    )}
                                  >
                                    {/* Icon with monochrome background and teal accent */}
                                    <div
                                      className={cn(
                                        "p-1.5 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800",
                                        "border border-slate-600/50",
                                        "relative overflow-hidden"
                                      )}
                                    >
                                      <item.icon className={cn(
                                        "h-4 w-4 relative z-10 transition-colors duration-200",
                                        hoveredItem === item.id ? "text-teal-300" : "text-slate-300"
                                      )} />
                                      {hoveredItem === item.id && (
                                        <div className="absolute inset-0 bg-teal-500/20" />
                                      )}
                                    </div>
                                    
                                    <span className="font-medium text-foreground">{item.title}</span>
                                    
                                    {/* Hover effect beam - teal accent */}
                                    {hoveredItem === item.id && (
                                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-teal-400 to-teal-600" />
                                    )}
                                    
                                    {/* Subtle ripple effect */}
                                    {hoveredItem === item.id && (
                                      <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-transparent rounded-lg" />
                                    )}
                                  </SidebarMenuButton>
                                </div>
                              </SidebarMenuItem>
                            </div>
                          ))}
                        </div>
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </SidebarContent>

                {/* Auto-hide indicator - compact top-right corner */}
                {!isPinned && showAutoNeuralMsg && (
                  <div className="absolute top-2 right-2 z-50">
                    <div className="text-xs text-muted-foreground bg-gradient-to-r from-teal-500/15 to-slate-500/10 border border-teal-500/30 rounded-md px-2 py-1 backdrop-blur-sm auto-neural-message auto-neural-message-fadein shadow-sm">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1 h-1 bg-[rgb(var(--theme-primary))] rounded-full" />
                        <span className="whitespace-nowrap">auto • pin</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Sidebar>
          </div>
        )
      )}
    </AnimationPresenceWrapper>
  )
}
