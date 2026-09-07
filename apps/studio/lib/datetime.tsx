import { LOCAL_STORAGE_KEYS } from 'common'
import dayjs, { type Dayjs } from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react'

import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { guessLocalTimezone } from '@/lib/dayjs'

// dayjs.extend is idempotent. Extending here removes the implicit dependency
// on _app.tsx running first (e.g. Storybook, isolated scripts).
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(relativeTime)

export type DateInput = string | number | Date | Dayjs

const isUnixMicro = (value: string | number): boolean => {
  const digits = String(value).length
  const isNum = !Number.isNaN(Number(value))
  return isNum && digits === 16
}

const unixMicroToIso = (value: string | number): string =>
  dayjs.unix(Number(value) / 1_000_000).toISOString()

const normalize = (input: DateInput): Dayjs => {
  if (dayjs.isDayjs(input)) return input
  if (input instanceof Date) return dayjs(input)
  if ((typeof input === 'string' || typeof input === 'number') && isUnixMicro(input)) {
    return dayjs.utc(unixMicroToIso(input))
  }
  return dayjs.utc(input)
}

const isValidTimezone = (tz: string): boolean => {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz })
    return true
  } catch {
    return false
  }
}

/**
 * Resolve a user-supplied timezone to a valid IANA name. Falls back to the
 * browser's guessed timezone, then UTC. Pass `undefined`/empty string to opt
 * into the guessed default.
 */
export const resolveTimezone = (tz: string | undefined | null): string => {
  if (tz && isValidTimezone(tz)) return tz
  return guessLocalTimezone()
}

const DEFAULT_DATETIME_FORMAT = 'DD MMM YYYY HH:mm:ss'
const DEFAULT_DATE_FORMAT = 'DD MMM YYYY'
const DEFAULT_TIME_FORMAT = 'HH:mm:ss'

interface FormatOptions {
  /** IANA timezone (e.g. 'Asia/Tokyo'). Falls back to guessed local. */
  tz?: string
  /** dayjs format string. */
  format?: string
}

export const formatDateTime = (input: DateInput, opts: FormatOptions = {}): string =>
  normalize(input)
    .tz(resolveTimezone(opts.tz))
    .format(opts.format ?? DEFAULT_DATETIME_FORMAT)

export const formatDate = (input: DateInput, opts: FormatOptions = {}): string =>
  normalize(input)
    .tz(resolveTimezone(opts.tz))
    .format(opts.format ?? DEFAULT_DATE_FORMAT)

export const formatTime = (input: DateInput, opts: FormatOptions = {}): string =>
  normalize(input)
    .tz(resolveTimezone(opts.tz))
    .format(opts.format ?? DEFAULT_TIME_FORMAT)

/** Returns a humanised relative time, e.g. "3 minutes ago". */
export const formatFromNow = (input: DateInput): string => normalize(input).fromNow()

/** Returns the input as a Dayjs instance pinned to the given timezone. */
export const toTimezone = (input: DateInput, tz?: string): Dayjs =>
  normalize(input).tz(resolveTimezone(tz))

interface TimezoneContextValue {
  /** The resolved IANA timezone currently in use. Always valid. */
  timezone: string
  /** The user's stored preference. Empty string means "use guessed local". */
  storedTimezone: string
  /** Update the stored preference. Pass an empty string to clear (use guessed). */
  setTimezone: (tz: string) => void
  /** Whether the current selection is the auto-detected default. */
  isAutoDetected: boolean
}

const TimezoneContext = createContext<TimezoneContextValue | undefined>(undefined)

export const TimezoneProvider = ({ children }: { children: ReactNode }) => {
  const [storedTimezone, setStoredTimezone] = useLocalStorageQuery<string>(
    LOCAL_STORAGE_KEYS.UI_TIMEZONE,
    ''
  )

  const timezone = useMemo(() => resolveTimezone(storedTimezone), [storedTimezone])

  // Apply the selected timezone as the dayjs default so anything calling
  // `dayjs.tz()` or `.tz()` without an argument picks it up. Bare `dayjs()`
  // calls are unaffected by design — those continue to render in the host
  // browser's timezone until they're intentionally migrated to the wrappers
  // below.
  useEffect(() => {
    dayjs.tz.setDefault(timezone)
  }, [timezone])

  const setTimezone = useCallback(
    (tz: string) => {
      setStoredTimezone(tz)
    },
    [setStoredTimezone]
  )

  const value = useMemo<TimezoneContextValue>(
    () => ({
      timezone,
      storedTimezone,
      setTimezone,
      isAutoDetected: !storedTimezone,
    }),
    [timezone, storedTimezone, setTimezone]
  )

  return <TimezoneContext.Provider value={value}>{children}</TimezoneContext.Provider>
}

// Stable fallback so callers outside the provider (e.g. unit tests, isolated
// stories) don't get a fresh object identity every render.
const NO_OP_SET_TIMEZONE = () => {}

export const useTimezone = (): TimezoneContextValue => {
  const ctx = useContext(TimezoneContext)
  return useMemo<TimezoneContextValue>(
    () =>
      ctx ?? {
        timezone: guessLocalTimezone(),
        storedTimezone: '',
        setTimezone: NO_OP_SET_TIMEZONE,
        isAutoDetected: true,
      },
    [ctx]
  )
}

/** Returns a memoised `(input, format?) => string` bound to the active timezone. */
export const useFormatDateTime = () => {
  const { timezone } = useTimezone()
  return useCallback(
    (input: DateInput, format?: string) => formatDateTime(input, { tz: timezone, format }),
    [timezone]
  )
}

export const useFormatDate = () => {
  const { timezone } = useTimezone()
  return useCallback(
    (input: DateInput, format?: string) => formatDate(input, { tz: timezone, format }),
    [timezone]
  )
}

export const useFormatTime = () => {
  const { timezone } = useTimezone()
  return useCallback(
    (input: DateInput, format?: string) => formatTime(input, { tz: timezone, format }),
    [timezone]
  )
}

export const useToTimezone = () => {
  const { timezone } = useTimezone()
  return useCallback((input: DateInput) => toTimezone(input, timezone), [timezone])
}
