'use client'

import { type ClientTelemetryEvent, posthogClient, useFeatureFlags } from 'common'
import { API_URL } from 'lib/constants'
import { Activity, ChevronDown, ChevronUp, Flag, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import {
  Badge,
  Button,
  Input,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Switch,
  Tabs_Shadcn_ as Tabs,
  TabsContent_Shadcn_ as TabsContent,
  TabsList_Shadcn_ as TabsList,
  TabsTrigger_Shadcn_ as TabsTrigger,
  cn,
} from 'ui'

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

interface DevTelemetryEvent {
  id: string
  timestamp: number
  source: 'client' | 'server'
  eventType: string
  eventName: string
  distinctId?: string
  properties?: Record<string, unknown>
}

const IS_LOCAL_DEV = process.env.NEXT_PUBLIC_ENVIRONMENT === 'local'
const MAX_EVENTS = 200

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : undefined
}

function setCookie(name: string, value: string, path: string = '/') {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=${encodeURIComponent(value)}; path=${path}`
}

function deleteCookie(name: string) {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
}

function EventCard({ event }: { event: DevTelemetryEvent }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="border rounded-md p-3 bg-surface-100">
      <div
        className="flex items-start justify-between cursor-pointer gap-4"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <div className="flex items-start gap-2 flex-wrap">
            <Badge variant={event.source === 'client' ? 'default' : 'success'} className="shrink-0">
              {event.source}
            </Badge>
            <Badge variant="secondary" className="shrink-0">
              {event.eventType}
            </Badge>
            <span className="font-mono text-sm break-all">{event.eventName}</span>
          </div>
          {event.distinctId && (
            <div
              className="text-xs text-foreground-muted font-mono truncate"
              title={event.distinctId}
            >
              ID: {event.distinctId}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 text-foreground-muted shrink-0">
          <span className="text-xs whitespace-nowrap">
            {new Date(event.timestamp).toLocaleTimeString()}
          </span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {isExpanded && (
        <pre className="mt-3 p-2 bg-surface-200 rounded text-xs overflow-x-auto max-h-[300px] overflow-y-auto">
          {JSON.stringify(event.properties, null, 2)}
        </pre>
      )}
    </div>
  )
}

function FlagCard({
  flagName,
  currentValue,
  originalValue,
  isOverridden,
  onToggle,
}: {
  flagName: string
  currentValue: unknown
  originalValue: unknown
  isOverridden: boolean
  onToggle: (value: unknown) => void
}) {
  const valueType = typeof originalValue

  return (
    <div className={cn('border rounded-md p-3', isOverridden && 'border-warning bg-warning/5')}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="font-mono text-sm truncate">{flagName}</span>
          {isOverridden && (
            <Badge variant="warning" className="shrink-0">
              Overridden
            </Badge>
          )}
        </div>

        {valueType === 'boolean' ? (
          <Switch
            checked={currentValue as boolean}
            onCheckedChange={(checked) => onToggle(checked)}
          />
        ) : (
          <Input
            value={String(currentValue)}
            onChange={(e) => onToggle(e.target.value)}
            className="w-32"
          />
        )}
      </div>

      {isOverridden && (
        <div className="mt-2 text-xs text-foreground-muted">
          Original:{' '}
          <code className="bg-surface-200 px-1 rounded">{JSON.stringify(originalValue)}</code>
        </div>
      )}
    </div>
  )
}

const STORAGE_KEY = 'dev-telemetry-toolbar-enabled'

export function DevTelemetryToolbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isEnabled, setIsEnabled] = useState(false)
  const [events, setEvents] = useState<DevTelemetryEvent[]>([])
  const [activeTab, setActiveTab] = useState<string>('events')
  const [eventFilter, setEventFilter] = useState<string>('')
  const { posthog: currentFlags } = useFeatureFlags()
  const [flagOverrides, setFlagOverrides] = useState<Record<string, unknown>>({})

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
      if (IS_LOCAL_DEV) {
        console.log('Dev Telemetry Toolbar enabled! Click the activity icon in the bottom-right.')
      }
    }

    if (IS_LOCAL_DEV) {
      console.log('Tip: Run devTelemetry() in the console to enable the Dev Telemetry Toolbar')
    }

    return () => {
      delete window.devTelemetry
    }
  }, [])

  useEffect(() => {
    if (!isEnabled) return

    const unsubscribe = posthogClient.subscribeToEvents((clientEvent: ClientTelemetryEvent) => {
      const event: DevTelemetryEvent = {
        id: clientEvent.id,
        timestamp: clientEvent.timestamp,
        source: 'client',
        eventType: clientEvent.eventType,
        eventName: clientEvent.eventName,
        distinctId: clientEvent.distinctId,
        properties: clientEvent.properties,
      }
      setEvents((prev) => {
        const key = `${event.source}-${event.id}`
        if (prev.some((e) => `${e.source}-${e.id}` === key)) return prev
        return [...prev.slice(-(MAX_EVENTS - 1)), event]
      })
    })

    return unsubscribe
  }, [isEnabled])

  useEffect(() => {
    if (!isEnabled || !isOpen) return

    const sessionId = getCookie('session_id')
    const url = `${API_URL}/telemetry/stream${
      sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : ''
    }`

    const eventSource = new EventSource(url, { withCredentials: true })

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as ServerTelemetryEvent
        const transformedEvent: DevTelemetryEvent = {
          id: data.id,
          timestamp: data.timestamp,
          source: 'server',
          eventType: data.eventType,
          eventName: data.eventName,
          distinctId: data.distinctId,
          properties: data.properties,
        }
        setEvents((prev) => {
          const key = `${transformedEvent.source}-${transformedEvent.id}`
          if (prev.some((e) => `${e.source}-${e.id}` === key)) return prev
          return [...prev.slice(-(MAX_EVENTS - 1)), transformedEvent]
        })
      } catch (e) {
        console.error('Failed to parse SSE event:', e)
      }
    }

    eventSource.onerror = () => {
      console.warn('SSE connection error, reconnecting...')
    }

    return () => {
      eventSource.close()
    }
  }, [isEnabled, isOpen])

  useEffect(() => {
    const saved = getCookie('x-ph-flag-overrides')
    if (saved) {
      try {
        setFlagOverrides(JSON.parse(saved))
      } catch {}
    }
  }, [])

  const saveFlagOverrides = useCallback((overrides: Record<string, unknown>) => {
    setFlagOverrides(overrides)
    if (Object.keys(overrides).length > 0) {
      setCookie('x-ph-flag-overrides', JSON.stringify(overrides), '/')
    } else {
      deleteCookie('x-ph-flag-overrides')
    }
  }, [])

  const toggleFlagOverride = (flagName: string, value: unknown) => {
    const newOverrides = { ...flagOverrides }
    if (flagName in newOverrides && newOverrides[flagName] === value) {
      delete newOverrides[flagName]
    } else {
      newOverrides[flagName] = value
    }
    saveFlagOverrides(newOverrides)
  }

  const clearOverrides = () => {
    saveFlagOverrides({})
    window.location.reload()
  }

  const filteredEvents = (
    eventFilter
      ? events.filter(
          (e) =>
            e.eventName.toLowerCase().includes(eventFilter.toLowerCase()) ||
            e.eventType.toLowerCase().includes(eventFilter.toLowerCase())
        )
      : events
  )
    .slice()
    .sort((a, b) => b.timestamp - a.timestamp)

  const overrideCount = Object.keys(flagOverrides).length

  if (!IS_LOCAL_DEV || !isEnabled) return null

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-1">
        <button
          onClick={dismissToolbar}
          className={cn(
            'p-1.5 rounded-full shadow-lg',
            'bg-surface-300 hover:bg-destructive text-foreground-muted hover:text-white',
            'transition-all duration-200 opacity-60 hover:opacity-100'
          )}
          title="Dismiss toolbar (run devTelemetry() to re-enable)"
        >
          <X className="w-3 h-3" />
        </button>
        <button
          onClick={() => setIsOpen(true)}
          className={cn(
            'relative p-3 rounded-full shadow-lg',
            'bg-brand-500 hover:bg-brand-600 text-white',
            'transition-all duration-200 hover:scale-105'
          )}
          title="Dev Telemetry Toolbar"
        >
          <Activity className="w-5 h-5" />
          {events.length > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs">
              {events.length > 99 ? '99+' : events.length}
            </span>
          )}
        </button>
      </div>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="bottom" className="h-[70vh] overflow-hidden flex flex-col p-0">
          <SheetHeader className="flex flex-row items-center justify-between px-6 py-4 border-b shrink-0 space-y-0">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-brand-500" />
              <SheetTitle className="text-lg font-semibold">Dev Telemetry</SheetTitle>
              <Badge variant="secondary">Local Only</Badge>
            </div>
            <SheetDescription className="sr-only">
              View telemetry events and feature flags for local development
            </SheetDescription>
          </SheetHeader>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col overflow-hidden px-6 pt-4"
          >
            <TabsList className="shrink-0 mb-4">
              <TabsTrigger value="events" className="flex items-center gap-2 px-4">
                <Activity className="w-4 h-4" />
                Events ({filteredEvents.length})
              </TabsTrigger>
              <TabsTrigger value="flags" className="flex items-center gap-2 px-4">
                <Flag className="w-4 h-4" />
                Flags {overrideCount > 0 && `(${overrideCount} overrides)`}
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="events"
              className="flex-1 flex flex-col overflow-hidden data-[state=inactive]:hidden"
            >
              <div className="flex items-center gap-4 pb-4 shrink-0">
                <Input
                  placeholder="Filter events..."
                  value={eventFilter}
                  onChange={(e) => setEventFilter(e.target.value)}
                  className="flex-1"
                />
                <Button type="outline" onClick={() => setEvents([])}>
                  Clear
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pb-6">
                {filteredEvents.length === 0 ? (
                  <div className="text-center text-foreground-muted py-8">
                    No events yet. Interact with the app to see telemetry events.
                  </div>
                ) : (
                  filteredEvents.map((event) => (
                    <EventCard key={`${event.source}-${event.id}`} event={event} />
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent
              value="flags"
              className="flex-1 overflow-y-auto pb-6 data-[state=inactive]:hidden"
            >
              <div className="space-y-4">
                {overrideCount > 0 && (
                  <div className="flex items-center justify-between p-3 bg-warning/10 rounded-md">
                    <span className="text-sm text-warning">{overrideCount} flag(s) overridden</span>
                    <Button type="outline" onClick={clearOverrides}>
                      Clear & Reload
                    </Button>
                  </div>
                )}

                {Object.keys(currentFlags).length === 0 ? (
                  <div className="text-center text-foreground-muted py-8">
                    No PostHog feature flags loaded yet.
                  </div>
                ) : (
                  Object.entries(currentFlags).map(([flagName, flagValue]) => (
                    <FlagCard
                      key={flagName}
                      flagName={flagName}
                      currentValue={flagOverrides[flagName] ?? flagValue}
                      originalValue={flagValue}
                      isOverridden={flagName in flagOverrides}
                      onToggle={(value) => toggleFlagOverride(flagName, value)}
                    />
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>
    </>
  )
}
