'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import type { GoHubSpotMeetingSection } from '../schemas'
import BookingForm from './hubspot-meeting/BookingForm'
import CalendarPicker from './hubspot-meeting/CalendarPicker'
import Confirmation from './hubspot-meeting/Confirmation'
import TimeSlotPicker from './hubspot-meeting/TimeSlotPicker'
import TimezoneSelector from './hubspot-meeting/TimezoneSelector'
import { useScheduler } from './hubspot-meeting/useScheduler'

export default function HubSpotMeetingSection({ section }: { section: GoHubSpotMeetingSection }) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { rootMargin: '-40% 0px -40% 0px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const {
    state,
    timezone,
    availableDates,
    slotsForSelectedDate,
    availableMonthOffsets,
    selectDate,
    selectSlot,
    goBackToDate,
    goBackToTime,
    changeMonth,
    setTimezone,
    submitBooking,
    retry,
    dismissError,
  } = useScheduler(section.meetingSlug, isInView)

  const selectedTimeLabel = useMemo(() => {
    if (!state.selectedSlot) return ''
    return new Date(state.selectedSlot.startMillisUtc).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: timezone,
    })
  }, [state.selectedSlot, timezone])

  return (
    <div ref={sectionRef} className="max-w-[80rem] mx-auto px-8">
      {(section.title || section.description) && (
        <div className="max-w-3xl mx-auto text-center mb-12">
          {section.title && (
            <h2 className="text-foreground text-2xl sm:text-3xl font-medium">{section.title}</h2>
          )}
          {section.description && (
            <p className="text-foreground-lighter mt-3 text-lg">{section.description}</p>
          )}
        </div>
      )}

      <div className="max-w-md mx-auto border border-muted rounded-xl bg-surface-100 p-6 min-h-[440px] flex flex-col h-full">
        {state.step === 'loading' && (
          <div className="flex items-center justify-center h-full min-h-[inherit]">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-spinner text-foreground-muted"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          </div>
        )}

        {state.step === 'error' && (
          <div className="flex flex-col items-center justify-center h-full min-h-[inherit] gap-3">
            <div className="rounded-full bg-destructive-200/50 p-3">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-destructive-600"
              >
                <path
                  d="M10 6v4m0 4h.01M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="text-foreground text-sm font-medium">Something went wrong</p>
            <p className="text-foreground-lighter text-sm text-center max-w-xs">{state.error}</p>
            <button
              type="button"
              onClick={retry}
              className="mt-1 px-4 py-2 text-sm font-medium rounded-md bg-brand-500 text-white hover:bg-brand-600 transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {(state.step === 'date-select' || state.step === 'time-select') && (
          <div className="mb-6 flex items-center justify-center">
            <TimezoneSelector value={timezone} onChange={setTimezone} />
          </div>
        )}

        {state.step === 'date-select' && (
          <CalendarPicker
            monthOffset={state.monthOffset}
            availableMonthOffsets={availableMonthOffsets}
            timezone={timezone}
            availableDates={availableDates}
            selectedDate={state.selectedDate}
            onSelectDate={selectDate}
            onChangeMonth={changeMonth}
          />
        )}

        {state.step === 'time-select' && state.selectedDate && (
          <TimeSlotPicker
            slots={slotsForSelectedDate}
            timezone={timezone}
            selectedSlot={state.selectedSlot}
            onSelectSlot={selectSlot}
            onBack={goBackToDate}
            selectedDate={state.selectedDate}
          />
        )}

        {(state.step === 'form' || state.step === 'submitting') && state.selectedDate && (
          <BookingForm
            onSubmit={submitBooking}
            onBack={goBackToTime}
            isSubmitting={state.step === 'submitting'}
            error={state.error}
            onDismissError={dismissError}
            selectedDate={state.selectedDate}
            selectedTimeLabel={selectedTimeLabel}
            timezone={timezone}
          />
        )}

        {state.step === 'confirmed' && state.confirmation && (
          <Confirmation confirmation={state.confirmation} timezone={timezone} />
        )}
      </div>
    </div>
  )
}
