'use client'

import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Settings, Star, X } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'ui'

import type { useV2DataCounts } from './useV2DataCounts'

type V2DataCounts = ReturnType<typeof useV2DataCounts>

/** Matches `DATA_GROUPS` in BrowserPanel (Data nav) — same hrefs and count keys */
const HOME_COUNTER_CATALOG = [
  { id: 'tables', label: 'Tables', countKey: 'tables' as const, path: 'tables' },
  { id: 'functions', label: 'DB Functions', countKey: 'functions' as const, path: 'functions' },
  { id: 'types', label: 'DB Enum types', countKey: 'types' as const, path: 'types' },
  { id: 'roles', label: 'DB Roles', countKey: 'roles' as const, path: 'roles' },
  {
    id: 'extensions',
    label: 'DB Extensions',
    countKey: 'extensions' as const,
    path: 'extensions',
  },
  { id: 'indexes', label: 'DB Indexes', countKey: 'indexes' as const, path: 'indexes' },
  {
    id: 'publications',
    label: 'DB Publications',
    countKey: 'publications' as const,
    path: 'publications',
  },
  { id: 'users', label: 'Users', countKey: 'users' as const, path: 'users' },
  { id: 'providers', label: 'Auth Providers', countKey: 'providers' as const, path: 'providers' },
  {
    id: 'oauthApps',
    label: 'OAuth apps',
    countKey: 'oauthApps' as const,
    path: 'oauth-apps',
  },
  { id: 'buckets', label: 'Buckets', countKey: 'buckets' as const, path: 'buckets' },
  {
    id: 'edgeFunctions',
    label: 'Edge functions',
    countKey: 'edgeFunctions' as const,
    path: 'edge-functions',
  },
  { id: 'channels', label: 'Channels', countKey: 'channels' as const, path: 'channels' },
] as const

export type HomeCounterId = (typeof HOME_COUNTER_CATALOG)[number]['id']

const ALL_COUNTER_IDS = new Set<string>(HOME_COUNTER_CATALOG.map((c) => c.id))

const COUNTER_BY_ID = new Map(HOME_COUNTER_CATALOG.map((c) => [c.id, c]))

const DEFAULT_HOME_COUNTER_IDS: HomeCounterId[] = [
  'tables',
  'users',
  'edgeFunctions',
  'buckets',
  'functions',
  'roles',
  'publications',
  'types',
]

const MAX_VISIBLE_COUNTERS = 8

function storageKey(projectRef: string) {
  return `v2-${projectRef}-home-data-counters`
}

function parseSavedIds(raw: string | null): HomeCounterId[] | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return null
    const out: HomeCounterId[] = []
    for (const x of parsed) {
      if (typeof x !== 'string' || !ALL_COUNTER_IDS.has(x)) continue
      const id = x as HomeCounterId
      if (out.includes(id)) continue
      out.push(id)
      if (out.length >= MAX_VISIBLE_COUNTERS) break
    }
    return out.length > 0 ? out : null
  } catch {
    return null
  }
}

function buildHref(projectRef: string | undefined, path: string) {
  return projectRef ? `/v2/project/${projectRef}/data/${path}` : '#'
}

interface SortableCounterItemProps {
  id: HomeCounterId
  label: string
  canRemove: boolean
  onRemove: (id: HomeCounterId) => void
}

function SortableCounterItem({ id, label, canRemove, onRemove }: SortableCounterItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <DropdownMenuItem
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'group/grab cursor-grab active:cursor-grabbing flex items-center gap-2 text-foreground-light hover:text-foreground',
        isDragging && 'opacity-50'
      )}
      onClick={(e) => e.preventDefault()}
    >
      <div className="text-foreground-muted group-hover/grab:text-foreground-lighter hover:bg-muted/50 rounded">
        <GripVertical size={14} />
      </div>
      <span className="flex-1 truncate">{label}</span>
      <Button
        type="text"
        size="tiny"
        disabled={!canRemove}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onRemove(id)
        }}
        className="w-4 h-4 !p-0 text-foreground-lighter hover:text-foreground disabled:opacity-30"
      >
        <X size={12} />
      </Button>
    </DropdownMenuItem>
  )
}

