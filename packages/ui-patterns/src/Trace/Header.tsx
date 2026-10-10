'use client'

import { ChevronsDownUp, Maximize2, Search } from 'lucide-react'
import type { ComponentProps } from 'react'
import type { BadgeProps, ButtonProps } from 'ui'
import { Badge, Button, cn, InputGroup, InputGroupAddon, InputGroupInput } from 'ui'

import { useData, useView } from './Trace'
import type { SpanStatus } from './types'

export function Header({ className, children, ...props }: ComponentProps<'div'>) {
  return (
    <div
      role="toolbar"
      aria-label="Trace tools"
      data-trace-header
      className={cn('flex flex-wrap items-center gap-2', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function Title({ className, children, ...props }: ComponentProps<'h2'>) {
  const { roots, byId } = useData()
  const root = roots.length > 0 ? byId.get(roots[0]) : undefined
  return (
    <h2
      data-trace-title
      className={cn('truncate text-sm font-medium text-foreground', className)}
      {...props}
    >
      {children ?? root?.name ?? 'Trace'}
    </h2>
  )
}

export const STATUS_BADGE_VARIANT: Record<SpanStatus, BadgeProps['variant']> = {
  ok: 'success',
  error: 'destructive',
  unset: 'default',
}

export function Status({ className, children, ...props }: Omit<BadgeProps, 'variant'>) {
  const { roots, byId } = useData()
  const root = roots.length > 0 ? byId.get(roots[0]) : undefined
  const status: SpanStatus = root?.status ?? 'unset'
  return (
    <Badge
      variant={STATUS_BADGE_VARIANT[status]}
      data-trace-status
      data-status={status}
      className={className}
      {...props}
    >
      {children ?? status}
    </Badge>
  )
}

export interface FilterProps extends Omit<ComponentProps<'input'>, 'value' | 'onChange' | 'size'> {
  className?: string
}

export function Filter({
  className,
  placeholder = 'Filter spans',
  onKeyDown,
  ...props
}: FilterProps) {
  const { query, matchIds, dispatch } = useView()

  return (
    <InputGroup data-trace-filter className={cn('w-64', className)}>
      <InputGroupAddon>
        <Search className="size-3.5" />
      </InputGroupAddon>
      <InputGroupInput
        type="search"
        aria-label="Filter spans"
        placeholder={placeholder}
        value={query}
        onChange={(event) => dispatch({ type: 'setQuery', query: event.target.value })}
        onKeyDown={(event) => {
          onKeyDown?.(event)
          if (event.key === 'Escape' && query !== '' && !event.defaultPrevented) {
            event.preventDefault()
            dispatch({ type: 'setQuery', query: '' })
          }
        }}
        {...props}
      />
      {matchIds && (
        <InputGroupAddon align="inline-end">
          <span
            data-trace-filter-count
            className="font-mono text-xs tabular-nums text-foreground-lighter"
          >
            {matchIds.size}
          </span>
        </InputGroupAddon>
      )}
    </InputGroup>
  )
}

export function CollapseAll({ children, onClick, ...props }: ButtonProps) {
  const { dispatch } = useView()
  return (
    <Button
      variant="default"
      size="tiny"
      icon={<ChevronsDownUp />}
      data-trace-collapse-all
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) dispatch({ type: 'collapseAll' })
      }}
      {...props}
    >
      {children ?? 'Collapse all'}
    </Button>
  )
}

export function ResetZoom({ children, onClick, ...props }: ButtonProps) {
  const { isReset, dispatch } = useView()
  return (
    <Button
      variant="default"
      size="tiny"
      icon={<Maximize2 />}
      disabled={isReset}
      data-trace-reset-zoom
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) dispatch({ type: 'setWindow', window: null })
      }}
      {...props}
    >
      {children ?? 'Reset zoom'}
    </Button>
  )
}
