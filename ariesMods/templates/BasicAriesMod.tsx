import React from 'react'
import type { AriesMod, AriesModProps, AriesModData } from '@/types/ariesmods'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, Zap, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAnimationPreferences } from '@/hooks/use-animation-preferences'
import { cn } from '@/lib/utils'

// Define your AriesMod's configuration interface
export interface BasicAriesModConfig {
  displayValue: string
  showIcon: boolean
  theme: 'default' | 'success' | 'warning' | 'danger'
  updateInterval: number
}

// Default configuration
const defaultConfig: BasicAriesModConfig = {
  displayValue: 'Hello AriesMod!',
  showIcon: true,
  theme: 'default',
  updateInterval: 1000
}

// Main component - this is what gets rendered in the grid
const BasicAriesMod: React.FC<AriesModProps> = ({ 
  id, 
  title, 
  width, 
  height, 
  data, 
  config, 
  onConfigChange,
  onDataRequest 
}) => {
  const { animationsEnabled } = useAnimationPreferences()
  
  // Merge default config with user config
  const modConfig = { ...defaultConfig, ...config } as BasicAriesModConfig

  // Get theme colors for futuristic design
  const getThemeColors = () => {
    switch (modConfig.theme) {
      case 'success': return { 
        bg: 'bg-green-500/5', 
        border: 'border-green-500/20', 
        text: 'text-green-400',
        glow: 'shadow-green-500/20',
        accent: 'bg-green-500/10'
      }
      case 'warning': return { 
        bg: 'bg-orange-500/5', 
        border: 'border-orange-500/20', 
        text: 'text-orange-400',
        glow: 'shadow-orange-500/20',
        accent: 'bg-orange-500/10'
      }
      case 'danger': return { 
        bg: 'bg-red-500/5', 
        border: 'border-red-500/20', 
        text: 'text-red-400',
        glow: 'shadow-red-500/20',
        accent: 'bg-red-500/10'
      }
      default: return { 
        bg: 'bg-teal-500/5', 
        border: 'border-teal-500/20', 
        text: 'text-teal-400',
        glow: 'shadow-teal-500/20',
        accent: 'bg-teal-500/10'
      }
    }
  }

  // Get theme icon
  const getThemeIcon = () => {
    switch (modConfig.theme) {
      case 'success': return <CheckCircle className="h-4 w-4" />
      case 'warning': return <AlertTriangle className="h-4 w-4" />
      case 'danger': return <Zap className="h-4 w-4" />
      default: return <Info className="h-4 w-4" />
    }
  }

  const colors = getThemeColors()
  const ThemeIcon = getThemeIcon()
  const MotionWrapper = animationsEnabled ? motion.div : 'div'

  // Handle data requests (for real-time data)
  React.useEffect(() => {
    if (onDataRequest) {
      const interval = setInterval(() => {
        onDataRequest({ type: 'basic-data', timestamp: new Date().toISOString() })
      }, modConfig.updateInterval)
      
      return () => clearInterval(interval)
    }
  }, [onDataRequest, modConfig.updateInterval])

  return (
    <MotionWrapper
      className="h-full"
      {...(animationsEnabled ? {
        initial: { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1 },
        whileHover: { scale: 1.02 },
        transition: { duration: 0.2 }
      } : {})}
    >
      <Card className={cn(
        "h-full relative overflow-hidden",
        colors.bg,
        colors.border,
        colors.glow,
        "border-2 backdrop-blur shadow-lg"
      )}>
        {/* Futuristic corner accents */}
        <div className={cn("absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2", colors.border)} />
        <div className={cn("absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2", colors.border)} />
        <div className={cn("absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2", colors.border)} />
        <div className={cn("absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2", colors.border)} />
        
        {/* Animated scan line */}
        {animationsEnabled && (
          <motion.div
            className={cn("absolute top-0 left-0 w-full h-0.5", colors.accent)}
            animate={{
              x: ["-100%", "100%"],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        )}
        
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm">
            <MotionWrapper 
              className="flex items-center gap-2"
              {...(animationsEnabled ? {
                initial: { x: -10, opacity: 0 },
                animate: { x: 0, opacity: 1 },
                transition: { delay: 0.1 }
              } : {})}
            >
              {modConfig.showIcon && (
                <motion.div
                  className={colors.text}
                  {...(animationsEnabled ? {
                    animate: { rotate: [0, 5, 0, -5, 0] },
                    transition: { duration: 2, repeat: Infinity }
                  } : {})}
                >
                  {ThemeIcon}
                </motion.div>
              )}
              <span className={cn("text-slate-300", colors.text)}>{title}</span>
            </MotionWrapper>
            <MotionWrapper
              {...(animationsEnabled ? {
                initial: { x: 10, opacity: 0 },
                animate: { x: 0, opacity: 1 },
                transition: { delay: 0.2 }
              } : {})}
            >
              <Badge variant="outline" className={cn(
                "text-xs border-current",
                colors.text,
                colors.border
              )}>
                v1.0
              </Badge>
            </MotionWrapper>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="pt-0">
          <MotionWrapper
            className="text-center"
            {...(animationsEnabled ? {
              initial: { y: 10, opacity: 0 },
              animate: { y: 0, opacity: 1 },
              transition: { delay: 0.3 }
            } : {})}
          >
            <motion.div 
              className={cn("text-lg font-semibold font-mono", colors.text)}
              {...(animationsEnabled ? {
                animate: { scale: [1, 1.05, 1] },
                transition: { duration: 2, repeat: Infinity }
              } : {})}
            >
              {modConfig.displayValue}
            </motion.div>
            
            {data && (
              <MotionWrapper
                className="mt-2 space-y-1"
                {...(animationsEnabled ? {
                  initial: { opacity: 0 },
                  animate: { opacity: 1 },
                  transition: { delay: 0.4 }
                } : {})}
              >
                <div className="text-xs text-slate-400 font-mono">
                  Last updated: {new Date(data.timestamp).toLocaleTimeString()}
                </div>
                {data.value && (
                  <div className={cn("text-sm font-mono", colors.text)}>
                    Value: {data.value}
                  </div>
                )}
              </MotionWrapper>
            )}
          </MotionWrapper>
        </CardContent>
      </Card>
    </MotionWrapper>
  )
}

// Generate dummy data for testing
const generateDummyData = (): AriesModData => {
  return {
    value: Math.floor(Math.random() * 100),
    timestamp: new Date().toISOString(),
    metadata: {
      source: 'basic-ariesmod',
      generated: true
    }
  }
}

// Validate configuration (optional)
const validateConfig = (config: Record<string, any>): boolean => {
  // Check if theme is valid
  if (config.theme && !['default', 'success', 'warning', 'danger'].includes(config.theme)) {
    return false
  }
  
  // Check if updateInterval is a positive number
  if (config.updateInterval && (typeof config.updateInterval !== 'number' || config.updateInterval < 100)) {
    return false
  }
  
  return true
}

// Export your AriesMod - this is what gets registered
export const BasicAriesModTemplate: AriesMod = {
  metadata: {
    id: 'basic-template',
    name: 'BasicTemplate',
    displayName: 'Basic Template',
    description: 'A simple template for creating new AriesMods',
    version: '1.0.0',
    author: 'Your Name',
    category: 'custom', // sensor | control | visualization | utility | custom
    icon: '🔧',
    defaultWidth: 200,
    defaultHeight: 150,
    minWidth: 150,
    minHeight: 100,
    maxWidth: 400,
    maxHeight: 300,
    configSchema: {
      displayValue: {
        type: 'text',
        label: 'Display Value',
        default: 'Hello AriesMod!',
        placeholder: 'Enter text to display'
      },
      showIcon: {
        type: 'boolean',
        label: 'Show Icon',
        default: true
      },
      theme: {
        type: 'select',
        label: 'Theme',
        options: [
          { value: 'default', label: 'Default (Blue)' },
          { value: 'success', label: 'Success (Green)' },
          { value: 'warning', label: 'Warning (Yellow)' },
          { value: 'danger', label: 'Danger (Red)' }
        ],
        default: 'default'
      },
      updateInterval: {
        type: 'number',
        label: 'Update Interval (ms)',
        default: 1000,
        min: 100,
        max: 10000,
        step: 100
      }
    },
    tags: ['template', 'basic', 'example']
  },
  component: BasicAriesMod,
  generateDummyData,
  validateConfig
} 