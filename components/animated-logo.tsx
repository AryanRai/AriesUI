"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import Image from "next/image"

interface AnimatedLogoProps {
  size?: number
  className?: string
  animationsEnabled?: boolean
}

export function AnimatedLogo({ size = 40, className = "", animationsEnabled = true }: AnimatedLogoProps) {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Simulate image loading
    const timer = setTimeout(() => setIsLoaded(true), 100)
    return () => clearTimeout(timer)
  }, [])

  if (!animationsEnabled) {
    return (
      <div className={`relative ${className}`} style={{ width: size, height: size }}>
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-teal-600 to-slate-700 flex items-center justify-center shadow-lg border border-teal-500/20">
          <Image
            src="/branding/Comms.png"
            alt="Comms Logo"
            width={size * 0.6}
            height={size * 0.6}
            className="object-contain"
            onLoad={() => setIsLoaded(true)}
          />
        </div>
      </div>
    )
  }

  return (
    <motion.div
      className={`relative ${className}`}
      style={{ width: size, height: size }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Outer glow ring - inspired by preloader */}
      <motion.div
        className="absolute inset-0 rounded-xl bg-gradient-to-br from-teal-500/20 to-slate-600/20"
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Main logo container */}
      <motion.div
        className="absolute inset-0 rounded-xl bg-gradient-to-br from-teal-600 to-slate-700 flex items-center justify-center shadow-lg border border-teal-500/20 overflow-hidden"
        whileHover={{ 
          scale: 1.05,
          boxShadow: "0 0 20px rgba(20, 184, 166, 0.4)"
        }}
        transition={{ duration: 0.3 }}
      >
        {/* Animated background pulse */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-slate-600/10"
          animate={{
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* Logo image */}
        <motion.div
          className="relative z-10"
          initial={{ opacity: 0, rotate: -10 }}
          animate={{ 
            opacity: isLoaded ? 1 : 0,
            rotate: 0,
          }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Image
            src="/branding/Comms.png"
            alt="Comms Logo"
            width={size * 0.6}
            height={size * 0.6}
            className="object-contain filter brightness-110"
            onLoad={() => setIsLoaded(true)}
          />
        </motion.div>
        
        {/* Chromatic aberration effect - inspired by preloader */}
        <motion.div
          className="absolute inset-0 rounded-xl"
          animate={{
            boxShadow: [
              "0 0 0px rgba(255, 0, 0, 0), 0 0 0px rgba(0, 0, 255, 0), 0 0 0px rgba(0, 255, 0, 0)",
              "0 0 3px rgba(255, 0, 0, 0.1), 0 0 5px rgba(0, 0, 255, 0.1), 0 0 7px rgba(0, 255, 0, 0.1)",
              "0 0 0px rgba(255, 0, 0, 0), 0 0 0px rgba(0, 0, 255, 0), 0 0 0px rgba(0, 255, 0, 0)"
            ]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.div>
      
      {/* Rotating energy ring - inspired by preloader rotation */}
      <motion.div
        className="absolute inset-0 rounded-xl border border-teal-400/30"
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      
      {/* Pulsing dot indicator */}
      <motion.div
        className="absolute -top-1 -right-1 w-2 h-2 bg-teal-400 rounded-full"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [1, 0.7, 1],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </motion.div>
  )
}
