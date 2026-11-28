'use client'

import { X } from 'lucide-react'
import { useMemo } from 'react'
import { Badge, Button, cn, Popover, PopoverAnchor, PopoverContent, type BadgeProps } from 'ui'

import { useTrace, useView } from './Trace'
import type { SpanStatus } from './types'
import { effectiveEndMs, formatAttributeValue, formatDuration, STATUS_TEXT } from './utils'

const STATUS_BADGE: Record<SpanStatus, BadgeProps['variant']> = {
  ok: 'success',
  error: 'destructive',
  unset: 'default',
}

const STATUS_LABEL: Record<SpanStatus, string> = {
  ok: 'Done',
  error: 'Failed',
  unset: 'Unknown',
}

function anchorRect(tree: HTMLElement | null, viewport: HTMLElement | null, id: string): DOMRect {
  const row = tree?.querySelector<HTMLElement>(`[data-trace-row-id="${CSS.escape(id)}"]`)
  if (!row) return new DOMRect(-10000, -10000, 0, 0)
  if (viewport) {
    const rowRect = row.getBoundingClientRect()
    const viewportRect = viewport.getBoundingClientRect()
    if (rowRect.bottom <= viewportRect.top || rowRect.top >= viewportRect.bottom) {
      return new DOMRect(-10000, -10000, 0, 0)
    }
  }
  const lane = (row.querySelector('[data-trace-lane]') ?? row).getBoundingClientRect()
  const bar = row.querySelector('[data-trace-bar]')?.getBoundingClientRect()
  if (!bar || bar.right < lane.left || bar.left > lane.right) return lane
  const left = Math.max(bar.left, lane.left)
  return new DOMRect(left, bar.top, Math.min(bar.right, lane.right) - left, bar.height)
}

export function Inspector() {
  const { byId, bounds, nowMs } = useTrace()
  const { selectedId, select, treeRef, scrollRef } = useView()
  const span = selectedId === null ? undefined : byId.get(selectedId)

  const virtualRef = useMemo(
    () => ({
      current: {
        get contextElement() {
          return treeRef.current ?? undefined
        },
        getBoundingClientRect: () =>
          anchorRect(treeRef.current, scrollRef.current, selectedId ?? ''),
      },
    }),
    [treeRef, scrollRef, selectedId]
  )

  if (!span) return null

  const attributes = Object.entries(span.attributes)
  const label = 'text-foreground-lighter text-sm'
  const sectionLabel = 'text-[10px] font-medium uppercase tracking-wider text-foreground-muted'

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
        className="flex max-h-96 w-[282px] flex-col gap-5 overflow-y-auto p-3 text-xs"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
        onFocusOutside={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => {
          const waterfall = treeRef.current?.closest('[data-trace-waterfall]')
          if (waterfall?.contains(event.target as Node)) event.preventDefault()
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <span
              aria-hidden
              className={cn('size-1.5 shrink-0 rounded-full bg-current', STATUS_TEXT[span.status])}
            />
            <span className="min-w-0 truncate font-mono text-xs font-medium text-foreground">
              {span.name}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Badge variant={STATUS_BADGE[span.status]}>{STATUS_LABEL[span.status]}</Badge>
            <Button
              variant="text"
              size="tiny"
              className="size-5 p-0 [&_svg]:!size-3"
              icon={<X />}
              aria-label="Close"
              onClick={() => select(null)}
            />
          </div>
        </div>

        <dl className="-mt-2 grid grid-cols-2 gap-3 rounded-md border p-3 font-mono">
          <div className="flex flex-col gap-0.5">
            <dt className={sectionLabel}>Start</dt>
            <dd className="tabular-nums text-foreground">
              {formatDuration(span.startMs - bounds[0])}
            </dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className={sectionLabel}>Duration</dt>
            <dd className="tabular-nums text-foreground">
              {formatDuration(effectiveEndMs(span, nowMs) - span.startMs)}
              {span.endMs === null && <span className={label}> (running)</span>}
            </dd>
          </div>
        </dl>

        {attributes.length > 0 && (
          <section className="flex flex-col gap-3">
            <h3 className="text-xs font-medium text-foreground-light">Attributes</h3>
            <dl className="flex flex-col divide-y divide-border">
              {attributes.map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between gap-3 py-1.5 first:pt-0 last:pb-0"
                >
                  <dt className="text-[11px] text-foreground-muted">{key}</dt>
                  <dd className="break-all text-right font-mono text-[11px] text-foreground">
                    {formatAttributeValue(value)}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {span.events.length > 0 && (
          <section className="flex flex-col gap-3">
            <h3 className="text-xs font-medium text-foreground-light">Events</h3>
            <ul className="flex flex-col divide-y divide-border">
              {span.events.map((event, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between gap-3 py-1.5 first:pt-0 last:pb-0"
                >
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span
                      aria-hidden
                      className="size-[7px] shrink-0 rotate-45 border border-foreground bg-background"
                    />
                    <span className="break-all text-[11px] text-foreground-muted">
                      {event.name}
                    </span>
                  </span>
                  <span className="font-mono text-[11px] tabular-nums text-foreground">
                    +{formatDuration(event.timeMs - span.startMs)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </PopoverContent>
    </Popover>
  )
}
