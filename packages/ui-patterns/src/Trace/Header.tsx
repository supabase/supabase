'use client'

import { ChevronsDownUp, ChevronsUpDown, Maximize2 } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import { Badge, Button, cn, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from 'ui'

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

function ControlTooltip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex [&>button:disabled]:pointer-events-none">{children}</span>
        </TooltipTrigger>
        <TooltipContent side="bottom">{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function CollapseAll() {
  const index = useTrace()
  const { collapsed, toggleCollapseAll } = useView()
  const allCollapsed = areAllCollapsed(index, collapsed)

  const label = allCollapsed ? 'Expand all' : 'Collapse all'

  return (
    <ControlTooltip label={label}>
      <Button
        variant="text"
        size="tiny"
        className="size-6 p-0"
        disabled={index.childrenOf.size === 0}
        icon={allCollapsed ? <ChevronsUpDown /> : <ChevronsDownUp />}
        aria-label={label}
        data-trace-collapse-all
        onClick={toggleCollapseAll}
      />
    </ControlTooltip>
  )
}

export function ResetZoom() {
  const { isZoomed, resetWindow } = useView()

  return (
    <ControlTooltip label="Reset zoom">
      <Button
        variant="text"
        size="tiny"
        className="size-6 p-0"
        disabled={!isZoomed}
        icon={<Maximize2 />}
        aria-label="Reset zoom"
        data-trace-reset-zoom
        onClick={resetWindow}
      />
    </ControlTooltip>
  )
}
