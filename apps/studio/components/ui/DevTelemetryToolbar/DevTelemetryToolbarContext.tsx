'use client'

import { type ClientTelemetryEvent, posthogClient } from 'common'
import { API_URL } from 'lib/constants'
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'

import { getCookie } from './utils'

const IS_LOCAL_DEV = process.env.NEXT_PUBLIC_ENVIRONMENT === 'local'
const MAX_EVENTS = 200
const STORAGE_KEY = 'dev-telemetry-toolbar-enabled'

const SSE_INITIAL_RETRY_MS = 1000
const SSE_MAX_RETRY_MS = 30000
const SSE_BACKOFF_MULTIPLIER = 2

declare global {
  interface Window {
    devTelemetry?: () => void
  }
}

interface ServerTelemetryEvent {
  id: string
  timestamp: number
  sessionId: string
  eventType: 'capture' | 'identify' | 'groupIdentify' | 'alias'
  eventName: string
  distinctId: string
  properties?: Record<string, unknown>
  groups?: Record<string, string | number>
}

export interface DevTelemetryEvent {
  id: string
  timestamp: number
  source: 'client' | 'server'
  eventType: string
  eventName: string
  distinctId?: string
  properties?: Record<string, unknown>
}

interface DevTelemetryToolbarContextType {
  isEnabled: boolean
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  events: DevTelemetryEvent[]
  setEvents: React.Dispatch<React.SetStateAction<DevTelemetryEvent[]>>
  dismissToolbar: () => void
}

const DevTelemetryToolbarContext = createContext<DevTelemetryToolbarContextType | null>(null)

export function DevTelemetryToolbarProvider({ children }: { children: ReactNode }) {
  const [isEnabled, setIsEnabled] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [events, setEvents] = useState<DevTelemetryEvent[]>([])

  const sseRetryDelayRef = useRef(SSE_INITIAL_RETRY_MS)
  const sseRetryTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const dismissToolbar = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setIsEnabled(false)
    setIsOpen(false)
  }, [])

  useEffect(() => {
    if (!IS_LOCAL_DEV) return

    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'true') {
      setIsEnabled(true)
    }

    window.devTelemetry = () => {
      localStorage.setItem(STORAGE_KEY, 'true')
      setIsEnabled(true)
      console.log('Dev Telemetry Toolbar enabled! Click the activity icon in the header.')
    }

    console.log('Tip: Run `devTelemetry()` in the console to enable the Dev Telemetry Toolbar')

    return () => {
      delete window.devTelemetry
    }
  }, [])

  const appendEvent = useCallback((event: DevTelemetryEvent) => {
    setEvents((prev) => {
      const key = `${event.source}-${event.id}`
      if (prev.some((e) => `${e.source}-${e.id}` === key)) return prev
      return [...prev.slice(-(MAX_EVENTS - 1)), event]
    })
  }, [])

  useEffect(() => {
    if (!isEnabled) return

    const unsubscribe = posthogClient.subscribeToEvents((clientEvent: ClientTelemetryEvent) => {
      appendEvent({
        id: clientEvent.id,
        timestamp: clientEvent.timestamp,
        source: 'client',
        eventType: clientEvent.eventType,
        eventName: clientEvent.eventName,
        distinctId: clientEvent.distinctId,
        properties: clientEvent.properties,
      })
    })

    return unsubscribe
  }, [appendEvent, isEnabled])

  useEffect(() => {
    if (!isEnabled || !isOpen || typeof EventSource === 'undefined') return

    let eventSource: EventSource | null = null
    let isMounted = true

    const connect = () => {
      if (!isMounted) return

      const sessionId = getCookie('session_id')
      const url = `${API_URL}/telemetry/stream${
        sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : ''
      }`

      eventSource = new EventSource(url, { withCredentials: true })

      eventSource.onopen = () => {
        sseRetryDelayRef.current = SSE_INITIAL_RETRY_MS
      }

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as ServerTelemetryEvent
          appendEvent({
            id: data.id,
            timestamp: data.timestamp,
            source: 'server',
            eventType: data.eventType,
            eventName: data.eventName,
            distinctId: data.distinctId,
            properties: data.properties,
          })
        } catch (e) {
          console.error('[DevTelemetryToolbar] Failed to parse SSE event:', e)
        }
      }

      eventSource.onerror = () => {
        if (!isMounted) return

        eventSource?.close()
        eventSource = null

        const delay = sseRetryDelayRef.current
        console.warn(`[DevTelemetryToolbar] SSE connection error, reconnecting in ${delay}ms...`)

        sseRetryTimeoutRef.current = setTimeout(() => {
          if (isMounted) {
            connect()
          }
        }, delay)

        sseRetryDelayRef.current = Math.min(delay * SSE_BACKOFF_MULTIPLIER, SSE_MAX_RETRY_MS)
      }
    }

    connect()

    return () => {
      isMounted = false
      eventSource?.close()
      if (sseRetryTimeoutRef.current) {
        clearTimeout(sseRetryTimeoutRef.current)
        sseRetryTimeoutRef.current = null
      }
    }
  }, [appendEvent, isEnabled, isOpen])

  if (!IS_LOCAL_DEV) {
    return <>{children}</>
  }

  return (
    <DevTelemetryToolbarContext.Provider
      value={{
        isEnabled,
        isOpen,
        setIsOpen,
        events,
        setEvents,
        dismissToolbar,
      }}
    >
      {children}
    </DevTelemetryToolbarContext.Provider>
  )
}

export function useDevTelemetryToolbar() {
  const context = useContext(DevTelemetryToolbarContext)
  if (!context) {
    return {
      isEnabled: false,
      isOpen: false,
      setIsOpen: () => {},
      events: [],
      setEvents: () => {},
      dismissToolbar: () => {},
    }
  }
  return context
}
