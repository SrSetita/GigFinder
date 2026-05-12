'use client'

import { useState, useEffect } from 'react'

interface CalendarProps {
  selectedDate: string | null
  onSelectDate: (date: string) => void
  bookedDates?: string[]
}

const DAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export default function Calendar({ selectedDate, onSelectDate, bookedDates = [] }: CalendarProps) {
  const [today, setToday] = useState(() => new Date(0))
  const [view, setView] = useState({ year: 2025, month: 0 })

  useEffect(() => {
    const now = new Date()
    setToday(now)
    setView({ year: now.getFullYear(), month: now.getMonth() })
  }, [])

  const firstDay = new Date(view.year, view.month, 1)
  // Monday-first: getDay() returns 0=Sun, adjust to 0=Mon
  const startOffset = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate()

  const prevMonth = () => setView(v => v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 })
  const nextMonth = () => setView(v => v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 })

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--muted)] transition-colors text-gray-400 hover:text-white">
          ‹
        </button>
        <span className="font-semibold">{MONTHS[view.month]} {view.year}</span>
        <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--muted)] transition-colors text-gray-400 hover:text-white">
          ›
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs text-gray-500 py-1">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={idx} />

          const dateStr = toDateStr(view.year, view.month, day)
          const dayDate = new Date(view.year, view.month, day)
          const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
          const isPast = dayDate < todayDate
          const isToday = dateStr === toDateStr(today.getFullYear(), today.getMonth(), today.getDate())
          const isSelected = dateStr === selectedDate
          const isBooked = bookedDates.includes(dateStr)

          return (
            <button
              key={idx}
              disabled={isPast}
              onClick={() => onSelectDate(dateStr)}
              className={`
                aspect-square rounded-lg text-sm font-medium transition-all flex items-center justify-center relative
                ${isPast ? 'text-gray-700 cursor-not-allowed' : 'hover:bg-[var(--accent)]/20 cursor-pointer'}
                ${isSelected ? 'bg-[var(--accent)] text-white hover:bg-[var(--accent)]' : ''}
                ${isToday && !isSelected ? 'border border-[var(--accent)] text-[var(--accent)]' : ''}
                ${!isSelected && !isToday && !isPast ? 'text-gray-200' : ''}
              `}
            >
              {day}
              {isBooked && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-orange-400" />
              )}
            </button>
          )
        })}
      </div>

      <p className="text-xs text-gray-600 mt-3 text-center">• Días con reservas existentes</p>
    </div>
  )
}
