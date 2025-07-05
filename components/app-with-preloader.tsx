"use client"

import { useState, useEffect } from "react"
import { Preloader } from "./preloader"

interface AppWithPreloaderProps {
  children: React.ReactNode
}

export function AppWithPreloader({ children }: AppWithPreloaderProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [sessionKey, setSessionKey] = useState<string | null>(null)
  const [isHotReload, setIsHotReload] = useState(false)

  // Always start with loading state on mount
  useEffect(() => {
    // Generate a unique session key for this app instance
    const currentSession = Date.now().toString()
    const lastSession = localStorage.getItem('comms-session-key')
    
    // If it's a new session or different from last time, show preloader
    if (!lastSession || lastSession !== currentSession) {
      setIsLoading(true)
      localStorage.setItem('comms-session-key', currentSession)
      setSessionKey(currentSession)
    } else {
      // For development, always show preloader
      if (process.env.NODE_ENV === 'development') {
        setIsLoading(true)
        setIsHotReload(true) // Mark as hot reload
        localStorage.setItem('comms-session-key', currentSession)
        setSessionKey(currentSession)
      }
    }
  }, [])

  // Reset loading state on hot reload (development mode)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const handleBeforeUnload = () => {
        setIsLoading(true)
        setIsHotReload(true) // Mark as hot reload
      }
      
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          // Reset preloader when tab becomes visible again
          setIsLoading(true)
          setIsHotReload(true) // Mark as hot reload
        }
      }
      
      window.addEventListener('beforeunload', handleBeforeUnload)
      document.addEventListener('visibilitychange', handleVisibilityChange)
      
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload)
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
    }
  }, [])

  const handlePreloaderComplete = () => {
    setIsLoading(false)
    setIsHotReload(false) // Reset hot reload flag
  }

  // Dynamic duration based on context
  const getPreloaderDuration = () => {
    if (isHotReload) {
      return 1500 // 1.5 seconds for hot reloads
    }
    if (process.env.NODE_ENV === 'development') {
      return 2500 // 2.5 seconds for development
    }
    return 3500 // 3.5 seconds for production (first load)
  }

  return (
    <>
      {isLoading && (
        <Preloader 
          duration={getPreloaderDuration()}
          onComplete={handlePreloaderComplete}
        />
      )}
      <div style={{ display: isLoading ? 'none' : 'block' }}>
        {children}
      </div>
    </>
  )
}
