"use client"

import { useComms } from "@/components/comms-context"
import { ConfigModal } from "@/components/modals/config-modal"
import { LogsModal } from "@/components/modals/logs-modal"
import { TerminalModal } from "@/components/modals/terminal-modal"
import { PerformanceModal } from "@/components/modals/performance-modal"
import { AriesModsModal } from "@/components/modals/ariesmods-modal"
import { WidgetConfigModal } from "@/components/modals/widget-config-modal"
import { ProfilesModal } from "@/components/modals/profiles-modal"

export function ModalSystem() {
  const { state, loadProfile, updateProfiles, dispatch } = useComms()

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

  return (
    <>
      {state.activeModal === "config" && <ConfigModal />}
      {state.activeModal === "logs" && <LogsModal />}
      {state.activeModal === "terminal" && <TerminalModal />}
      {state.activeModal === "performance" && <PerformanceModal />}
      {state.activeModal === "ariesmods" && <AriesModsModal />}
      {state.activeModal === "widget-config" && <WidgetConfigModal />}
      {state.activeModal === "profiles" && (
        <ProfilesModal
          profiles={state.profiles}
          activeProfile={state.activeProfile}
          onLoadProfile={handleLoadProfile}
          onSaveProfile={handleSaveProfile}
          onDeleteProfile={handleDeleteProfile}
          onClose={() => dispatch({ type: "SET_MODAL", payload: null })}
        />
      )}
    </>
  )
}
