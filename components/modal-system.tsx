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
    // Get current grid state from localStorage or main content
    const gridState = localStorage.getItem("comms-grid-state")
    if (gridState) {
      const profiles = { ...state.profiles, [name]: JSON.parse(gridState) }
      updateProfiles(profiles)
    }
  }

  const handleLoadProfile = (name: string) => {
    const profile = state.profiles[name]
    if (profile) {
      localStorage.setItem("comms-grid-state", JSON.stringify(profile))
      // Trigger a page reload to load the new profile
      window.location.reload()
    }
    loadProfile(name)
  }

  const handleDeleteProfile = (name: string) => {
    const { [name]: deleted, ...remainingProfiles } = state.profiles
    updateProfiles(remainingProfiles)
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
