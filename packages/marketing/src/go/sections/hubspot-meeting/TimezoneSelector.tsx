'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { cn } from 'ui'

interface TimezoneSelectorProps {
  value: string
  onChange: (tz: string) => void
}

interface TimezoneEntry {
  id: string
  label: string
  offset: string
  offsetMinutes: number
}

interface TimezoneGroup {
  continent: string
  zones: TimezoneEntry[]
}

const TIMEZONE_DATA: Array<{ id: string; label: string; continent: string }> = [
  // Americas
  { id: 'Pacific/Honolulu', label: 'Hawaii', continent: 'Americas' },
  { id: 'America/Anchorage', label: 'Alaska', continent: 'Americas' },
  { id: 'America/Los_Angeles', label: 'Pacific Time', continent: 'Americas' },
  { id: 'America/Denver', label: 'Mountain Time', continent: 'Americas' },
  { id: 'America/Chicago', label: 'Central Time', continent: 'Americas' },
  { id: 'America/New_York', label: 'Eastern Time', continent: 'Americas' },
  { id: 'America/Halifax', label: 'Atlantic Time', continent: 'Americas' },
  { id: 'America/St_Johns', label: 'Newfoundland', continent: 'Americas' },
  { id: 'America/Sao_Paulo', label: 'Brasilia', continent: 'Americas' },
  { id: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires', continent: 'Americas' },
  { id: 'America/Santiago', label: 'Santiago', continent: 'Americas' },
  { id: 'America/Bogota', label: 'Bogota', continent: 'Americas' },
  { id: 'America/Mexico_City', label: 'Mexico City', continent: 'Americas' },
  { id: 'America/Toronto', label: 'Toronto', continent: 'Americas' },
  { id: 'America/Vancouver', label: 'Vancouver', continent: 'Americas' },

  // Europe
  { id: 'Atlantic/Reykjavik', label: 'Reykjavik', continent: 'Europe' },
  { id: 'Europe/London', label: 'Dublin, London, Lisbon', continent: 'Europe' },
  { id: 'Europe/Paris', label: 'Paris, Berlin, Amsterdam', continent: 'Europe' },
  { id: 'Europe/Helsinki', label: 'Helsinki, Kyiv, Riga', continent: 'Europe' },
  { id: 'Europe/Moscow', label: 'Moscow, St. Petersburg', continent: 'Europe' },
  { id: 'Europe/Madrid', label: 'Madrid, Rome', continent: 'Europe' },
  { id: 'Europe/Warsaw', label: 'Warsaw, Prague, Budapest', continent: 'Europe' },
  { id: 'Europe/Bucharest', label: 'Bucharest, Athens', continent: 'Europe' },
  { id: 'Europe/Istanbul', label: 'Istanbul', continent: 'Europe' },
  { id: 'Europe/Zurich', label: 'Zurich, Vienna', continent: 'Europe' },

  // Africa
  { id: 'Africa/Casablanca', label: 'Casablanca', continent: 'Africa' },
  { id: 'Africa/Lagos', label: 'Lagos, West Africa', continent: 'Africa' },
  { id: 'Africa/Cairo', label: 'Cairo', continent: 'Africa' },
  { id: 'Africa/Nairobi', label: 'Nairobi, East Africa', continent: 'Africa' },
  { id: 'Africa/Johannesburg', label: 'Johannesburg', continent: 'Africa' },

  // Asia
  { id: 'Asia/Dubai', label: 'Dubai, Abu Dhabi', continent: 'Asia' },
  { id: 'Asia/Karachi', label: 'Karachi', continent: 'Asia' },
  { id: 'Asia/Kolkata', label: 'Mumbai, Kolkata, Delhi', continent: 'Asia' },
  { id: 'Asia/Dhaka', label: 'Dhaka', continent: 'Asia' },
  { id: 'Asia/Bangkok', label: 'Bangkok, Jakarta', continent: 'Asia' },
  { id: 'Asia/Singapore', label: 'Singapore, Kuala Lumpur', continent: 'Asia' },
  { id: 'Asia/Shanghai', label: 'Beijing, Shanghai', continent: 'Asia' },
  { id: 'Asia/Hong_Kong', label: 'Hong Kong', continent: 'Asia' },
  { id: 'Asia/Tokyo', label: 'Tokyo, Osaka', continent: 'Asia' },
  { id: 'Asia/Seoul', label: 'Seoul', continent: 'Asia' },
  { id: 'Asia/Taipei', label: 'Taipei', continent: 'Asia' },
  { id: 'Asia/Jerusalem', label: 'Jerusalem, Tel Aviv', continent: 'Asia' },
  { id: 'Asia/Riyadh', label: 'Riyadh', continent: 'Asia' },
  { id: 'Asia/Tehran', label: 'Tehran', continent: 'Asia' },

  // Australia & Pacific
  { id: 'Australia/Perth', label: 'Perth', continent: 'Pacific' },
  { id: 'Australia/Adelaide', label: 'Adelaide', continent: 'Pacific' },
  { id: 'Australia/Sydney', label: 'Sydney, Melbourne', continent: 'Pacific' },
  { id: 'Australia/Brisbane', label: 'Brisbane', continent: 'Pacific' },
  { id: 'Pacific/Auckland', label: 'Auckland, Wellington', continent: 'Pacific' },
  { id: 'Pacific/Fiji', label: 'Fiji', continent: 'Pacific' },
]

function getUtcOffset(tzId: string): { label: string; minutes: number } {
  try {
    const now = new Date()
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tzId,
      timeZoneName: 'shortOffset',
    })
    const parts = formatter.formatToParts(now)
    const offsetPart = parts.find((p) => p.type === 'timeZoneName')?.value || ''

    // Parse "GMT+5:30" or "GMT-8" etc.
    const match = offsetPart.match(/GMT([+-])?(\d{1,2})?(?::(\d{2}))?/)
    if (!match) return { label: 'UTC +00:00', minutes: 0 }

    const sign = match[1] === '-' ? -1 : 1
    const hours = parseInt(match[2] || '0', 10)
    const mins = parseInt(match[3] || '0', 10)
    const totalMinutes = sign * (hours * 60 + mins)

    const absH = String(Math.abs(Math.floor(totalMinutes / 60))).padStart(2, '0')
    const absM = String(Math.abs(totalMinutes % 60)).padStart(2, '0')
    const signStr = totalMinutes >= 0 ? '+' : '-'

    return { label: `UTC ${signStr}${absH}:${absM}`, minutes: totalMinutes }
  } catch {
    return { label: 'UTC +00:00', minutes: 0 }
  }
}

