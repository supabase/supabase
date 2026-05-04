'use client'

import { useFeatureFlags } from 'common'
import { Copy, EyeOff, Search, X } from 'lucide-react'
import Image from 'next/image'
import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
  type Dispatch,
  type SetStateAction,
} from 'react'
import {
  Badge,
  Button,
  cn,
  Input,
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Switch,
  Tabs_Shadcn_ as Tabs,
  TabsList_Shadcn_ as TabsList,
  TabsTrigger_Shadcn_ as TabsTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'

import { useDevToolbar } from './DevToolbarContext'
import type { DevTelemetryEvent, ExtraTab } from './types'
import {
  CC_ORIGINALS_KEY,
  deleteCookie,
  getCookie,
  parseOverrideValue,
  PH_ORIGINALS_KEY,
  readOriginals,
  safeJsonParse,
  setCookie,
  valuesAreEqual,
  writeOriginals,
} from './utils'

// Duplicated for tree-shaking — bundler must see literal process.env reference.
// Keep in sync: index.ts, DevToolbarContext.tsx, DevToolbarTrigger.tsx, feature-flags.tsx
const env = process.env.NEXT_PUBLIC_ENVIRONMENT
const IS_TOOLBAR_ENABLED = env === 'local' || env === 'staging'
const IS_LOCAL_DEV = env === 'local'

function EventRow({ event }: { event: DevTelemetryEvent }) {
  const [isExpanded, setIsExpanded] = useState(false)

  const time = new Date(event.timestamp).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard
      .writeText(JSON.stringify({ name: event.eventName, properties: event.properties }, null, 2))
      .catch((error) => console.warn('Copy failed', error))
  }

  return (
    <div className="group last:border-b-0">
      <div className="relative flex items-center h-9 hover:bg-surface-100">
        <button
          type="button"
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded((prev) => !prev)}
          className="flex items-center flex-1 min-w-0 h-full px-6 gap-5 cursor-pointer"
        >
          <span className="flex items-center gap-2 shrink-0 w-16">
            <span
              className={cn(
                'w-1.5 h-1.5 rounded-[2px] shrink-0',
                event.source === 'client' ? 'bg-brand' : 'bg-foreground-lighter'
              )}
            />
            <span
              className={cn(
                'font-mono text-xs uppercase',
                event.source === 'client' ? 'text-brand' : 'text-foreground-light'
              )}
            >
              {event.source}
            </span>
          </span>

          <span className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
            <span className="font-mono text-xs text-foreground-lighter shrink-0 w-20">{time}</span>
            <span className="font-mono text-xs text-foreground-lighter shrink-0 w-28 truncate uppercase text-left">
              {event.eventType}
            </span>
            <span className="font-mono text-xs text-foreground truncate shrink-0">
              {event.eventName}
            </span>
            {event.distinctId && (
              <span className="font-mono text-xs text-foreground-muted truncate">
                {event.distinctId}
              </span>
            )}
          </span>
        </button>
        <div className="shrink-0 pr-6">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={handleCopy}
                aria-label="Copy JSON"
                className="p-1 rounded-sm hover:bg-surface-200 text-foreground-muted hover:text-foreground-light"
              >
                <Copy className="w-3 h-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left">Copy JSON</TooltipContent>
          </Tooltip>
        </div>
      </div>
      {isExpanded && (
        <pre className="px-8 py-2 bg-surface-100 border-b text-xs font-mono overflow-x-auto max-h-[200px] overflow-y-auto text-foreground-light">
          {JSON.stringify(event.properties, null, 2)}
        </pre>
      )}
    </div>
  )
}

