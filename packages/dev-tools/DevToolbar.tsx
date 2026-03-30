'use client'

import { useFeatureFlags } from 'common'
import { Activity, ChevronDown, ChevronUp, Flag } from 'lucide-react'
import {
  type ChangeEvent,
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useState,
} from 'react'
import {
  Badge,
  Button,
  Input_Shadcn_ as Input,
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

import { useDevToolbar } from './DevToolbarContext'
import type { DevTelemetryEvent } from './types'
import {
  CC_ORIGINALS_KEY,
  PH_ORIGINALS_KEY,
  deleteCookie,
  getCookie,
  parseOverrideValue,
  readOriginals,
  safeJsonParse,
  setCookie,
  valuesAreEqual,
  writeOriginals,
} from './utils'

const IS_LOCAL_DEV = process.env.NODE_ENV === 'development'

function EventCard({ event }: { event: DevTelemetryEvent }) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleToggle = () => setIsExpanded((prev) => !prev)

  return (
    <div className="border rounded-md p-3 bg-surface-100">
      <button
        type="button"
        aria-expanded={isExpanded}
        aria-label={`${event.eventName} event details`}
        className="flex items-start justify-between cursor-pointer gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm w-full text-left"
        onClick={handleToggle}
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
      </button>

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
  const isNull = originalValue === null
  const inputProps = {
    value: String(currentValue),
    onChange: (event: ChangeEvent<HTMLInputElement>) => onToggle(event.target.value),
    className: 'w-32',
  }

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
          {isNull && (
            <Badge variant="secondary" className="shrink-0">
              null
            </Badge>
          )}
        </div>

        {isNull ? (
          <Input value="null" disabled className="w-32 opacity-50" />
        ) : valueType === 'boolean' ? (
          <Switch
            checked={currentValue as boolean}
            onCheckedChange={(checked) => onToggle(checked)}
          />
        ) : valueType === 'number' ? (
          <Input type="number" {...inputProps} />
        ) : (
          <Input {...inputProps} />
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

export function DevToolbar() {
  const { isEnabled, isOpen, setIsOpen, events, setEvents } = useDevToolbar()
  const [activeTab, setActiveTab] = useState<string>('events')
  const [flagsSubTab, setFlagsSubTab] = useState<'posthog' | 'configcat'>('posthog')
  const [eventFilter, setEventFilter] = useState<string>('')
  const { posthog: posthogFlags, configcat: configcatFlags } = useFeatureFlags()
  const [phFlagOverrides, setPhFlagOverrides] = useState<Record<string, unknown>>({})
  const [ccFlagOverrides, setCcFlagOverrides] = useState<Record<string, unknown>>({})
  const [phFlagOriginals, setPhFlagOriginals] = useState<Record<string, unknown>>({})
  const [ccFlagOriginals, setCcFlagOriginals] = useState<Record<string, unknown>>({})

  const loadOverrides = useCallback(
    (cookieName: string, label: string, setter: (value: Record<string, unknown>) => void) => {
      const parsed = safeJsonParse<Record<string, unknown>>(getCookie(cookieName), {}, label)
      if (Object.keys(parsed).length > 0) {
        setter(parsed)
      }
    },
    []
  )

  const saveOverrides = useCallback(
    (
      cookieName: string,
      overrides: Record<string, unknown>,
      setter: (value: Record<string, unknown>) => void
    ) => {
      setter(overrides)
      if (Object.keys(overrides).length > 0) {
        setCookie(cookieName, JSON.stringify(overrides), '/')
      } else {
        deleteCookie(cookieName)
      }
    },
    []
  )

  const updateOriginals = useCallback(
    (
      storageKey: typeof PH_ORIGINALS_KEY | typeof CC_ORIGINALS_KEY,
      setter: Dispatch<SetStateAction<Record<string, unknown>>>
    ) =>
      (updater: (prev: Record<string, unknown>) => Record<string, unknown>) => {
        setter((prev) => {
          const next = updater(prev)
          writeOriginals(storageKey, next)
          return next
        })
      },
    []
  )

  useEffect(() => {
    loadOverrides('x-ph-flag-overrides', 'PostHog flag overrides', setPhFlagOverrides)
    loadOverrides('x-cc-flag-overrides', 'ConfigCat flag overrides', setCcFlagOverrides)
  }, [loadOverrides])

  useEffect(() => {
    setPhFlagOriginals(readOriginals(PH_ORIGINALS_KEY))
    setCcFlagOriginals(readOriginals(CC_ORIGINALS_KEY))
  }, [])

  const updatePhOriginals = updateOriginals(PH_ORIGINALS_KEY, setPhFlagOriginals)
  const updateCcOriginals = updateOriginals(CC_ORIGINALS_KEY, setCcFlagOriginals)

  const togglePhFlagOverride = (flagName: string, value: unknown) => {
    const originalValue = phFlagOriginals[flagName] ?? posthogFlags[flagName]
    const parsedValue = parseOverrideValue(value, originalValue)
    if (valuesAreEqual(parsedValue, originalValue)) {
      const newOverrides = { ...phFlagOverrides }
      delete newOverrides[flagName]
      saveOverrides('x-ph-flag-overrides', newOverrides, setPhFlagOverrides)
      return
    }

    updatePhOriginals((prev) =>
      flagName in prev ? prev : { ...prev, [flagName]: posthogFlags[flagName] }
    )
    const newOverrides = { ...phFlagOverrides, [flagName]: parsedValue }
    saveOverrides('x-ph-flag-overrides', newOverrides, setPhFlagOverrides)
  }

  const toggleCcFlagOverride = (flagName: string, value: unknown) => {
    const originalValue = ccFlagOriginals[flagName] ?? configcatFlags[flagName]
    const parsedValue = parseOverrideValue(value, originalValue)
    if (valuesAreEqual(parsedValue, originalValue)) {
      const newOverrides = { ...ccFlagOverrides }
      delete newOverrides[flagName]
      saveOverrides('x-cc-flag-overrides', newOverrides, setCcFlagOverrides)
      return
    }

    updateCcOriginals((prev) =>
      flagName in prev ? prev : { ...prev, [flagName]: configcatFlags[flagName] }
    )
    const newOverrides = { ...ccFlagOverrides, [flagName]: parsedValue }
    saveOverrides('x-cc-flag-overrides', newOverrides, setCcFlagOverrides)
  }

  const clearAllOverrides = () => {
    setPhFlagOverrides({})
    setCcFlagOverrides({})
    setPhFlagOriginals({})
    setCcFlagOriginals({})
    deleteCookie('x-ph-flag-overrides')
    deleteCookie('x-cc-flag-overrides')
    writeOriginals(PH_ORIGINALS_KEY, {})
    writeOriginals(CC_ORIGINALS_KEY, {})
    window.location.reload()
  }

  const normalizedFilter = eventFilter.trim().toLowerCase()
  const filteredEvents = (
    normalizedFilter
      ? events.filter(
          (e) =>
            e.eventName.toLowerCase().includes(normalizedFilter) ||
            e.eventType.toLowerCase().includes(normalizedFilter)
        )
      : events
  )
    .slice()
    .sort((a, b) => b.timestamp - a.timestamp)

  const phOverrideCount = Object.keys(phFlagOverrides).length
  const ccOverrideCount = Object.keys(ccFlagOverrides).length
  const totalOverrideCount = phOverrideCount + ccOverrideCount

  if (!IS_LOCAL_DEV || !isEnabled) return null

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent
        side="bottom"
        size="lg"
        className="flex flex-col p-0 gap-0 overflow-hidden"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <SheetHeader className="px-6 py-4 border-b shrink-0 space-y-0">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-brand-500" />
            <SheetTitle className="text-lg font-semibold">Dev Telemetry</SheetTitle>
            <Badge variant="secondary">Local Only</Badge>
          </div>
          <SheetDescription className="sr-only">
            View telemetry events and feature flags for local development
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden px-6 pt-4">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col min-h-0 overflow-hidden"
          >
            <TabsList className="shrink-0 mb-4">
              <TabsTrigger value="events" className="flex items-center gap-2 px-4">
                <Activity className="w-4 h-4" />
                Events ({filteredEvents.length})
              </TabsTrigger>
              <TabsTrigger value="flags" className="flex items-center gap-2 px-4">
                <Flag className="w-4 h-4" />
                Flags {totalOverrideCount > 0 && `(${totalOverrideCount} overrides)`}
              </TabsTrigger>
            </TabsList>
            {activeTab === 'events' && (
              <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
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

                <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pb-6">
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
              </div>
            )}

            {activeTab === 'flags' && (
              <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                {totalOverrideCount > 0 && (
                  <div className="flex items-center justify-between p-3 bg-warning/10 rounded-md mb-4 shrink-0">
                    <span className="text-sm text-warning">
                      {totalOverrideCount} flag(s) overridden
                      {phOverrideCount > 0 && ccOverrideCount > 0
                        ? ` (${phOverrideCount} PostHog, ${ccOverrideCount} ConfigCat)`
                        : ''}
                    </span>
                    <Button type="outline" onClick={clearAllOverrides}>
                      Clear & Reload
                    </Button>
                  </div>
                )}

                <Tabs
                  value={flagsSubTab}
                  onValueChange={(v) => setFlagsSubTab(v as 'posthog' | 'configcat')}
                  className="flex-1 flex flex-col min-h-0 overflow-hidden"
                >
                  <TabsList className="shrink-0 mb-4">
                    <TabsTrigger value="posthog" className="px-4">
                      PostHog {phOverrideCount > 0 && `(${phOverrideCount})`}
                    </TabsTrigger>
                    <TabsTrigger value="configcat" className="px-4">
                      ConfigCat {ccOverrideCount > 0 && `(${ccOverrideCount})`}
                    </TabsTrigger>
                  </TabsList>

                  {flagsSubTab === 'posthog' && (
                    <div className="flex-1 min-h-0 overflow-y-auto pb-6">
                      <div className="space-y-4">
                        {Object.keys(posthogFlags).length === 0 ? (
                          <div className="text-center text-foreground-muted py-8">
                            No PostHog feature flags loaded yet.
                          </div>
                        ) : (
                          Object.entries(posthogFlags).map(([flagName, flagValue]) => (
                            <FlagCard
                              key={flagName}
                              flagName={flagName}
                              currentValue={
                                phFlagOverrides[flagName] ?? phFlagOriginals[flagName] ?? flagValue
                              }
                              originalValue={phFlagOriginals[flagName] ?? flagValue}
                              isOverridden={flagName in phFlagOverrides}
                              onToggle={(value) => togglePhFlagOverride(flagName, value)}
                            />
                          ))
                        )}
                      </div>
                    </div>
                  )}
                  {flagsSubTab === 'configcat' && (
                    <div className="flex-1 min-h-0 overflow-y-auto pb-6">
                      <div className="space-y-4">
                        {Object.keys(configcatFlags).length === 0 ? (
                          <div className="text-center text-foreground-muted py-8">
                            No ConfigCat feature flags loaded yet.
                          </div>
                        ) : (
                          Object.entries(configcatFlags).map(([flagName, flagValue]) => (
                            <FlagCard
                              key={flagName}
                              flagName={flagName}
                              currentValue={
                                ccFlagOverrides[flagName] ?? ccFlagOriginals[flagName] ?? flagValue
                              }
                              originalValue={ccFlagOriginals[flagName] ?? flagValue}
                              isOverridden={flagName in ccFlagOverrides}
                              onToggle={(value) => toggleCcFlagOverride(flagName, value)}
                            />
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </Tabs>
              </div>
            )}
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  )
}
