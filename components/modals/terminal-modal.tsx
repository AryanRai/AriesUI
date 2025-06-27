"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useComms } from "@/components/comms-context"

export function TerminalModal() {
  const { state, dispatch } = useComms()
  const [command, setCommand] = useState("")
  const [output, setOutput] = useState<string[]>(["Comms Terminal v1.0.0", "Type 'help' for available commands", ""])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  const executeCommand = (cmd: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const newOutput = [...output, `[${timestamp}] > ${cmd}`]

    // Simple command processing
    switch (cmd.toLowerCase().trim()) {
      case "help":
        newOutput.push("Available commands:")
        newOutput.push("  help - Show this help")
        newOutput.push("  clear - Clear terminal")
        newOutput.push("  status - Show system status")
        newOutput.push("  streams - List data streams")
        break
      case "clear":
        setOutput(["Terminal cleared", ""])
        return
      case "status":
        newOutput.push("System Status: Operational")
        newOutput.push(`Active streams: ${state.streams.filter((s) => s.status === "connected").length}`)
        newOutput.push(`Total widgets: ${state.widgets.length}`)
        break
      case "streams":
        state.streams.forEach((stream) => {
          newOutput.push(`  ${stream.name}: ${stream.status}`)
        })
        break
      default:
        newOutput.push(`Unknown command: ${cmd}`)
        newOutput.push("Type 'help' for available commands")
    }

    newOutput.push("")
    setOutput(newOutput)
    dispatch({ type: "ADD_TERMINAL_COMMAND", payload: cmd })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (command.trim()) {
      executeCommand(command)
      setCommand("")
      setHistoryIndex(-1)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp") {
      e.preventDefault()
      if (historyIndex < state.terminalHistory.length - 1) {
        const newIndex = historyIndex + 1
        setHistoryIndex(newIndex)
        setCommand(state.terminalHistory[state.terminalHistory.length - 1 - newIndex] || "")
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        setCommand(state.terminalHistory[state.terminalHistory.length - 1 - newIndex] || "")
      } else if (historyIndex === 0) {
        setHistoryIndex(-1)
        setCommand("")
      }
    }
  }

  return (
    <Dialog open={true} onOpenChange={() => dispatch({ type: "SET_MODAL", payload: null })}>
      <DialogContent className="sm:max-w-3xl h-[600px]">
        <DialogHeader>
          <DialogTitle>Terminal</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col h-full">
          <ScrollArea className="flex-1 bg-black/90 text-green-400 p-4 rounded font-mono text-sm">
            {output.map((line, index) => (
              <div key={index}>{line}</div>
            ))}
          </ScrollArea>
          <form onSubmit={handleSubmit} className="mt-4">
            <div className="flex items-center gap-2">
              <span className="text-green-400 font-mono">{">"}</span>
              <Input
                ref={inputRef}
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={handleKeyDown}
                className="font-mono bg-black/90 text-green-400 border-green-400/30"
                placeholder="Enter command..."
              />
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
