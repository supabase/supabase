import { Box, Boxes } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from 'ui'

import type { ResourceAccessMode } from '../AccessToken.permissions'

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

/** The org/project badges in a token summary's "Resource access" row. */
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

/**
 * Whether the pill container has wrapped onto multiple lines. Vertically centering the row only
 * reads right when its badges fit on a single line — with wrapped badges the label should sit at
 * the top instead. Measured, not guessed from item count, since wrapping depends on the sheet's
 * width and each badge's label length.
 */
export const useResourceAccessWrap = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isWrapped, setIsWrapped] = useState(false)

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

  return { containerRef, isWrapped }
}
