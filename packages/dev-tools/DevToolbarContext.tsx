'use client'

import { type ClientTelemetryEvent, ensurePlatformSuffix, posthogClient } from 'common'
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'

import type {
  DevTelemetryEvent,
  DevTelemetryToolbarContextType,
  ServerTelemetryEvent,
} from './types'
import { getCookie } from './utils'

const IS_LOCAL_DEV = process.env.NODE_ENV === 'development'
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

const DevToolbarContext = createContext<DevTelemetryToolbarContextType | null>(null)

interface DevToolbarProviderProps {
  children: ReactNode
  apiUrl: string
}

export function DevToolbarProvider({ children, apiUrl }: DevToolbarProviderProps) {
  const [isEnabled, setIsEnabled] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [events, setEvents] = useState<DevTelemetryEvent[]>([])

  const sseRetryDelayRef = useRef(SSE_INITIAL_RETRY_MS)
  const sseRetryTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const dismissToolbar = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {}
    setIsEnabled(false)
    setIsOpen(false)
  }, [])

  useEffect(() => {
    if (!IS_LOCAL_DEV) return

    let stored: string | null = null
    try {
      stored = localStorage.getItem(STORAGE_KEY)
    } catch {}
    if (stored === 'true') {
      setIsEnabled(true)
    }

    window.devTelemetry = () => {
      try {
        localStorage.setItem(STORAGE_KEY, 'true')
      } catch {}
      setIsEnabled(true)
    }

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
    if (!isEnabled || typeof EventSource === 'undefined') return

    let eventSource: EventSource | null = null
    let isMounted = true

    const connect = () => {
      if (!isMounted) return

      const sessionId = getCookie('session_id')
      const streamUrl = `${ensurePlatformSuffix(apiUrl)}/telemetry/stream${
        sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : ''
      }`

      eventSource = new EventSource(streamUrl, { withCredentials: true })

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
          console.error('[DevToolbar] Failed to parse SSE event:', e)
        }
      }

      eventSource.onerror = () => {
        if (!isMounted) return

        eventSource?.close()
        eventSource = null

        const delay = sseRetryDelayRef.current
        console.warn(`[DevToolbar] SSE connection error, reconnecting in ${delay}ms...`)

        if (sseRetryTimeoutRef.current) {
          clearTimeout(sseRetryTimeoutRef.current)
          sseRetryTimeoutRef.current = null
        }
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
  }, [apiUrl, appendEvent, isEnabled])

  if (!IS_LOCAL_DEV) {
    return <>{children}</>
  }

  return (
    <DevToolbarContext.Provider
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
    </DevToolbarContext.Provider>
  )
}

export function useDevToolbar() {
  const context = useContext(DevToolbarContext)
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
