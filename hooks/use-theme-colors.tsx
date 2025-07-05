"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

// Define available theme colors
export const themeColors = {
  teal: {
    name: "Teal",
    primary: "20 184 166", // teal-500
    secondary: "6 182 212", // cyan-500
    accent: "14 165 233", // sky-500
    gradient: "from-teal-500 to-cyan-500"
  },
  purple: {
    name: "Purple",
    primary: "147 51 234", // purple-600
    secondary: "168 85 247", // purple-500
    accent: "192 132 252", // purple-400
    gradient: "from-purple-600 to-purple-400"
  },
  blue: {
    name: "Blue",
    primary: "37 99 235", // blue-600
    secondary: "59 130 246", // blue-500
    accent: "96 165 250", // blue-400
    gradient: "from-blue-600 to-blue-400"
  },
  emerald: {
    name: "Emerald",
    primary: "5 150 105", // emerald-600
    secondary: "16 185 129", // emerald-500
    accent: "52 211 153", // emerald-400
    gradient: "from-emerald-600 to-emerald-400"
  },
  orange: {
    name: "Orange",
    primary: "234 88 12", // orange-600
    secondary: "249 115 22", // orange-500
    accent: "251 146 60", // orange-400
    gradient: "from-orange-600 to-orange-400"
  },
  pink: {
    name: "Pink",
    primary: "219 39 119", // pink-600
    secondary: "236 72 153", // pink-500
    accent: "244 114 182", // pink-400
    gradient: "from-pink-600 to-pink-400"
  },
  red: {
    name: "Red",
    primary: "220 38 38", // red-600
    secondary: "239 68 68", // red-500
    accent: "248 113 113", // red-400
    gradient: "from-red-600 to-red-400"
  },
  indigo: {
    name: "Indigo",
    primary: "79 70 229", // indigo-600
    secondary: "99 102 241", // indigo-500
    accent: "129 140 248", // indigo-400
    gradient: "from-indigo-600 to-indigo-400"
  }
} as const

export type ThemeColorKey = keyof typeof themeColors

interface ThemeColorContextType {
  currentTheme: ThemeColorKey
  setTheme: (theme: ThemeColorKey) => void
  colors: typeof themeColors[ThemeColorKey]
  useThemeOutlines: boolean
  setUseThemeOutlines: (enabled: boolean) => void
}

const ThemeColorContext = createContext<ThemeColorContextType | undefined>(undefined)

interface ThemeColorProviderProps {
  children: ReactNode
}

export function ThemeColorProvider({ children }: ThemeColorProviderProps) {
  const [currentTheme, setCurrentTheme] = useState<ThemeColorKey>('teal')
  const [useThemeOutlines, setUseThemeOutlines] = useState(false)

  // Load saved theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('comms-theme-color') as ThemeColorKey
    if (savedTheme && themeColors[savedTheme]) {
      setCurrentTheme(savedTheme)
    }
    
    const savedOutlines = localStorage.getItem('comms-theme-outlines')
    if (savedOutlines !== null) {
      setUseThemeOutlines(JSON.parse(savedOutlines))
    }
  }, [])

  // Apply CSS custom properties when theme changes
  useEffect(() => {
    const colors = themeColors[currentTheme]
    const root = document.documentElement
    
    // Set CSS custom properties
    root.style.setProperty('--theme-primary', colors.primary)
    root.style.setProperty('--theme-secondary', colors.secondary)
    root.style.setProperty('--theme-accent', colors.accent)
    
    // Set outline preference
    root.style.setProperty('--theme-outlines-enabled', useThemeOutlines ? '1' : '0')
    
    // Save to localStorage
    localStorage.setItem('comms-theme-color', currentTheme)
  }, [currentTheme, useThemeOutlines])

  // Save outline preference to localStorage
  useEffect(() => {
    localStorage.setItem('comms-theme-outlines', JSON.stringify(useThemeOutlines))
  }, [useThemeOutlines])

  const setTheme = (theme: ThemeColorKey) => {
    setCurrentTheme(theme)
  }

  const handleSetUseThemeOutlines = (enabled: boolean) => {
    setUseThemeOutlines(enabled)
  }

  const colors = themeColors[currentTheme]

  return (
    <ThemeColorContext.Provider value={{ currentTheme, setTheme, colors, useThemeOutlines, setUseThemeOutlines: handleSetUseThemeOutlines }}>
      {children}
    </ThemeColorContext.Provider>
  )
}

export function useThemeColors() {
  const context = useContext(ThemeColorContext)
  if (context === undefined) {
    throw new Error('useThemeColors must be used within a ThemeColorProvider')
  }
  return context
}

// Helper function to get theme-aware classes
export function getThemeClasses(variant: 'primary' | 'secondary' | 'accent' = 'primary') {
  return {
    bg: `bg-[rgb(var(--theme-${variant}))]`,
    bgWithOpacity: (opacity: number) => `bg-[rgba(var(--theme-${variant}),${opacity})]`,
    text: `text-[rgb(var(--theme-${variant}))]`,
    textWithOpacity: (opacity: number) => `text-[rgba(var(--theme-${variant}),${opacity})]`,
    border: `border-[rgb(var(--theme-${variant}))]`,
    borderWithOpacity: (opacity: number) => `border-[rgba(var(--theme-${variant}),${opacity})]`,
    outline: variant === 'secondary' ? 'theme-outline-secondary' : 'theme-outline-primary',
    shadow: `shadow-[rgb(var(--theme-${variant}))]`,
    shadowWithOpacity: (opacity: number) => `shadow-[rgba(var(--theme-${variant}),${opacity})]`
  }
}
