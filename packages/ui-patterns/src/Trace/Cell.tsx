'use client'

import { ChevronRight, Unplug } from 'lucide-react'
import type { ComponentProps } from 'react'
import { Badge, Button, cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import { Duration } from './Bar'
import { useSpan } from './hooks/useSpan'
import { useView } from './Trace'

export interface CellProps extends ComponentProps<'div'> {
  indent?: number
}

const TOGGLE_SIZE = 18
export const MIN_INDENT = 10

export function Cell({ indent: indentProp = 14, className, style, ...props }: CellProps) {
  const { row, span, readOnly } = useSpan()
  const { dispatch } = useView()
  const indent = Math.max(MIN_INDENT, indentProp)
  const guideOffset = TOGGLE_SIZE / 2 + 4

  return (
    <div
      data-trace-cell
      className={cn(
        'relative flex w-(--trace-tree-width) shrink-0 items-center gap-1.5 overflow-hidden border-r border-muted pr-2',
        className
      )}
      style={{ paddingLeft: row.depth * indent + 4, ...style }}
      {...props}
    >
      {row.guides.map((show, depth) =>
        show ? (
          <span
            key={depth}
            aria-hidden
            data-trace-guide
            className="absolute inset-y-0 w-px bg-border-muted"
            style={{ left: depth * indent + guideOffset }}
          />
        ) : null
      )}

      <span className="flex shrink-0 items-center justify-center" style={{ width: TOGGLE_SIZE }}>
        {row.hasChildren && (
          <Button
            variant="text"
            size="tiny"
            tabIndex={-1}
            aria-label={row.isExpanded ? 'Collapse' : 'Expand'}
            disabled={readOnly}
            className="size-[18px] p-0 bg-muted rounded border border-default"
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
              dispatch({ type: 'toggle', id: row.id })
            }}
          />
        )}
      </span>

      <span
        aria-hidden
        data-trace-status-dot
        data-status={span.status}
        className={cn(
          'size-1.5 shrink-0 rounded-full',
          span.status === 'error' && 'bg-destructive',
          span.status === 'ok' && 'bg-brand',
          span.status === 'unset' && 'border border-foreground-muted'
        )}
      />

      <Tooltip>
        <TooltipTrigger asChild>
          <span className="flex items-center gap-1.5">
            <span data-trace-name className="min-w-0 flex-1 truncate font-mono text-xs">
              {span.name}
            </span>
            {row.hiddenDescendantCount > 0 && (
              <Badge data-trace-hidden-count>+{row.hiddenDescendantCount}</Badge>
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" align="start">
          {span.name}
          <span className="text-foreground-light"> · {span.serviceName}</span>
        </TooltipContent>
      </Tooltip>

      {row.isOrphan && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span data-trace-orphan className="flex shrink-0 text-warning">
              <Unplug className="size-3" />
            </span>
          </TooltipTrigger>
          <TooltipContent side="top">Parent span is missing from this trace</TooltipContent>
        </Tooltip>
      )}

      <Duration className="ml-auto" />
    </div>
  )
}
