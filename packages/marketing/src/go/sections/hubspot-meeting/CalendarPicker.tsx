import { useMemo } from 'react'
import { cn } from 'ui'

interface CalendarPickerProps {
  monthOffset: number
  availableMonthOffsets: number[]
  timezone: string
  availableDates: Set<string>
  selectedDate: string | null
  onSelectDate: (date: string) => void
  onChangeMonth: (offset: number) => void
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function CalendarPicker({
  monthOffset,
  availableMonthOffsets,
  timezone,
  availableDates,
  selectedDate,
  onSelectDate,
  onChangeMonth,
}: CalendarPickerProps) {
  const { year, month, days, monthLabel } = useMemo(() => {
    const now = new Date()
    const target = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
    const y = target.getFullYear()
    const m = target.getMonth()

    const firstDay = new Date(y, m, 1).getDay()
    const daysInMonth = new Date(y, m + 1, 0).getDate()

    const daysList: Array<{ day: number; dateStr: string } | null> = []

    // Leading empty cells
    for (let i = 0; i < firstDay; i++) {
      daysList.push(null)
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      daysList.push({ day: d, dateStr })
    }

    const targetUtcNoon = new Date(Date.UTC(y, m, 1, 12, 0, 0))
    const label = targetUtcNoon.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
      timeZone: timezone,
    })

    return { year: y, month: m, days: daysList, monthLabel: label }
  }, [monthOffset, timezone])

  const today = new Date().toLocaleDateString('en-CA', { timeZone: timezone })

  const hasPrev = availableMonthOffsets.some((o) => o < monthOffset)
  const hasNext = availableMonthOffsets.some((o) => o > monthOffset)

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => onChangeMonth(monthOffset - 1)}
          disabled={!hasPrev}
          className={cn(
            'p-2 rounded-md text-foreground-lighter transition-colors',
            hasPrev
              ? 'hover:bg-surface-300/50 hover:text-foreground'
              : 'opacity-30 cursor-not-allowed'
          )}
          aria-label="Previous month"
        >
          <ChevronLeftIcon />
        </button>
        <span className="text-foreground font-medium text-sm">{monthLabel}</span>
        <button
          type="button"
          onClick={() => onChangeMonth(monthOffset + 1)}
          disabled={!hasNext}
          className={cn(
            'p-2 rounded-md text-foreground-lighter transition-colors',
            hasNext
              ? 'hover:bg-surface-300/50 hover:text-foreground'
              : 'opacity-30 cursor-not-allowed'
          )}
          aria-label="Next month"
        >
          <ChevronRightIcon />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAY_LABELS.map((label) => (
          <div key={label} className="text-center text-xs text-foreground-lighter font-medium py-1">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((cell, i) => {
          if (!cell) {
            return <div key={`empty-${i}`} />
          }

          const isAvailable = availableDates.has(cell.dateStr)
          const isSelected = selectedDate === cell.dateStr
          const isPast = cell.dateStr < today

          return (
            <button
              key={cell.dateStr}
              type="button"
              disabled={!isAvailable || isPast}
              onClick={() => onSelectDate(cell.dateStr)}
              className={cn(
                'aspect-square flex items-center justify-center rounded-md text-sm transition-colors',
                isSelected
                  ? 'bg-brand-500 text-white font-medium'
                  : isAvailable && !isPast
                    ? 'text-foreground hover:bg-surface-300/50 font-medium'
                    : 'text-foreground-lighter/40 cursor-not-allowed'
              )}
            >
              {cell.day}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ChevronLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M10 12L6 8L10 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M6 4L10 8L6 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
