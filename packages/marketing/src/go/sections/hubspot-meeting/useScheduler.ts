import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { bookMeeting, fetchBookingInfo } from './api'
import type {
  BookingConfirmation,
  BookingInfo,
  BookingRequest,
  SchedulerStep,
  TimeSlot,
} from './types'

/** How many months to prefetch (current + 3 ahead) */
const MONTHS_TO_FETCH = 4

function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return 'America/New_York'
  }
}

function getUserLocale(): string {
  try {
    return navigator.language || 'en-US'
  } catch {
    return 'en-US'
  }
}

export interface SchedulerState {
  step: SchedulerStep
  timezone: string
  selectedDate: string | null // YYYY-MM-DD
  selectedSlot: TimeSlot | null
  selectedDuration: number // milliseconds
  confirmation: BookingConfirmation | null
  error: string | null
  /** Current month offset from today (0 = current month) */
  monthOffset: number
}

export function useScheduler(slug: string, enabled = true) {
  const [timezone, setTimezoneState] = useState('America/New_York')
  const [locale, setLocale] = useState('en-US')

  // Hydrate timezone/locale from browser after mount to avoid SSR mismatches
  useEffect(() => {
    setTimezoneState(getUserTimezone())
    setLocale(getUserLocale())
  }, [])

  /** Cached booking info keyed by month offset */
  const [monthCache, setMonthCache] = useState<Record<number, BookingInfo>>({})

  const [state, setState] = useState<SchedulerState>({
    step: 'loading',
    timezone,
    selectedDate: null,
    selectedSlot: null,
    selectedDuration: 0,
    confirmation: null,
    error: null,
    monthOffset: 0,
  })

  const loadAllMonths = useCallback(
    async (tz?: string) => {
      const effectiveTz = tz ?? timezone
      try {
        setState((s) => ({ ...s, step: 'loading', error: null }))

        const results = await Promise.all(
          Array.from({ length: MONTHS_TO_FETCH }, (_, i) => fetchBookingInfo(slug, effectiveTz, i))
        )

        const cache: Record<number, BookingInfo> = {}
        for (let i = 0; i < results.length; i++) {
          cache[i] = results[i]
        }

        const defaultDuration = results[0]?.customParams?.availableDurations?.[0] ?? 1800000

        setMonthCache(cache)
        setState((s) => ({
          ...s,
          step: 'date-select',
          selectedDuration: defaultDuration,
          selectedDate: null,
          selectedSlot: null,
          monthOffset: 0,
        }))
      } catch (err) {
        setState((s) => ({
          ...s,
          step: 'error',
          error: err instanceof Error ? err.message : 'Failed to load booking info',
        }))
      }
    },
    [slug, timezone]
  )

  useEffect(() => {
    if (enabled) loadAllMonths()
  }, [enabled, loadAllMonths])

  const setTimezone = useCallback(
    (tz: string) => {
      setTimezoneState(tz)
      setState((s) => ({ ...s, timezone: tz }))
      loadAllMonths(tz)
    },
    [loadAllMonths]
  )

  const selectDate = useCallback((date: string) => {
    setState((s) => ({ ...s, selectedDate: date, selectedSlot: null, step: 'time-select' }))
  }, [])

  const selectSlot = useCallback((slot: TimeSlot) => {
    setState((s) => ({ ...s, selectedSlot: slot, step: 'form' }))
  }, [])

  const goBackToDate = useCallback(() => {
    setState((s) => ({ ...s, selectedSlot: null, step: 'date-select', selectedDate: null }))
  }, [])

  const goBackToTime = useCallback(() => {
    setState((s) => ({ ...s, selectedSlot: null, step: 'time-select' }))
  }, [])

  const retry = useCallback(() => {
    loadAllMonths()
  }, [loadAllMonths])

  const dismissError = useCallback(() => {
    setState((s) => ({ ...s, error: null }))
  }, [])

  const setDuration = useCallback((duration: number) => {
    setState((s) => ({ ...s, selectedDuration: duration }))
  }, [])

  const submitBooking = useCallback(
    async (form: {
      firstName: string
      lastName: string
      email: string
      guestEmails?: string[]
    }) => {
      if (!state.selectedSlot) return

      setState((s) => ({ ...s, step: 'submitting' }))

      const request: BookingRequest = {
        slug,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        startTime: state.selectedSlot.startMillisUtc,
        duration: state.selectedDuration,
        timezone,
        locale,
        guestEmails: form.guestEmails,
      }

      try {
        const confirmation = await bookMeeting(request)
        setState((s) => ({ ...s, step: 'confirmed', confirmation }))
      } catch (err) {
        setState((s) => ({
          ...s,
          step: 'form',
          error: err instanceof Error ? err.message : 'Booking failed',
        }))
      }
    },
    [slug, timezone, locale, state.selectedSlot, state.selectedDuration]
  )

  /** All slots merged across all cached months */
  const allSlots = useMemo(() => {
    const durationKey = String(state.selectedDuration)
    const slots: TimeSlot[] = []
    for (const info of Object.values(monthCache)) {
      const monthSlots = info.linkAvailability?.[durationKey] ?? []
      slots.push(...monthSlots)
    }
    return slots
  }, [monthCache, state.selectedDuration])

  /** Get available time slots for the selected date and duration */
  const slotsForSelectedDate = useMemo(() => {
    if (!state.selectedDate) return []

    return allSlots.filter((slot) => {
      const date = new Date(slot.startMillisUtc)
      const dateStr = date.toLocaleDateString('en-CA', { timeZone: timezone })
      return dateStr === state.selectedDate
    })
  }, [allSlots, state.selectedDate, timezone])

  /** Get set of dates (YYYY-MM-DD) that have availability */
  const availableDates = useMemo(() => {
    const dates = new Set<string>()
    for (const slot of allSlots) {
      const date = new Date(slot.startMillisUtc)
      const dateStr = date.toLocaleDateString('en-CA', { timeZone: timezone })
      dates.add(dateStr)
    }
    return dates
  }, [allSlots, timezone])

  /** Month offsets that have at least one available slot */
  const availableMonthOffsets = useMemo(() => {
    // Compute "now" in the selected timezone to avoid ±1 month drift near boundaries
    const nowStr = new Date().toLocaleDateString('en-CA', { timeZone: timezone })
    const [nowY, nowM] = nowStr.split('-').map(Number)
    const offsets = new Set<number>()
    for (const slot of allSlots) {
      const date = new Date(slot.startMillisUtc)
      const localDateStr = date.toLocaleDateString('en-CA', { timeZone: timezone })
      const [y, m] = localDateStr.split('-').map(Number)
      const offset = (y - nowY) * 12 + (m - nowM)
      if (offset >= 0 && offset < MONTHS_TO_FETCH) {
        offsets.add(offset)
      }
    }
    return Array.from(offsets).sort((a, b) => a - b)
  }, [allSlots, timezone])

  /** Auto-navigate to first month with availability */
  const hasSetInitialMonth = useRef(false)
  useEffect(() => {
    if (hasSetInitialMonth.current) return
    if (availableMonthOffsets.length > 0 && state.step === 'date-select') {
      hasSetInitialMonth.current = true
      setState((s) => ({ ...s, monthOffset: availableMonthOffsets[0] }))
    }
  }, [availableMonthOffsets, state.step])

  const changeMonth = useCallback(
    (offset: number) => {
      if (availableMonthOffsets.length === 0) return
      const current = state.monthOffset
      if (offset > current) {
        const next = availableMonthOffsets.find((o) => o > current)
        if (next !== undefined) setState((s) => ({ ...s, monthOffset: next }))
      } else if (offset < current) {
        const prev = [...availableMonthOffsets].reverse().find((o) => o < current)
        if (prev !== undefined) setState((s) => ({ ...s, monthOffset: prev }))
      }
    },
    [availableMonthOffsets, state.monthOffset]
  )

  return {
    state,
    timezone,
    locale,
    availableDates,
    slotsForSelectedDate,
    availableMonthOffsets,
    selectDate,
    selectSlot,
    goBackToDate,
    goBackToTime,
    changeMonth,
    setTimezone,
    setDuration,
    submitBooking,
    retry,
    dismissError,
  }
}