function buildGroups(userTz: string): { userEntry: TimezoneEntry; groups: TimezoneGroup[] } {
  const entries: TimezoneEntry[] = TIMEZONE_DATA.map((tz) => {
    const offset = getUtcOffset(tz.id)
    return { id: tz.id, label: tz.label, offset: offset.label, offsetMinutes: offset.minutes }
  })

  // Build user entry
  const userMatch = entries.find((e) => e.id === userTz)
  const userOffset = getUtcOffset(userTz)
  const userEntry: TimezoneEntry = userMatch ?? {
    id: userTz,
    label: userTz.split('/').pop()?.replace(/_/g, ' ') || userTz,
    offset: userOffset.label,
    offsetMinutes: userOffset.minutes,
  }

  const continentOrder = ['Americas', 'Europe', 'Africa', 'Asia', 'Pacific']
  const grouped = new Map<string, TimezoneEntry[]>()

  for (const tz of TIMEZONE_DATA) {
    const entry = entries.find((e) => e.id === tz.id)!
    if (!grouped.has(tz.continent)) grouped.set(tz.continent, [])
    grouped.get(tz.continent)!.push(entry)
  }

  // Sort each group by offset
  for (const zones of grouped.values()) {
    zones.sort((a, b) => a.offsetMinutes - b.offsetMinutes)
  }

  const groups: TimezoneGroup[] = continentOrder
    .filter((c) => grouped.has(c))
    .map((c) => ({ continent: c, zones: grouped.get(c)! }))

  return { userEntry, groups }
}

