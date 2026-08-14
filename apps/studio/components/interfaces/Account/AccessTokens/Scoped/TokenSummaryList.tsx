import { Box, Boxes } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from 'ui'

import type { ResourceAccessMode } from '../AccessToken.permissions'

/**
 * Shared "Token summary" presentation for the token view sheet and the creation review step, so
 * reviewing a token before creating it looks identical to viewing it afterwards.
 */

export interface TokenSummaryRow {
  key: string
  label: string
  value: ReactNode
  /** Badge-list values that can wrap onto multiple lines — the row top-aligns once wrapped. */
  isWrappable?: boolean
}

export interface ResourceAccessPillItem {
  key: string
  label: string
  isInaccessible?: boolean
}

interface ResourceAccessPillsProps {
  resourceAccess: ResourceAccessMode
  items: ResourceAccessPillItem[]
  /** Shown when there are no items — only the caller knows why the list is empty. */
  emptyText?: string
}

export const ResourceAccessPills = ({
  resourceAccess,
  items,
  emptyText = '-',
}: ResourceAccessPillsProps) => {
  if (items.length === 0) {
    return <span className="text-sm text-foreground-lighter">{emptyText}</span>
  }

  return (
    <>
      {items.map((item) => (
        <div
          key={item.key}
          className={cn(
            'flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border bg-surface-75 text-foreground-light px-3 py-1 text-sm',
            item.isInaccessible
              ? 'border-destructive-500 text-destructive'
              : 'border-strong text-foreground'
          )}
        >
          {resourceAccess === 'organization' ? (
            <Boxes size={14} strokeWidth={1.5} className="shrink-0 text-foreground-lighter" />
          ) : resourceAccess === 'project' ? (
            <Box size={14} strokeWidth={1.5} className="shrink-0 text-foreground-lighter" />
          ) : null}
          {item.label}
        </div>
      ))}
    </>
  )
}

const WrappableSummaryRow = ({ label, children }: { label: string; children: ReactNode }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isWrapped, setIsWrapped] = useState(false)

  // Vertically centering the row only reads right when its badges fit on a single line — with
  // wrapped badges the label should sit at the top instead. Measured, not guessed from item count,
  // since wrapping depends on the sheet's width and each badge's label length.
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const checkWrapped = () => {
      const firstBadge = container.firstElementChild as HTMLElement | null
      setIsWrapped(firstBadge !== null && container.clientHeight > firstBadge.clientHeight + 2)
    }

    checkWrapped()
    const observer = new ResizeObserver(checkWrapped)
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      className={cn(
        'flex flex-col items-start justify-between gap-4 px-4 py-3 sm:flex-row',
        isWrapped ? 'sm:items-start' : 'sm:items-center'
      )}
    >
      <dt className="shrink-0 text-sm text-foreground-lighter">{label}</dt>
      <dd className="w-full min-w-0 text-sm text-foreground sm:w-auto sm:flex-1">
        <div ref={containerRef} className="flex flex-wrap justify-start gap-1.5 sm:justify-end">
          {children}
        </div>
      </dd>
    </div>
  )
}

export const TokenSummaryList = ({ rows }: { rows: TokenSummaryRow[] }) => (
  <dl className="divide-y rounded-md border bg-surface-300">
    {rows.map((row) =>
      row.isWrappable ? (
        <WrappableSummaryRow key={row.key} label={row.label}>
          {row.value}
        </WrappableSummaryRow>
      ) : (
        <div key={row.key} className="flex items-center justify-between gap-4 px-4 py-3">
          <dt className="shrink-0 text-sm text-foreground-lighter">{row.label}</dt>
          <dd className="text-sm text-foreground">{row.value}</dd>
        </div>
      )
    )}
  </dl>
)
