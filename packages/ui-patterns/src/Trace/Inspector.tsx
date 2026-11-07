'use client'

import { useMemo } from 'react'
import { Badge, Popover, PopoverAnchor, PopoverContent } from 'ui'

import { useTrace, useView } from './Trace'
import type { SpanStatus } from './types'
import { effectiveEndMs, formatAttributeValue, formatDuration } from './utils'

const STATUS_BADGE: Record<SpanStatus, 'success' | 'destructive' | 'default'> = {
  ok: 'success',
  error: 'destructive',
  unset: 'default',
}

function anchorRect(tree: HTMLElement | null, id: string): DOMRect {
  const row = tree?.querySelector<HTMLElement>(`[data-trace-row-id="${CSS.escape(id)}"]`)
  if (!row) return new DOMRect(-10000, -10000, 0, 0)
  const lane = (row.querySelector('[data-trace-lane]') ?? row).getBoundingClientRect()
  const bar = row.querySelector('[data-trace-bar]')?.getBoundingClientRect()
  if (!bar || bar.right < lane.left || bar.left > lane.right) return lane
  const left = Math.max(bar.left, lane.left)
  return new DOMRect(left, bar.top, Math.min(bar.right, lane.right) - left, bar.height)
}

export function Inspector() {
  const { byId, bounds, nowMs } = useTrace()
  const { selectedId, select, treeRef } = useView()
  const span = selectedId === null ? undefined : byId.get(selectedId)

  const virtualRef = useMemo(
    () => ({
      current: {
        get contextElement() {
          return treeRef.current ?? undefined
        },
        getBoundingClientRect: () => anchorRect(treeRef.current, selectedId ?? ''),
      },
    }),
    [treeRef, selectedId]
  )

  if (!span) return null

  const attributes = Object.entries(span.attributes)
  const label = 'text-foreground-lighter'

  return (
    <Popover
      key={span.id}
      open
      onOpenChange={(open) => {
        if (!open) select(null)
      }}
    >
      <PopoverAnchor virtualRef={virtualRef} />
      <PopoverContent
        side="bottom"
        align="start"
        hideWhenDetached
        updatePositionStrategy="always"
        aria-label={`${span.name} details`}
        data-trace-inspector
        className="flex max-h-96 w-80 flex-col gap-3 overflow-y-auto p-3 text-xs"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
        onInteractOutside={(event) => {
          const waterfall = treeRef.current?.closest('[data-trace-waterfall]')
          if (waterfall?.contains(event.target as Node)) event.preventDefault()
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <span className="min-w-0 break-all font-mono text-sm text-foreground">{span.name}</span>
          <Badge variant={STATUS_BADGE[span.status]}>{span.status}</Badge>
        </div>

        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-mono tabular-nums">
          <dt className={label}>Start</dt>
          <dd>{formatDuration(span.startMs - bounds[0])}</dd>
          <dt className={label}>Duration</dt>
          <dd>
            {formatDuration(effectiveEndMs(span, nowMs) - span.startMs)}
            {span.endMs === null && <span className={label}> (running)</span>}
          </dd>
        </dl>

        <section className="flex flex-col gap-1">
          <h3 className={label}>Attributes</h3>
          {attributes.length === 0 ? (
            <p className={label}>No attributes</p>
          ) : (
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-mono">
              {attributes.map(([key, value]) => (
                <div key={key} className="contents">
                  <dt className={label}>{key}</dt>
                  <dd className="break-all">{formatAttributeValue(value)}</dd>
                </div>
              ))}
            </dl>
          )}
        </section>

        <section className="flex flex-col gap-1">
          <h3 className={label}>Events</h3>
          {span.events.length === 0 ? (
            <p className={label}>No events</p>
          ) : (
            <ul className="flex flex-col gap-1 font-mono">
              {span.events.map((event, i) => (
                <li key={i} className="flex justify-between gap-3">
                  <span className="break-all">{event.name}</span>
                  <span className={`${label} tabular-nums`}>
                    +{formatDuration(event.timeMs - span.startMs)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </PopoverContent>
    </Popover>
  )
}
