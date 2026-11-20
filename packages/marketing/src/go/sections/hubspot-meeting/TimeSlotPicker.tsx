import { useCallback, useMemo, useRef, useState } from 'react'
import { cn } from 'ui'

import type { TimeSlot } from './types'

interface TimeSlotPickerProps {
  slots: TimeSlot[]
  timezone: string
  selectedSlot: TimeSlot | null
  onSelectSlot: (slot: TimeSlot) => void
  onBack: () => void
  selectedDate: string
}

export default function TimeSlotPicker({
  slots,
  timezone,
  selectedSlot,
  onSelectSlot,
  onBack,
  selectedDate,
}: TimeSlotPickerProps) {
  const dateLabel = useMemo(() => {
    const [year, month, day] = selectedDate.split('-').map(Number)
    const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      timeZone: timezone,
    })
  }, [selectedDate, timezone])

  const formattedSlots = useMemo(
    () =>
      slots.map((slot) => ({
        ...slot,
        label: new Date(slot.startMillisUtc).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          timeZone: timezone,
        }),
      })),
    [slots, timezone]
  )

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-4">
        <button
          type="button"
          onClick={onBack}
          className="p-1.5 rounded-md text-foreground-lighter hover:bg-surface-300/50 hover:text-foreground transition-colors"
          aria-label="Back to calendar"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M10 12L6 8L10 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <span className="text-foreground font-medium text-sm">
          {dateLabel}
          <span className="text-foreground-lighter font-normal">
            {' · '}
            {
              new Intl.DateTimeFormat('en-US', { timeZone: timezone, timeZoneName: 'short' })
                .formatToParts(new Date())
                .find((p) => p.type === 'timeZoneName')?.value
            }
          </span>
        </span>
      </div>

      {formattedSlots.length === 0 ? (
        <p className="text-foreground-lighter text-sm text-center py-8">
          No available times for this date.
        </p>
      ) : (
        <ScrollFadeList>
          {formattedSlots.map((slot, idx) => {
            const isSelected = selectedSlot?.startMillisUtc === slot.startMillisUtc
            return (
              <button
                key={`${idx}-${slot.startMillisUtc}`}
                type="button"
                onClick={() => onSelectSlot(slot)}
                className={cn(
                  'w-full px-4 py-2.5 rounded-md text-sm text-left transition-colors border',
                  isSelected
                    ? 'border-brand-500 bg-brand-500/10 text-brand-500 font-medium'
                    : 'border-muted text-foreground hover:border-foreground-lighter hover:bg-surface-300/30'
                )}
              >
                {slot.label}
              </button>
            )
          })}
        </ScrollFadeList>
      )}
    </div>
  )
}

function ScrollFadeList({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [fadeTop, setFadeTop] = useState(false)
  const [fadeBottom, setFadeBottom] = useState(false)

  const updateFades = useCallback(() => {
    const el = ref.current
    if (!el) return
    setFadeTop(el.scrollTop > 2)
    setFadeBottom(el.scrollTop + el.clientHeight < el.scrollHeight - 2)
  }, [])

  const onRef = useCallback(
    (el: HTMLDivElement | null) => {
      ;(ref as React.MutableRefObject<HTMLDivElement | null>).current = el
      if (el) {
        updateFades()
      }
    },
    [updateFades]
  )

  const top = fadeTop ? 'transparent, black 12px' : 'black, black'
  const bottom = fadeBottom ? 'black calc(100% - 12px), transparent' : 'black, black'
  const mask = `linear-gradient(to bottom, ${top}, ${bottom})`

  return (
    <div
      ref={onRef}
      onScroll={updateFades}
      className="flex flex-col gap-2 max-h-[320px] overflow-y-auto pr-1 py-1"
      style={{
        maskImage: mask,
        WebkitMaskImage: mask,
        transition: 'mask-image 0.15s ease, -webkit-mask-image 0.15s ease',
      }}
    >
      {children}
    </div>
  )
}
