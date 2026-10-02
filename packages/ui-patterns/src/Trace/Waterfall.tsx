'use client'

import { useVirtualizer } from '@tanstack/react-virtual'
import { ScrollArea as ScrollAreaPrimitive } from 'radix-ui'
import type { ComponentProps, CSSProperties, KeyboardEvent, ReactNode } from 'react'
import { createContext, use, useCallback, useEffect, useMemo, useRef } from 'react'
import { cn, ScrollBar, ScrollViewport } from 'ui'

import { useKeyboard } from './hooks/useKeyboard'
import { SpanContext } from './hooks/useSpan'
import { useTimeScale } from './hooks/useTimeScale'
import { useVisibleRows } from './hooks/useVisibleRows'
import { useView } from './Trace'
import type { BarState, SpanContextValue, VisibleRow } from './types'

export interface WaterfallProps extends ComponentProps<'div'> {
  treeWidth?: number
}

export function Waterfall({
  treeWidth = 320,
  className,
  style,
  children,
  ...props
}: WaterfallProps) {
  const vars = { '--trace-tree-width': `${treeWidth}px` } as CSSProperties
  return (
    <div
      data-trace-waterfall
      className={cn(
        'flex min-h-0 flex-col overflow-hidden bg-surface-100 text-sm text-foreground',
        className
      )}
      style={{ ...vars, ...style }}
      {...props}
    >
      {children}
    </div>
  )
}

export interface RulerProps extends ComponentProps<'div'> {
  targetTickSpacing?: number
}

