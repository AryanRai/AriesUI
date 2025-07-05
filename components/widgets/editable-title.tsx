"use client"

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface EditableTitleProps {
  title: string
  onTitleChange: (newTitle: string) => void
  className?: string
  placeholder?: string
  maxLength?: number
  disabled?: boolean
}

export function EditableTitle({
  title,
  onTitleChange,
  className = "",
  placeholder = "Enter title...",
  maxLength = 50,
  disabled = false
}: EditableTitleProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(title)
  const inputRef = useRef<HTMLInputElement>(null)

  // Reset edit value when title prop changes
  useEffect(() => {
    setEditValue(title)
  }, [title])

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleDoubleClick = useCallback(() => {
    if (!disabled) {
      setIsEditing(true)
      setEditValue(title)
    }
  }, [disabled, title])

  const handleSave = useCallback(() => {
    const trimmedValue = editValue.trim()
    if (trimmedValue && trimmedValue !== title) {
      onTitleChange(trimmedValue)
    }
    setIsEditing(false)
  }, [editValue, title, onTitleChange])

  const handleCancel = useCallback(() => {
    setEditValue(title)
    setIsEditing(false)
  }, [title])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }, [handleSave, handleCancel])

  const handleBlur = useCallback(() => {
    handleSave()
  }, [handleSave])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value)
  }, [])

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        value={editValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className={cn("h-auto p-0 border-none bg-transparent text-sm font-medium", className)}
        placeholder={placeholder}
        maxLength={maxLength}
        onClick={(e) => e.stopPropagation()} // Prevent triggering parent click events
        onMouseDown={(e) => e.stopPropagation()} // Prevent triggering drag events
      />
    )
  }

  return (
    <span
      className={cn(
        "cursor-pointer hover:bg-muted/20 rounded px-1 py-0.5 transition-colors",
        disabled && "cursor-default",
        className
      )}
      onDoubleClick={handleDoubleClick}
      title={disabled ? title : "Double-click to edit"}
    >
      {title || placeholder}
    </span>
  )
} 