interface ReorderableCountersListProps {
  selectedIds: HomeCounterId[]
  onReorder: (ids: HomeCounterId[]) => void
  onToggle: (id: HomeCounterId, selected: boolean) => void
}

function ReorderableCountersList({
  selectedIds,
  onReorder,
  onToggle,
}: ReorderableCountersListProps) {
  const unselected = HOME_COUNTER_CATALOG.filter((c) => !selectedIds.some((sid) => sid === c.id))

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = selectedIds.findIndex((item) => item === active.id)
    const newIndex = selectedIds.findIndex((item) => item === over.id)
    if (oldIndex !== -1 && newIndex !== -1) {
      onReorder(arrayMove(selectedIds, oldIndex, newIndex))
    }
  }

  const remove = (id: HomeCounterId) => onToggle(id, false)
  const add = (id: HomeCounterId) => onToggle(id, true)

  return (
    <div className="overflow-y-auto max-h-[min(320px,calc(100vh-120px))]">
      <DropdownMenuGroup>
        <DropdownMenuLabel>
          Visible counters ({selectedIds.length}/{MAX_VISIBLE_COUNTERS})
        </DropdownMenuLabel>
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <SortableContext items={selectedIds} strategy={verticalListSortingStrategy}>
            {selectedIds.map((id) => {
              const meta = COUNTER_BY_ID.get(id)
              if (!meta) return null
              return (
                <SortableCounterItem
                  key={id}
                  id={id}
                  label={meta.label}
                  canRemove={selectedIds.length > 1}
                  onRemove={remove}
                />
              )
            })}
          </SortableContext>
        </DndContext>
      </DropdownMenuGroup>
      {unselected.length > 0 && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuLabel>Add counter</DropdownMenuLabel>
            {unselected.map((meta) => {
              const atMax = selectedIds.length >= MAX_VISIBLE_COUNTERS
              return (
                <DropdownMenuItem
                  key={meta.id}
                  disabled={atMax}
                  className="flex items-center gap-2 cursor-pointer w-full text-left text-foreground-light hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={(e) => {
                    e.preventDefault()
                    if (atMax) return
                    add(meta.id)
                  }}
                >
                  <span className="flex-1 truncate">{meta.label}</span>
                  <div className="flex items-center justify-center text-foreground-lighter">
                    <Star size={12} />
                  </div>
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuGroup>
        </>
      )}
    </div>
  )
}