function FlagRow({
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
    size: 'tiny' as const,
    value: String(currentValue),
    onChange: (event: ChangeEvent<HTMLInputElement>) => onToggle(event.target.value),
    className: 'w-32',
  }

  return (
    <div className={cn('px-4 py-3 flex flex-col gap-0.5', isOverridden && 'bg-warning/5')}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col items-start gap-1">
          <div className="flex gap-2 min-w-0 h-4">
            <span
              className={cn(
                'font-mono text-xs truncate',
                isOverridden ? 'text-warning' : 'text-foreground'
              )}
            >
              {flagName}
            </span>
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
          <div className="text-xs text-foreground-muted uppercase font-mono">
            Original:{' '}
            <code className="text-foreground-lighter">{JSON.stringify(originalValue)}</code>
          </div>
        </div>

        {isNull ? (
          <Input size="tiny" value="null" disabled className="w-32 opacity-50" />
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
    </div>
  )
}

export function DevToolbar({ extraTabs = [] }: { extraTabs?: ExtraTab[] }) {
  const { isEnabled, isOpen, setIsOpen, events, setEvents, dismissToolbar } = useDevToolbar()
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

  useEffect(() => {
    const STYLE_ID = 'dev-toolbar-hide-native-devtools'
    const existing = document.getElementById(STYLE_ID)

    if (isOpen) {
      if (!existing) {
        const style = document.createElement('style')
        style.id = STYLE_ID
        style.textContent = `
          .tsqd-open-btn, .tsqd-open-btn-container { display: none !important; }
        `
        document.head.appendChild(style)
      }
    } else {
      existing?.remove()
    }
  }, [isOpen])

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

  if (!IS_TOOLBAR_ENABLED || !isEnabled) return null

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent
        side="bottom"
        size="lg"
        className="flex flex-col p-0 gap-0 overflow-hidden"
        showClose={false}
        hasOverlay={false}
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex flex-col flex-1 min-h-0 overflow-hidden"
        >
          <SheetHeader className="border-b shrink-0 space-y-0 p-0">
            <SheetTitle className="sr-only">Dev Toolbar</SheetTitle>
            <SheetDescription className="sr-only">
              View telemetry events and feature flags for local development
            </SheetDescription>
            <div className="flex items-center px-6">
              <Image
                src="/img/logo-pixel-small-light.png"
                alt="Dev Toolbar"
                width={16}
                height={16}
                style={{
                  filter:
                    'brightness(0) saturate(100%) invert(72%) sepia(57%) saturate(431%) hue-rotate(108deg) brightness(95%) contrast(91%)',
                }}
                aria-hidden="true"
                className="shrink-0 mr-4"
              />
              <TabsList className="flex gap-x-4 rounded-none border-none! h-auto">
                <TabsTrigger value="events" className="text-xs py-3 border-b font-mono uppercase">
                  Events ({filteredEvents.length})
                </TabsTrigger>
                <TabsTrigger value="flags" className="text-xs py-3 border-b font-mono uppercase">
                  Flags {totalOverrideCount > 0 && `(${totalOverrideCount})`}
                </TabsTrigger>
                {extraTabs.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="text-xs py-3 border-b font-mono uppercase"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              <div className="ml-auto flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="text"
                      icon={<EyeOff className="w-4 h-4" />}
                      onClick={dismissToolbar}
                      className="text-foreground-light hover:text-foreground p-1"
                    />
                  </TooltipTrigger>
                  <TooltipContent side="top">Hide Dev Toolbar</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SheetClose asChild>
                      <Button
                        type="text"
                        icon={<X className="w-4 h-4" />}
                        className="text-foreground-light hover:text-foreground p-1"
                      />
                    </SheetClose>
                  </TooltipTrigger>
                  <TooltipContent side="top">Close</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {activeTab === 'events' && (
              <div className="flex-1 overflow-hidden flex flex-col">
                <div className="flex items-center justify-between border-b shrink-0 px-6 py-2">
                  <Input
                    size="tiny"
                    placeholder="Filter events..."
                    value={eventFilter}
                    onChange={(e) => setEventFilter(e.target.value)}
                    icon={<Search size={14} className="text-foreground-lighter" />}
                    className="flex-1 rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0 max-w-96"
                  />
                  <Button
                    type="default"
                    onClick={() => setEvents([])}
                    className="text-foreground-lighter hover:text-foreground"
                  >
                    Clear all
                  </Button>
                </div>

                {!IS_LOCAL_DEV && (
                  <div className="px-6 py-2 text-xs text-foreground-muted border-b bg-surface-100">
                    Server-side events are only visible when using the toolbar in local development
                  </div>
                )}

                <div className="flex-1 min-h-0 overflow-y-auto pb-4">
                  {filteredEvents.length === 0 ? (
                    <div className="text-center text-foreground-lighter py-8 text-sm">
                      No events yet. Interact with the app to see telemetry events.
                    </div>
                  ) : (
                    <div className="overflow-hidden">
                      {filteredEvents.map((event) => (
                        <EventRow key={`${event.source}-${event.id}`} event={event} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'flags' && (
              <div className="flex-1 min-h-0 overflow-hidden flex">
                {/* Sidebar */}
                <div className="w-44 border-r shrink-0 flex flex-col">
                  <nav className="flex flex-col p-3 gap-0.5">
                    {(
                      [
                        { id: 'posthog', label: 'PostHog', count: phOverrideCount },
                        { id: 'configcat', label: 'ConfigCat', count: ccOverrideCount },
                      ] as const
                    ).map(({ id, label, count }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setFlagsSubTab(id)}
                        className={cn(
                          'flex items-center justify-between px-3 py-1.5 rounded-sm text-sm text-left uppercase font-mono tracking-wide',
                          flagsSubTab === id
                            ? 'bg-surface-300 text-foreground'
                            : 'text-foreground-light hover:bg-surface-200'
                        )}
                      >
                        <span className="font-mono text-xs">{label}</span>
                        {count > 0 && (
                          <span className="text-xs text-foreground-lighter">{count}</span>
                        )}
                      </button>
                    ))}
                  </nav>
                  {totalOverrideCount > 0 && (
                    <div className="mt-auto p-2 border-t">
                      <Button type="outline" size="tiny" block onClick={clearAllOverrides}>
                        Reset & Reload
                      </Button>
                    </div>
                  )}
                </div>

                {/* Flag list */}
                <div className="flex-1 min-h-0 overflow-y-auto pb-6">
                  <div className="divide-y">
                    {flagsSubTab === 'posthog' &&
                      (Object.keys(posthogFlags).length === 0 ? (
                        <div className="text-center text-foreground-lighter py-8 text-sm">
                          No PostHog feature flags loaded yet.
                        </div>
                      ) : (
                        Object.entries(posthogFlags).map(([flagName, flagValue]) => (
                          <FlagRow
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
                      ))}
                    {flagsSubTab === 'configcat' &&
                      (Object.keys(configcatFlags).length === 0 ? (
                        <div className="text-center text-foreground-lighter py-8 text-sm">
                          No ConfigCat feature flags loaded yet.
                        </div>
                      ) : (
                        Object.entries(configcatFlags).map(([flagName, flagValue]) => (
                          <FlagRow
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
                      ))}
                  </div>
                </div>
              </div>
            )}

            {extraTabs.map((tab) => (
              <div
                key={tab.id}
                className={cn('flex-1 min-h-0 overflow-y-auto', activeTab !== tab.id && 'hidden')}
              >
                {tab.content}
              </div>
            ))}
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
