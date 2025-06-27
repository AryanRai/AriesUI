"use client"

import { useComms } from "@/components/comms-context"
import { ConfigModal } from "@/components/modals/config-modal"
import { LogsModal } from "@/components/modals/logs-modal"
import { TerminalModal } from "@/components/modals/terminal-modal"
import { PerformanceModal } from "@/components/modals/performance-modal"
import { AriesModsModal } from "@/components/modals/ariesmods-modal"
import { WidgetConfigModal } from "@/components/modals/widget-config-modal"

export function ModalSystem() {
  const { state } = useComms()

  return (
    <>
      {state.activeModal === "config" && <ConfigModal />}
      {state.activeModal === "logs" && <LogsModal />}
      {state.activeModal === "terminal" && <TerminalModal />}
      {state.activeModal === "performance" && <PerformanceModal />}
      {state.activeModal === "ariesmods" && <AriesModsModal />}
      {state.activeModal === "widget-config" && <WidgetConfigModal />}
    </>
  )
}