export default function TimezoneSelector({ value, onChange }: TimezoneSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const { userEntry, groups } = useMemo(() => buildGroups(value), [value])

  const currentEntry = useMemo(() => {
    for (const group of groups) {
      const match = group.zones.find((z) => z.id === value)
      if (match) return match
    }
    return userEntry
  }, [value, groups, userEntry])

  // Filter by search
  const filteredGroups = useMemo(() => {
    if (!search.trim()) return groups
    const q = search.toLowerCase()
    return groups
      .map((g) => ({
        ...g,
        zones: g.zones.filter(
          (z) =>
            z.label.toLowerCase().includes(q) ||
            z.id.toLowerCase().includes(q) ||
            z.offset.toLowerCase().includes(q) ||
            g.continent.toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.zones.length > 0)
  }, [groups, search])

  // Flat list of all visible zones for keyboard navigation
  const flatZones = useMemo(() => filteredGroups.flatMap((g) => g.zones), [filteredGroups])

  // Reset highlight when search changes
  useEffect(() => {
    setHighlightedIndex(-1)
  }, [search])

  const selectZone = useCallback(
    (zone: TimezoneEntry) => {
      onChange(zone.id)
      setOpen(false)
      setSearch('')
      setHighlightedIndex(-1)
    },
    [onChange]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open || flatZones.length === 0) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlightedIndex((i) => {
          const next = i < flatZones.length - 1 ? i + 1 : 0
          document.getElementById(`tz-option-${next}`)?.scrollIntoView({ block: 'nearest' })
          return next
        })
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlightedIndex((i) => {
          const next = i > 0 ? i - 1 : flatZones.length - 1
          document.getElementById(`tz-option-${next}`)?.scrollIntoView({ block: 'nearest' })
          return next
        })
      } else if (e.key === 'Enter' && highlightedIndex >= 0) {
        e.preventDefault()
        selectZone(flatZones[highlightedIndex])
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setOpen(false)
        setSearch('')
        setHighlightedIndex(-1)
      }
    },
    [open, flatZones, highlightedIndex, selectZone]
  )

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Focus search on open
  useEffect(() => {
    if (open) searchRef.current?.focus()
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-foreground-lighter text-xs hover:text-foreground transition-colors"
      >
        <GlobeIcon />
        <span>
          {currentEntry.offset} {currentEntry.label}
        </span>
        <ChevronDownIcon className={cn('transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div
          className="absolute z-50 top-full mt-2 left-0 w-72 max-h-80 overflow-hidden rounded-lg border border-muted bg-overlay shadow-lg flex flex-col"
          onKeyDown={handleKeyDown}
        >
          <div className="p-2 border-b border-muted">
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search timezones..."
              className="w-full text-foreground text-sm placeholder:text-foreground-lighter/50 outline-none focus:ring-transparent focus:border-muted bg-muted rounded-md"
              role="combobox"
              aria-expanded={open}
              aria-activedescendant={
                highlightedIndex >= 0 ? `tz-option-${highlightedIndex}` : undefined
              }
            />
          </div>

          <div ref={listRef} className="overflow-y-auto flex-1" role="listbox">
            {(() => {
              let flatIndex = 0
              return filteredGroups.map((group) => (
                <div key={group.continent}>
                  <div className="px-3 py-1.5 text-foreground-light text-xs font-semibold sticky top-0 bg-surface-200">
                    {group.continent}
                  </div>
                  {group.zones.map((zone) => {
                    const idx = flatIndex++
                    const isHighlighted = idx === highlightedIndex
                    return (
                      <button
                        key={zone.id}
                        id={`tz-option-${idx}`}
                        type="button"
                        role="option"
                        aria-selected={zone.id === value}
                        onClick={() => selectZone(zone)}
                        onMouseEnter={() => setHighlightedIndex(idx)}
                        className={cn(
                          'w-full text-left px-3 py-2 text-sm flex items-center justify-between transition-colors',
                          zone.id === value
                            ? 'bg-brand-500/10 text-brand-500'
                            : isHighlighted
                              ? 'bg-surface-300/50 text-foreground'
                              : 'text-foreground hover:bg-surface-300/50'
                        )}
                      >
                        <span className="truncate">{zone.label}</span>
                        <span className="text-xs text-foreground-lighter flex-shrink-0 ml-2">
                          {zone.offset}
                        </span>
                      </button>
                    )
                  })}
                </div>
              ))
            })()}

            {filteredGroups.length === 0 && (
              <p className="text-foreground-lighter text-sm text-center py-4">No timezones found</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function GlobeIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className={className}>
      <path
        d="M4 6L8 10L12 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
