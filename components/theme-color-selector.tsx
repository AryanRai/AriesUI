"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Palette, Check } from "lucide-react"
import { useThemeColors, themeColors, ThemeColorKey } from "@/hooks/use-theme-colors"
import { useAnimationPreferences } from "@/hooks/use-animation-preferences"
import { cn } from "@/lib/utils"
import { createPortal } from "react-dom"

interface ThemeColorSelectorProps {
  className?: string
  showLabel?: boolean
  variant?: "button" | "inline"
}

export function ThemeColorSelector({ 
  className = "", 
  showLabel = true, 
  variant = "button" 
}: ThemeColorSelectorProps) {
  const { currentTheme, setTheme } = useThemeColors()
  const { animationsEnabled } = useAnimationPreferences()
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null)

  const MotionWrapper = animationsEnabled ? motion.div : 'div'

  const colorOptions = Object.entries(themeColors) as [ThemeColorKey, typeof themeColors[ThemeColorKey]][]

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setButtonRect(rect)
    }
  }, [isOpen])

  const handleThemeChange = (themeKey: ThemeColorKey) => {
    setTheme(themeKey)
    setIsOpen(false)
  }

  const handleToggle = () => {
    setIsOpen(!isOpen)
  }

  if (variant === "inline") {
    return (
      <div className={cn("flex flex-wrap gap-2", className)}>
        {colorOptions.map(([key, color]) => (
          <MotionWrapper
            key={key}
            {...(animationsEnabled ? {
              whileHover: { scale: 1.1 },
              whileTap: { scale: 0.95 }
            } : {})}
          >
            <button
              onClick={() => handleThemeChange(key)}
              className={cn(
                "relative w-8 h-8 rounded-full border-2 transition-all",
                "hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2",
                currentTheme === key 
                  ? "border-white shadow-lg ring-2 ring-white ring-offset-2 ring-offset-background" 
                  : "border-transparent hover:border-white/50"
              )}
              style={{
                background: `rgb(${color.primary})`,
                boxShadow: currentTheme === key ? `0 0 0 2px rgb(${color.primary})` : undefined
              }}
              title={color.name}
            >
              {currentTheme === key && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Check className="w-4 h-4 text-white" />
                </motion.div>
              )}
            </button>
          </MotionWrapper>
        ))}
      </div>
    )
  }

  return (
    <div className={cn("relative", className)}>
      <MotionWrapper
        {...(animationsEnabled ? {
          whileHover: { scale: 1.05 },
          whileTap: { scale: 0.95 }
        } : {})}
      >
        <Button
          ref={buttonRef}
          variant="ghost"
          size="sm"
          onClick={handleToggle}
          className={cn(
            "gap-2 hover:bg-[rgba(var(--theme-primary),0.1)] border border-transparent",
            "hover:border-[rgba(var(--theme-primary),0.2)] transition-all"
          )}
        >
          <div
            className="w-4 h-4 rounded-full border border-white/20"
            style={{ background: `rgb(${themeColors[currentTheme].primary})` }}
          />
          {showLabel && <span>Theme</span>}
          <Palette className="w-4 h-4" />
        </Button>
      </MotionWrapper>

      {mounted && createPortal(
        <AnimatePresence>
          {isOpen && buttonRect && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9998] bg-black/20 backdrop-blur-sm"
                onClick={() => setIsOpen(false)}
              />
              
              {/* Color Palette */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "fixed z-[9999]",
                  "bg-background/95 backdrop-blur border border-border/40 rounded-lg p-4 shadow-xl",
                  "min-w-[280px]"
                )}
                style={{
                  left: Math.max(8, buttonRect.right - 280), // Align to right edge of button, but keep 8px from screen edge
                  top: buttonRect.bottom + 8, // Position below button with 8px gap
                }}
              >
                <div className="text-sm font-medium mb-3 text-foreground">Choose Theme Color</div>
                
                <div className="grid grid-cols-4 gap-3">
                  {colorOptions.map(([key, color]) => (
                    <MotionWrapper
                      key={key}
                      {...(animationsEnabled ? {
                        whileHover: { scale: 1.05 },
                        whileTap: { scale: 0.95 }
                      } : {})}
                    >
                      <button
                        onClick={() => handleThemeChange(key)}
                        className={cn(
                          "group relative w-full aspect-square rounded-lg border-2 transition-all",
                          "hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2",
                          "flex flex-col items-center justify-center gap-1 p-2",
                          currentTheme === key 
                            ? "border-white shadow-lg ring-2 ring-white ring-offset-2 ring-offset-background" 
                            : "border-transparent hover:border-white/30"
                        )}
                        style={{
                          background: `linear-gradient(135deg, rgb(${color.primary}), rgb(${color.secondary}))`,
                        }}
                        title={color.name}
                      >
                        <div className="text-white text-xs font-medium text-center">
                          {color.name}
                        </div>
                        
                        {currentTheme === key && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-1 right-1"
                          >
                            <Check className="w-3 h-3 text-white" />
                          </motion.div>
                        )}
                      </button>
                    </MotionWrapper>
                  ))}
                </div>
                
                <div className="mt-3 pt-3 border-t border-border/40">
                  <div className="text-xs text-muted-foreground text-center">
                    Theme colors affect all accent elements
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  )
}
