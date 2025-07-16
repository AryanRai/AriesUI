"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useComms } from "@/components/comms-context"
import { useAnimationPreferences } from "@/hooks/use-animation-preferences"
import { ConfigModal } from "@/components/modals/config-modal"
import { LogsModal } from "@/components/modals/logs-modal"
import { TerminalModal } from "@/components/modals/terminal-modal"
import { PerformanceModal } from "@/components/modals/performance-modal"
import { AriesModsModal } from "@/components/modals/ariesmods-modal"
import { WidgetConfigModal } from "@/components/modals/widget-config-modal"
import { ProfilesModal } from "@/components/modals/profiles-modal"
import { MarketplaceModal } from "@/components/modals/marketplace-modal"

export function ModalSystem() {
  const { state, loadProfile, updateProfiles, dispatch } = useComms()
  const { animationsEnabled } = useAnimationPreferences()

  const handleSaveProfile = (name: string) => {
    // Get current grid state from localStorage
    const gridState = localStorage.getItem("comms-grid-state")
    if (gridState) {
      const profiles = { ...state.profiles, [name]: JSON.parse(gridState) }
      updateProfiles(profiles)
      dispatch({ type: "ADD_LOG", payload: `Profile "${name}" saved successfully` })
    } else {
      dispatch({ type: "ADD_LOG", payload: `Failed to save profile "${name}" - no grid state found` })
    }
  }

  const handleLoadProfile = (name: string) => {
    const profile = state.profiles[name]
    if (profile) {
      // Save the profile data to localStorage
      localStorage.setItem("comms-grid-state", JSON.stringify(profile))
      
      // Set the active profile
      loadProfile(name)
      
      // Dispatch a custom event to trigger grid state reload
      window.dispatchEvent(new CustomEvent("profileChanged", { detail: { profileName: name } }))
      
      dispatch({ type: "ADD_LOG", payload: `Profile "${name}" loaded successfully` })
      
      // Close the modal
      dispatch({ type: "SET_MODAL", payload: null })
    } else {
      dispatch({ type: "ADD_LOG", payload: `Failed to load profile "${name}" - profile not found` })
    }
  }

  const handleDeleteProfile = (name: string) => {
    const { [name]: deleted, ...remainingProfiles } = state.profiles
    updateProfiles(remainingProfiles)
    dispatch({ type: "ADD_LOG", payload: `Profile "${name}" deleted successfully` })
  }

  const handleClearAllProfiles = () => {
    // Keep only the default profile
    const defaultProfile = state.profiles.default || {}
    updateProfiles({ default: defaultProfile })
    
    // Switch to default profile
    loadProfile("default")
    
    dispatch({ type: "ADD_LOG", payload: "All profiles cleared except default" })
  }

  const handleClose = () => dispatch({ type: "SET_MODAL", payload: null })

  const MotionWrapper = animationsEnabled ? motion.div : 'div'

  return (
    <AnimatePresence mode="wait">
      {state.activeModal === "config" && (
        <MotionWrapper
          key="config-modal"
          {...(animationsEnabled ? {
            initial: { opacity: 0, scale: 0.9 },
            animate: { opacity: 1, scale: 1 },
            exit: { opacity: 0, scale: 0.9 },
            transition: { duration: 0.2 }
          } : {})}
        >
          <ConfigModal />
        </MotionWrapper>
      )}
      {state.activeModal === "logs" && (
        <MotionWrapper
          key="logs-modal"
          {...(animationsEnabled ? {
            initial: { opacity: 0, scale: 0.9 },
            animate: { opacity: 1, scale: 1 },
            exit: { opacity: 0, scale: 0.9 },
            transition: { duration: 0.2 }
          } : {})}
        >
          <LogsModal />
        </MotionWrapper>
      )}
      {state.activeModal === "terminal" && (
        <MotionWrapper
          key="terminal-modal"
          {...(animationsEnabled ? {
            initial: { opacity: 0, scale: 0.9 },
            animate: { opacity: 1, scale: 1 },
            exit: { opacity: 0, scale: 0.9 },
            transition: { duration: 0.2 }
          } : {})}
        >
          <TerminalModal />
        </MotionWrapper>
      )}
      {state.activeModal === "performance" && (
        <MotionWrapper
          key="performance-modal"
          {...(animationsEnabled ? {
            initial: { opacity: 0, scale: 0.9 },
            animate: { opacity: 1, scale: 1 },
            exit: { opacity: 0, scale: 0.9 },
            transition: { duration: 0.2 }
          } : {})}
        >
          <PerformanceModal />
        </MotionWrapper>
      )}
      {state.activeModal === "ariesmods" && (
        <MotionWrapper
          key="ariesmods-modal"
          {...(animationsEnabled ? {
            initial: { opacity: 0, scale: 0.9 },
            animate: { opacity: 1, scale: 1 },
            exit: { opacity: 0, scale: 0.9 },
            transition: { duration: 0.2 }
          } : {})}
        >
          <AriesModsModal />
        </MotionWrapper>
      )}
      {state.activeModal === "widget-config" && (
        <MotionWrapper
          key="widget-config-modal"
          {...(animationsEnabled ? {
            initial: { opacity: 0, scale: 0.9 },
            animate: { opacity: 1, scale: 1 },
            exit: { opacity: 0, scale: 0.9 },
            transition: { duration: 0.2 }
          } : {})}
        >
          <WidgetConfigModal />
        </MotionWrapper>
      )}
      {state.activeModal === "profiles" && (
        <MotionWrapper
          key="profiles-modal"
          {...(animationsEnabled ? {
            initial: { opacity: 0, scale: 0.9 },
            animate: { opacity: 1, scale: 1 },
            exit: { opacity: 0, scale: 0.9 },
            transition: { duration: 0.2 }
          } : {})}
        >
          <ProfilesModal
            profiles={state.profiles}
            activeProfile={state.activeProfile}
            onLoadProfile={handleLoadProfile}
            onSaveProfile={handleSaveProfile}
            onDeleteProfile={handleDeleteProfile}
            onClearAllProfiles={handleClearAllProfiles}
            onClose={handleClose}
          />
        </MotionWrapper>
      )}
      {state.activeModal === "marketplace" && (
        <MotionWrapper
          key="marketplace-modal"
          {...(animationsEnabled ? {
            initial: { opacity: 0, scale: 0.9 },
            animate: { opacity: 1, scale: 1 },
            exit: { opacity: 0, scale: 0.9 },
            transition: { duration: 0.2 }
          } : {})}
        >
          <MarketplaceModal />
        </MotionWrapper>
      )}
    </AnimatePresence>
  )
}
