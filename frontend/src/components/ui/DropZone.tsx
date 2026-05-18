'use client'

import { useRef, useState } from 'react'

interface DropZoneProps {
  onFile: (file: File) => void
  accept?: string
  disabled?: boolean
  children: React.ReactNode
  className?: string
}

export default function DropZone({ onFile, accept, disabled, children, className }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const dragCounter = useRef(0)

  const accepts = (file: File) => {
    if (!accept) return true
    return accept.split(',').some(type => {
      const t = type.trim()
      if (t.endsWith('/*')) return file.type.startsWith(t.slice(0, -1))
      return file.type === t
    })
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current++
    if (!disabled) setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current--
    if (dragCounter.current === 0) setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current = 0
    setIsDragging(false)
    if (disabled) return
    const file = e.dataTransfer.files[0]
    if (file && accepts(file)) onFile(file)
  }

  return (
    <div
      className={`relative ${className ?? ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {children}
      {isDragging && (
        <div className="absolute inset-0 z-50 rounded-2xl border-2 border-dashed border-[var(--accent)] bg-[var(--accent)]/10 flex items-center justify-center pointer-events-none">
          <span className="text-[var(--accent)] text-sm font-medium">Suelta aquí</span>
        </div>
      )}
    </div>
  )
}