export function Ruler({ targetTickSpacing = 80, className, children, ...props }: RulerProps) {
  const { ref, scale } = useTimeScale<HTMLDivElement>({ targetTickSpacing })

  return (
    <div
      data-trace-ruler
      className={cn(
        'flex h-7 shrink-0 items-stretch border-b border-default bg-surface-200 font-mono',
        className
      )}
      {...props}
    >
      <div className="flex min-w-(--trace-tree-width) shrink-0 items-center gap-2 px-2 text-xs text-foreground-muted uppercase">
        {children ?? 'Span'}
      </div>
      <div ref={ref} aria-hidden className="relative min-w-0 flex-1 select-none overflow-hidden">
        {scale.ticks.map((tick) => (
          <div
            key={tick.ms}
            data-trace-tick
            className="absolute inset-y-0 border-l border-strong"
            style={{ left: `${tick.fraction * 100}%` }}
          >
            <span className="absolute left-2 top-1/2 -translate-y-1/2 whitespace-nowrap font-mono text-xs tabular-nums text-foreground-muted">
              {tick.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

interface RowsContextValue {
  readOnly: boolean
  focusableId: string | null
}

const RowsContext = createContext<RowsContextValue>({ readOnly: false, focusableId: null })

interface RowProps {
  row: VisibleRow
  children: ReactNode
}

function Row({ row, children }: RowProps) {
  const { selectedId, hoveredId, dispatch } = useView()
  const { readOnly, focusableId } = use(RowsContext)

  const { span } = row
  const isSelected = !readOnly && row.id === selectedId
  const isHovered = !readOnly && row.id === hoveredId
  const isRunning = span.endMs === null
  const isDim = row.filterMatch === 'ancestor'

  let state: BarState = 'default'
  if (isSelected) state = 'selected'
  else if (isHovered) state = 'hover'
  else if (isDim) state = 'dim'
  else if (isRunning) state = 'running'

  const value = useMemo<SpanContextValue>(
    () => ({ span, row, isSelected, isHovered, isRunning, state, readOnly }),
    [span, row, isSelected, isHovered, isRunning, state, readOnly]
  )

  return (
    <SpanContext.Provider value={value}>
      <div
        role="treeitem"
        aria-level={row.depth + 1}
        aria-setsize={row.siblingCount}
        aria-posinset={row.siblingIndex + 1}
        aria-expanded={row.hasChildren ? row.isExpanded : undefined}
        aria-selected={readOnly ? undefined : isSelected}
        tabIndex={readOnly ? -1 : row.id === focusableId ? 0 : -1}
        data-trace-row
        data-trace-row-id={row.id}
        data-state={state}
        data-status={span.status}
        data-service={span.serviceName}
        data-depth={row.depth}
        data-filter={row.filterMatch}
        data-running={isRunning ? '' : undefined}
        data-orphan={row.isOrphan ? '' : undefined}
        className={cn(
          'flex h-(--trace-row-height) w-full items-stretch border-b border-muted focus-inset',
          !readOnly && 'cursor-pointer hover:bg-surface-200',
          'data-[state=selected]:bg-selection',
          'data-[filter=ancestor]:opacity-60'
        )}
        onClick={() => {
          if (!readOnly) dispatch({ type: 'select', id: row.id })
        }}
        onPointerEnter={() => {
          if (!readOnly) dispatch({ type: 'hover', id: row.id })
        }}
        onPointerLeave={() => {
          if (!readOnly) dispatch({ type: 'hover', id: null })
        }}
      >
        {children}
      </div>
    </SpanContext.Provider>
  )
}

export interface RowsProps extends ComponentProps<typeof ScrollAreaPrimitive.Root> {
  rowHeight?: number
  overscan?: number
  readOnly?: boolean
  emptyMessage?: ReactNode
}

export function Rows({
  rowHeight = 28,
  overscan = 8,
  readOnly = false,
  emptyMessage,
  children,
  className,
  'aria-label': ariaLabel = 'Spans',
  ...props
}: RowsProps) {
  const { rows, rowIndexById, totalCount, matchCount } = useVisibleRows()
  const { selectedId, dispatch } = useView()

  const viewportRef = useRef<HTMLDivElement>(null)
  const treeRef = useRef<HTMLDivElement>(null)
  const pendingFocus = useRef(false)

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => viewportRef.current,
    estimateSize: () => rowHeight,
    overscan,
    getItemKey: (index) => rows[index].id,
  })

  const keyboard = useKeyboard({ rows, rowIndexById, selectedId, dispatch, disabled: readOnly })

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      pendingFocus.current = true
      keyboard.onKeyDown(event)
    },
    [keyboard]
  )

  useEffect(() => {
    if (readOnly || selectedId === null) return
    const index = rowIndexById.get(selectedId)
    if (index === undefined) return
    virtualizer.scrollToIndex(index, { align: 'auto' })
  }, [selectedId, rowIndexById, virtualizer, readOnly])

  useEffect(() => {
    if (!pendingFocus.current || selectedId === null) return
    pendingFocus.current = false
    let frame = 0
    const focusRow = (attempt: number) => {
      const tree = treeRef.current
      if (!tree) return
      const target = tree.querySelector<HTMLElement>(
        `[data-trace-row-id="${CSS.escape(selectedId)}"]`
      )
      if (target) {
        target.focus({ preventScroll: true })
        return
      }
      if (attempt < 3) frame = requestAnimationFrame(() => focusRow(attempt + 1))
    }
    focusRow(0)
    return () => cancelAnimationFrame(frame)
  }, [selectedId])

  const rowsContext = useMemo<RowsContextValue>(
    () => ({ readOnly, focusableId: readOnly ? null : (selectedId ?? rows[0]?.id ?? null) }),
    [readOnly, selectedId, rows]
  )

  const vars = { '--trace-row-height': `${rowHeight}px` } as CSSProperties

  let fallback = emptyMessage ?? 'No spans in this trace'
  if (emptyMessage === undefined && totalCount > 0 && matchCount === 0) {
    fallback = 'No spans match this filter'
  }

  return (
    <ScrollAreaPrimitive.Root
      data-trace-rows
      className={cn('relative min-h-0 flex-1 overflow-hidden', className)}
      {...props}
    >
      <ScrollViewport ref={viewportRef} className="h-full w-full">
        <RowsContext.Provider value={rowsContext}>
          {rows.length === 0 && (
            <div
              data-trace-empty
              className="flex items-center justify-center p-6 text-center text-sm text-foreground-light"
            >
              {fallback}
            </div>
          )}
          <div
            ref={treeRef}
            role="tree"
            aria-label={ariaLabel}
            aria-multiselectable={false}
            className="relative w-full"
            style={{ ...vars, height: virtualizer.getTotalSize() }}
            onKeyDown={handleKeyDown}
          >
            {virtualizer.getVirtualItems().map((item) => {
              const row = rows[item.index]
              if (!row) return null
              return (
                <div
                  key={item.key}
                  role="none"
                  data-index={item.index}
                  className="absolute left-0 top-0 w-full"
                  style={{ height: item.size, transform: `translateY(${item.start}px)` }}
                >
                  <Row row={row}>{children}</Row>
                </div>
              )
            })}
          </div>
        </RowsContext.Provider>
      </ScrollViewport>
      <ScrollBar orientation="vertical" />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
}

export function Lane({ className, children, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-trace-lane
      className={cn('relative min-w-0 flex-1 overflow-hidden', className)}
      {...props}
    >
      {children}
    </div>
  )
}
