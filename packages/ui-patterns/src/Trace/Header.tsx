'use client'

import { ChevronsDownUp, ChevronsUpDown, Maximize2 } from 'lucide-react'
import type { ComponentProps } from 'react'
import { Badge, Button, cn } from 'ui'

import { useTrace, useView } from './Trace'
import { areAllCollapsed } from './utils'

export function Header({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-trace-header
      className={cn('flex flex-wrap items-center gap-2', className)}
      {...props}
    />
  )
}

export function Title() {
  const { roots, byId } = useTrace()
  const root = roots.length > 0 ? byId.get(roots[0]) : undefined

  return (
    <h2 data-trace-title className="truncate text-sm font-medium text-foreground">
      {root?.name ?? 'Trace'}
    </h2>
  )
}

export function Status() {
  const { roots, byId, isLive } = useTrace()
  const root = roots.length > 0 ? byId.get(roots[0]) : undefined
  const label = isLive ? 'Live' : root?.status === 'error' ? 'Failed' : 'Done'
  const variant = isLive ? 'success' : root?.status === 'error' ? 'destructive' : 'default'

  return (
    <>
      <Badge variant={variant} data-trace-status>
        {label}
      </Badge>
      <span role="status" aria-live="polite" className="sr-only">
        {label}
      </span>
    </>
  )
}

export function CollapseAll() {
  const index = useTrace()
  const { collapsed, toggleCollapseAll } = useView()
  const allCollapsed = areAllCollapsed(index, collapsed)

  return (
    <Button
      variant="text"
      size="tiny"
      className="size-6 p-0"
      disabled={index.childrenOf.size === 0}
      icon={allCollapsed ? <ChevronsUpDown /> : <ChevronsDownUp />}
      aria-label={allCollapsed ? 'Expand all' : 'Collapse all'}
      title={allCollapsed ? 'Expand all' : 'Collapse all'}
      data-trace-collapse-all
      onClick={toggleCollapseAll}
    />
  )
}

export function ResetZoom() {
  const { isZoomed, resetWindow } = useView()

  return (
    <Button
      variant="text"
      size="tiny"
      className="size-6 p-0"
      disabled={!isZoomed}
      icon={<Maximize2 />}
      aria-label="Reset zoom"
      title="Reset zoom"
      data-trace-reset-zoom
      onClick={resetWindow}
    />
  )
}
