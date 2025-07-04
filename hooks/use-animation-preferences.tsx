"use client"

import { useState, useEffect } from "react"

export const useAnimationPreferences = () => {
  const [animationsEnabled, setAnimationsEnabled] = useState(true)
  
  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const userPrefersReducedMotion = mediaQuery.matches
    
    // Check localStorage for user preference
    const savedPreference = localStorage.getItem('comms-animations-enabled')
    
    if (savedPreference !== null) {
      setAnimationsEnabled(JSON.parse(savedPreference))
    } else {
      // Default to disabled if user prefers reduced motion
      setAnimationsEnabled(!userPrefersReducedMotion)
    }
    
    const handleChange = () => {
      const savedPreference = localStorage.getItem('comms-animations-enabled')
      if (savedPreference === null) {
        setAnimationsEnabled(!mediaQuery.matches)
      }
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])
  
  const toggleAnimations = () => {
    const newValue = !animationsEnabled
    setAnimationsEnabled(newValue)
    localStorage.setItem('comms-animations-enabled', JSON.stringify(newValue))
  }
  
  return { animationsEnabled, toggleAnimations }
}

// Animation variants for consistent use across components
export const standardAnimationVariants = {
  // Entrance animations
  slideInFromLeft: {
    hidden: { x: -50, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 30 } }
  },
  slideInFromRight: {
    hidden: { x: 50, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 30 } }
  },
  slideInFromTop: {
    hidden: { y: -50, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 30 } }
  },
  slideInFromBottom: {
    hidden: { y: 50, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 30 } }
  },
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } }
  },
  scaleIn: {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { scale: 1, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 25 } }
  },
  
  // Container animations with stagger
  staggerContainer: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  },
  
  // Hover animations
  hoverScale: {
    hover: { scale: 1.05, transition: { duration: 0.2 } }
  },
  hoverGlow: {
    hover: { 
      boxShadow: "0 0 20px rgba(20, 184, 166, 0.3)",
      transition: { duration: 0.3 }
    }
  },
  
  // Button animations
  buttonPress: {
    tap: { scale: 0.95, transition: { duration: 0.1 } }
  }
}

// Theme colors for consistent use
export const themeColors = {
  primary: {
    teal: {
      50: 'rgb(240, 253, 250)',
      100: 'rgb(204, 251, 241)',
      200: 'rgb(153, 246, 228)',
      300: 'rgb(94, 234, 212)',
      400: 'rgb(45, 212, 191)',
      500: 'rgb(20, 184, 166)',
      600: 'rgb(13, 148, 136)',
      700: 'rgb(15, 118, 110)',
      800: 'rgb(17, 94, 89)',
      900: 'rgb(19, 78, 74)'
    },
    cyan: {
      400: 'rgb(34, 211, 238)',
      500: 'rgb(6, 182, 212)',
      600: 'rgb(8, 145, 178)'
    },
    purple: {
      400: 'rgb(196, 181, 253)',
      500: 'rgb(168, 85, 247)',
      600: 'rgb(147, 51, 234)'
    }
  },
  monochrome: {
    slate: {
      50: 'rgb(248, 250, 252)',
      100: 'rgb(241, 245, 249)',
      200: 'rgb(226, 232, 240)',
      300: 'rgb(203, 213, 225)',
      400: 'rgb(148, 163, 184)',
      500: 'rgb(100, 116, 139)',
      600: 'rgb(71, 85, 105)',
      700: 'rgb(51, 65, 85)',
      800: 'rgb(30, 41, 59)',
      900: 'rgb(15, 23, 42)'
    }
  }
}