export function HomeViewDataCountersRow({
  projectRef,
  counts,
}: {
  projectRef: string | undefined
  counts: V2DataCounts
}) {
  const [open, setOpen] = useState(false)
  const [savedIds, setSavedIds] = useState<HomeCounterId[]>(DEFAULT_HOME_COUNTER_IDS)
  const [draftIds, setDraftIds] = useState<HomeCounterId[]>(DEFAULT_HOME_COUNTER_IDS)
  const [hasHydratedSavedIds, setHasHydratedSavedIds] = useState(false)

  useEffect(() => {
    if (!projectRef) {
      setSavedIds(DEFAULT_HOME_COUNTER_IDS)
      setHasHydratedSavedIds(true)
      return
    }
    setHasHydratedSavedIds(false)
    const parsed = parseSavedIds(
      typeof window !== 'undefined' ? localStorage.getItem(storageKey(projectRef)) : null
    )
    setSavedIds(parsed ?? DEFAULT_HOME_COUNTER_IDS)
    setHasHydratedSavedIds(true)
  }, [projectRef])

  useEffect(() => {
    if (!projectRef || !hasHydratedSavedIds) return
    try {
      localStorage.setItem(storageKey(projectRef), JSON.stringify(savedIds))
    } catch {
      // ignore quota / private mode
    }
  }, [projectRef, savedIds, hasHydratedSavedIds])

  useEffect(() => {
    if (open) setDraftIds(savedIds)
  }, [open, savedIds])

  const visibleCounterIds = open ? draftIds : savedIds

  const visibleCounters = useMemo(() => {
    return visibleCounterIds.slice(0, MAX_VISIBLE_COUNTERS).map((id) => {
      const meta = COUNTER_BY_ID.get(id)
      if (!meta) return null
      return {
        id,
        label: meta.label,
        count: counts[meta.countKey],
        href: buildHref(projectRef, meta.path),
      }
    })
  }, [visibleCounterIds, counts, projectRef])

  const placeholderCount = open
    ? Math.max(0, MAX_VISIBLE_COUNTERS - visibleCounters.filter(Boolean).length)
    : 0

  const handleToggle = useCallback((id: HomeCounterId, selected: boolean) => {
    setDraftIds((prev) => {
      if (selected) {
        if (prev.includes(id)) return prev
        if (prev.length >= MAX_VISIBLE_COUNTERS) return prev
        return [...prev, id]
      }
      if (prev.length <= 1) return prev
      return prev.filter((x) => x !== id)
    })
  }, [])

  const handleSave = useCallback(() => {
    setSavedIds(draftIds)
    setOpen(false)
  }, [draftIds])

  const handleCancel = useCallback(() => {
    setOpen(false)
  }, [])

  const handleResetDraftDefaults = useCallback(() => {
    setDraftIds([...DEFAULT_HOME_COUNTER_IDS])
  }, [])

  return (
    <div className="relative group/home-counters">
      <div className="flex items-center justify-between mb-1 -mt-1 gap-2 focus-within:opacity-100">
        <h2 className="!text-base">Your project in numbers</h2>
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              type="text"
              size="tiny"
              title="Choose and reorder data counters"
              aria-label="Edit data counters"
              className={cn(
                'hover:bg-transparent text-foreground-lighter hover:text-foreground opacity-0 transition-opacity group-hover/home-counters:opacity-100',
                open && 'opacity-100'
              )}
              onClick={(e) => e.stopPropagation()}
              icon={<Settings size={10} />}
            >
              <span>Edit counters</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="bottom"
            align="end"
            className="flex flex-col w-72"
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            <ReorderableCountersList
              selectedIds={draftIds}
              onReorder={setDraftIds}
              onToggle={handleToggle}
            />
            <DropdownMenuSeparator />
            <div className="flex flex-col gap-1 -mx-1 px-1 pb-1">
              <Button
                type="text"
                size="tiny"
                className="!justify-start text-foreground-lighter hover:text-foreground"
                onClick={(e) => {
                  e.preventDefault()
                  handleResetDraftDefaults()
                }}
              >
                Reset to defaults
              </Button>
              <div className="flex items-center gap-1 w-full border-t border-default pt-1">
                <Button type="default" onClick={handleCancel} className="w-1/2">
                  Cancel
                </Button>
                <Button onClick={handleSave} className="w-1/2">
                  Save
                </Button>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div
        className={cn(
          'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2',
          open && 'animate-pulse'
        )}
      >
        {visibleCounters.map((item) =>
          item ? (
            <Link
              key={item.id}
              href={item.href}
              className="text-left group/quick-access-link border bg-surface-100 px-2 py-1 rounded-md hover:border-foreground-lighter"
            >
              <div className="flex gap-1 text-xs font-mono text-foreground-lighter leading-snug tracking-tight truncate">
                <span title={item.label} className="truncate">
                  {item.label}
                </span>
              </div>
              <div className="text-base text-foreground-light leading-tight font-mono">
                {item.count}
              </div>
            </Link>
          ) : null
        )}
        {Array.from({ length: placeholderCount }, (_, slot) => slot).map((slot) => (
          <div
            key={`counter-placeholder-${slot + 1}`}
            aria-hidden
            className="border border-dashed border-border p-2 rounded-md"
          >
            <div className="h-3 w-20 rounded bg-surface-100" />
            <div className="h-4 w-10 rounded bg-surface-100 mt-1" />
          </div>
        ))}
      </div>
    </div>
  )
}
