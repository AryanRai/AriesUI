"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface PreloaderProps {
  duration?: number
  onComplete?: () => void
}

export function Preloader({ duration = 10000, onComplete }: PreloaderProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Always show preloader on mount (covers hot reloads and page reloads)
    setIsVisible(true)

    const timer = setTimeout(() => {
      setIsVisible(false)
      if (onComplete) {
        // Wait for exit animation to complete
        setTimeout(onComplete, 500)
      }
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onComplete])

  // Reset preloader on hot reload (development mode)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const handleBeforeUnload = () => {
        setIsVisible(true)
      }
      
      // Listen for hot reload events
      window.addEventListener('beforeunload', handleBeforeUnload)
      
      // Also listen for focus events (when returning to the tab)
      const handleFocus = () => {
        setIsVisible(true)
      }
      
      window.addEventListener('focus', handleFocus)
      
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload)
        window.removeEventListener('focus', handleFocus)
      }
    }
  }, [])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999]"
        >
          {/* Direct HTML/CSS implementation */}
          <div className="preloader-container">
            <div className="circle1">
              <div className="circle2">
                <div className="circle3">
                  <div className="circle4"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Loading text - Outside the blurred container for proper centering */}
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-20 pointer-events-none">
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.5 }}
            >
              <motion.div
                className="text-white text-xl font-bold tracking-wider mb-2"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                COMMS
              </motion.div>
              <motion.div
                className="text-white/70 text-sm"
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
              >
                Initializing Interface...
              </motion.div>
            </motion.div>
          </div>

          {/* Progress bar - Also outside the blurred container */}
          <div className="absolute inset-0 flex items-end justify-center pb-8 pointer-events-none">
            <motion.div
              className="w-64 h-1 bg-white/20 rounded-full overflow-hidden"
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: 2, duration: 0.5 }}
            >
              <motion.div
                className="h-full bg-white rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ 
                  duration: duration / 1000 - 2,
                  delay: 2,
                  ease: "easeInOut" 
                }}
              />
            </motion.div>
          </div>

          {/* Embedded CSS - Direct from your preloader.css */}
          <style jsx>{`
            .preloader-container {
              width: 100vw;
              height: 100vh;
              position: relative;
              background-color: black;
              filter: blur(10px) contrast(10);
              will-change: contents;
              overflow: hidden;
            }

            .circle1 {
              width: 200px;
              height: 200px;
              border-radius: 50%;
              position: absolute;
              top: 50%;
              left: 50%;
              translate: -50% -50%;
              background-color: white;
              box-shadow: 0px 0px 10px red, 0px 0px 20px blue, 0px 0px 21px green;
              animation: grow 2s linear(
                0 0%, 0 2.27%, 0.02 4.53%, 0.04 6.8%, 0.06 9.07%, 0.1 11.33%, 0.14 13.6%, 0.25 18.15%,
                0.39 22.7%, 0.56 27.25%, 0.77 31.8%, 1 36.35%, 0.89 40.9%, 0.85 43.18%, 0.81 45.45%, 0.79 47.72%,
                0.77 50%, 0.75 52.27%, 0.75 54.55%, 0.75 56.82%, 0.77 59.1%, 0.79 61.38%, 0.81 63.65%, 0.85 65.93%,
                0.89 68.2%, 1 72.7%, 0.97 74.98%, 0.95 77.25%, 0.94 79.53%, 0.94 81.8%, 0.94 84.08%, 0.95 86.35%,
                0.97 88.63%, 1 90.9%, 0.99 93.18%, 0.98 95.45%, 0.99 97.73%, 1 100%
              ) infinite alternate,
              rot 4s ease 1s infinite;
              will-change: contents;
            }

            .circle2 {
              width: 180px;
              height: 180px;
              position: absolute;
              top: 50%;
              left: 50%;
              translate: -50% -50%;
              background-color: rgb(0, 0, 0);
              animation: grow 1s linear(
                0 0%, 0 2.27%, 0.02 4.53%, 0.04 6.8%, 0.06 9.07%, 0.1 11.33%, 0.14 13.6%, 0.25 18.15%,
                0.39 22.7%, 0.56 27.25%, 0.77 31.8%, 1 36.35%, 0.89 40.9%, 0.85 43.18%, 0.81 45.45%, 0.79 47.72%,
                0.77 50%, 0.75 52.27%, 0.75 54.55%, 0.75 56.82%, 0.77 59.1%, 0.79 61.38%, 0.81 63.65%, 0.85 65.93%,
                0.89 68.2%, 1 72.7%, 0.97 74.98%, 0.95 77.25%, 0.94 79.53%, 0.94 81.8%, 0.94 84.08%, 0.95 86.35%,
                0.97 88.63%, 1 90.9%, 0.99 93.18%, 0.98 95.45%, 0.99 97.73%, 1 100%
              ) infinite alternate,
              rot 1s ease 2s infinite;
              will-change: contents;
            }

            .circle3 {
              width: 160px;
              height: 160px;
              position: absolute;
              top: 50%;
              left: 50%;
              translate: -50% -50%;
              border-radius: 50%;
              background-color: rgb(255, 255, 255);
              box-shadow: 0px 0px 10px red, 0px 0px 20px blue, 0px 0px 21px green;
              animation: grow 1s linear(
                0 0%, 0 2.27%, 0.02 4.53%, 0.04 6.8%, 0.06 9.07%, 0.1 11.33%, 0.14 13.6%, 0.25 18.15%,
                0.39 22.7%, 0.56 27.25%, 0.77 31.8%, 1 36.35%, 0.89 40.9%, 0.85 43.18%, 0.81 45.45%, 0.79 47.72%,
                0.77 50%, 0.75 52.27%, 0.75 54.55%, 0.75 56.82%, 0.77 59.1%, 0.79 61.38%, 0.81 63.65%, 0.85 65.93%,
                0.89 68.2%, 1 72.7%, 0.97 74.98%, 0.95 77.25%, 0.94 79.53%, 0.94 81.8%, 0.94 84.08%, 0.95 86.35%,
                0.97 88.63%, 1 90.9%, 0.99 93.18%, 0.98 95.45%, 0.99 97.73%, 1 100%
              ) infinite alternate,
              rot 2s ease 3s infinite;
              will-change: contents;
            }

            .circle4 {
              width: 130px;
              height: 130px;
              position: absolute;
              top: 50%;
              left: 50%;
              translate: -50% -50%;
              background-color: rgb(0, 0, 0);
              animation: grow 4s linear(
                0 0%, 0 2.27%, 0.02 4.53%, 0.04 6.8%, 0.06 9.07%, 0.1 11.33%, 0.14 13.6%, 0.25 18.15%,
                0.39 22.7%, 0.56 27.25%, 0.77 31.8%, 1 36.35%, 0.89 40.9%, 0.85 43.18%, 0.81 45.45%, 0.79 47.72%,
                0.77 50%, 0.75 52.27%, 0.75 54.55%, 0.75 56.82%, 0.77 59.1%, 0.79 61.38%, 0.81 63.65%, 0.85 65.93%,
                0.89 68.2%, 1 72.7%, 0.97 74.98%, 0.95 77.25%, 0.94 79.53%, 0.94 81.8%, 0.94 84.08%, 0.95 86.35%,
                0.97 88.63%, 1 90.9%, 0.99 93.18%, 0.98 95.45%, 0.99 97.73%, 1 100%
              ) infinite alternate,
              rot 1s ease 2s infinite;
            }

            @keyframes grow {
              0% {
                scale: 0.9;
              }
              100% {
                scale: 1;
              }
            }

            @keyframes rot {
              0% {
                rotate: 0turn;
              }
              100% {
                rotate: 0.25turn;
              }
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
