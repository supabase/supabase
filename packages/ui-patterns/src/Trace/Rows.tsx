'use client'

import { useVirtualizer } from '@tanstack/react-virtual'
import { ChevronRight } from 'lucide-react'
import { ScrollArea as ScrollAreaPrimitive } from 'radix-ui'
import type { ComponentProps, KeyboardEvent } from 'react'
import { createContext, use, useEffect, useMemo, useRef, useState } from 'react'
import { Button, cn, ScrollBar, ScrollViewport } from 'ui'

import { useTrace, useView } from './Trace'
import type { SpanContextValue } from './types'
import { flattenTree, formatDuration } from './utils'

const ROW_HEIGHT = 28
const OVERSCAN = 8
const INDENT = 14

const SpanContext = createContext<SpanContextValue | null>(null)

function useSpan(): SpanContextValue {
  const value = use(SpanContext)
  if (!value) throw new Error('Trace parts must be rendered inside Trace.Rows')
  return value
}

export function Rows({
  className,
  children,
  ...props
}: ComponentProps<typeof ScrollAreaPrimitive.Root>) {
  const index = useTrace()
  const { selectedId, collapsed, select, setCollapsed } = useView()
  const rows = useMemo(() => flattenTree(index, collapsed), [index, collapsed])
  const rowIndexById = useMemo(() => new Map(rows.map((row, i) => [row.span.id, i])), [rows])

  const viewportRef = useRef<HTMLDivElement>(null)
  const treeRef = useRef<HTMLDivElement>(null)
  const pendingFocus = useRef(false)
  const [focusedId, setFocusedId] = useState<string | null>(null)

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => viewportRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: OVERSCAN,
    getItemKey: (i) => rows[i].span.id,
  })

  const tabbableId =
    [focusedId, selectedId].find((id) => id !== null && rowIndexById.has(id)) ??
    rows[0]?.span.id ??
    null

  useEffect(() => {
    if (!pendingFocus.current || focusedId === null) return
    let frame = 0
    const focusRow = (attempt: number) => {
      const target = treeRef.current?.querySelector<HTMLElement>(
        `[data-trace-row-id="${CSS.escape(focusedId)}"]`
      )
      if (target) {
        target.focus({ preventScroll: true })
        pendingFocus.current = false
        return
      }
      if (attempt < 3) frame = requestAnimationFrame(() => focusRow(attempt + 1))
    }
    focusRow(0)
    return () => cancelAnimationFrame(frame)
  }, [focusedId])

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return
    const current = tabbableId === null ? undefined : rowIndexById.get(tabbableId)
    if (current === undefined) return
    const { span, hasChildren, isExpanded } = rows[current]

    const moveTo = (i: number) => {
      pendingFocus.current = true
      setFocusedId(rows[i].span.id)
      virtualizer.scrollToIndex(i)
    }

    switch (event.key) {
      case 'ArrowDown':
        if (current < rows.length - 1) moveTo(current + 1)
        break
      case 'ArrowUp':
        if (current > 0) moveTo(current - 1)
        break
      case 'ArrowRight':
        if (hasChildren && !isExpanded) setCollapsed(span.id, false)
        break
      case 'ArrowLeft': {
        const parentIndex = span.parentId === null ? undefined : rowIndexById.get(span.parentId)
        if (isExpanded) setCollapsed(span.id, true)
        else if (parentIndex !== undefined) moveTo(parentIndex)
        break
      }
      case 'Enter':
      case ' ':
        select(span.id)
        break
      default:
        return
    }
    event.preventDefault()
  }

  return (
    <ScrollAreaPrimitive.Root
      data-trace-rows
      className={cn('relative min-h-0 flex-1 overflow-hidden', className)}
      {...props}
    >
      <ScrollViewport ref={viewportRef} className="h-full w-full">
        <div
          ref={treeRef}
          role="tree"
          aria-label="Spans"
          className="relative w-full"
          style={{ height: virtualizer.getTotalSize() }}
          onKeyDown={handleKeyDown}
        >
          {virtualizer.getVirtualItems().map((item) => {
            const row = rows[item.index]
            if (!row) return null
            const { id } = row.span
            const isSelected = id === selectedId
            return (
              <SpanContext.Provider key={item.key} value={{ row, isSelected }}>
                <div
                  role="treeitem"
                  aria-level={row.depth + 1}
                  aria-expanded={row.hasChildren ? row.isExpanded : undefined}
                  aria-selected={isSelected}
                  tabIndex={id === tabbableId ? 0 : -1}
                  data-trace-row
                  data-trace-row-id={id}
                  data-state={isSelected ? 'selected' : undefined}
                  className="absolute left-0 top-0 flex w-full cursor-pointer items-stretch border-b border-muted outline-none hover:bg-surface-200 focus-visible:bg-surface-200 data-[state=selected]:bg-selection"
                  style={{ height: item.size, transform: `translateY(${item.start}px)` }}
                  onClick={() => {
                    select(id)
                    setFocusedId(id)
                  }}
                  onFocus={() => setFocusedId(id)}
                >
                  {children}
                </div>
              </SpanContext.Provider>
            )
          })}
        </div>
      </ScrollViewport>
      <ScrollBar orientation="vertical" />
    </ScrollAreaPrimitive.Root>
  )
}

export function Cell({ className, style, ...props }: ComponentProps<'div'>) {
  const { row } = useSpan()
  const { setCollapsed } = useView()

  return (
    <div
      data-trace-cell
      className={cn(
        'flex w-(--trace-tree-width) shrink-0 items-center gap-1.5 overflow-hidden border-r border-muted pr-2',
        className
      )}
      style={{ paddingLeft: row.depth * INDENT + 4, ...style }}
      {...props}
    >
      <span className="flex size-[18px] shrink-0 items-center justify-center">
        {row.hasChildren && (
          <Button
            variant="text"
            size="tiny"
            tabIndex={-1}
            aria-label={row.isExpanded ? 'Collapse' : 'Expand'}
            className="size-[18px] p-0"
            icon={
              <ChevronRight
                className={cn(
                  'transition-transform motion-reduce:transition-none',
                  row.isExpanded && 'rotate-90'
                )}
              />
            }
            onClick={(event) => {
              event.stopPropagation()
              setCollapsed(row.span.id, row.isExpanded)
            }}
          />
        )}
      </span>
      <span data-trace-name className="min-w-0 flex-1 truncate font-mono text-xs">
        {row.span.name}
      </span>
      <Duration />
    </div>
  )
}

export function Lane({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-trace-lane
      className={cn('relative min-w-0 flex-1 overflow-hidden', className)}
      {...props}
    />
  )
}

export function Duration({ className, ...props }: ComponentProps<'span'>) {
  const { row } = useSpan()
  const { nowMs } = useTrace()
  const { startMs, endMs } = row.span
  const isRunning = endMs === null

  return (
    <span
      data-trace-duration
      className={cn(
        'shrink-0 font-mono text-xs tabular-nums text-foreground-lighter',
        isRunning && 'text-foreground-light motion-safe:animate-pulse',
        className
      )}
      {...props}
    >
      {formatDuration((endMs ?? Math.max(startMs, nowMs)) - startMs)}
    </span>
  )
}
