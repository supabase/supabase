/**
 * DEPR-705 "Debug mode" prototype state (front-end only, throwaway), reused
 * by the DEBUG-242 trace prototype for its min/max log visibility toggle.
 * Always on for this branch — no feature flag or query param gating.
 */
import { LOCAL_STORAGE_KEYS } from 'common'
import { useCallback, useEffect, useState } from 'react'

import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'

export type DebugLevel = 'off' | 'min' | 'max'
export type DebugSurface = 'studio' | 'cli' | 'api' | 'mcp'

export interface DebugLevelHistoryEntry {
  level: DebugLevel
  at: string // ISO timestamp
}

export interface DebugModeState {
  level: DebugLevel
  setBy: string
  setAt: string // ISO timestamp
  sourceSurface: DebugSurface
  maxExpiresAt: string | null // ISO timestamp; null = no expiry ("until turned off")
  // Every level change, oldest first — used to shade past `max` windows on the
  // logs timeline. Capped so it doesn't grow forever in localStorage.
  history: DebugLevelHistoryEntry[]
}

const HISTORY_LIMIT = 50

export const DEFAULT_DEBUG_MODE_STATE: DebugModeState = {
  level: 'min',
  setBy: 'Studio (default)',
  setAt: new Date(0).toISOString(),
  sourceSurface: 'studio',
  maxExpiresAt: null,
  history: [{ level: 'min', at: new Date(0).toISOString() }],
}

export const MAX_DURATION_OPTIONS: { id: string; label: string; ms: number | null }[] = [
  { id: 'indefinite', label: 'Until turned off', ms: null },
  { id: '30s', label: '30 seconds', ms: 30 * 1000 },
  { id: '30m', label: '30 minutes', ms: 30 * 60 * 1000 },
  { id: '1h', label: '1 hour', ms: 60 * 60 * 1000 },
  { id: '4h', label: '4 hours', ms: 4 * 60 * 60 * 1000 },
]

export const useDebugMode = (projectRef: string | undefined) => {
  const [state, setState, { isLoading }] = useLocalStorageQuery<DebugModeState>(
    LOCAL_STORAGE_KEYS.DEBUG_MODE_STATE(projectRef ?? '_'),
    DEFAULT_DEBUG_MODE_STATE
  )

  const setLevel = useCallback(
    (
      level: DebugLevel,
      opts: { durationMs?: number | null; surface?: DebugSurface; actor?: string } = {}
    ) => {
      const { durationMs = null, surface = 'studio', actor = 'You' } = opts
      setState((current) => {
        const at = new Date().toISOString()
        return {
          level,
          setBy: actor,
          setAt: at,
          sourceSurface: surface,
          maxExpiresAt:
            level === 'max' && durationMs ? new Date(Date.now() + durationMs).toISOString() : null,
          history: [...current.history, { level, at }].slice(-HISTORY_LIMIT),
        }
      })
    },
    [setState]
  )

  const reset = useCallback(() => setState(DEFAULT_DEBUG_MODE_STATE), [setState])

  return { state, setLevel, reset, isLoading }
}

const formatRemaining = (ms: number) => {
  if (ms <= 0) return '0s'
  const totalSeconds = Math.ceil(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours >= 1) return `${hours}h ${minutes}m`
  if (minutes >= 1) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}

const useRemainingMs = (expiresAtIso: string | null): number | null => {
  const expiresAt = expiresAtIso ? new Date(expiresAtIso).getTime() : null
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!expiresAt) return
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [expiresAt])

  return expiresAt ? expiresAt - now : null
}

/** Live "Xm Ys" countdown text for a timed `max` window, ticking every second. */
export const useCountdownText = (expiresAtIso: string | null): string | null => {
  const remainingMs = useRemainingMs(expiresAtIso)
  return remainingMs === null ? null : formatRemaining(remainingMs)
}
