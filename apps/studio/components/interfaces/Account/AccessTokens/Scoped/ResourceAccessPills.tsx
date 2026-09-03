import { Box, Boxes } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from 'ui'

import { OrganizationsData } from '@/data/organizations/organizations-query'
import { useProjectDetailQuery } from '@/data/projects/project-detail-query'

export interface ResourceAccessPillItem {
  key: string
  label: string
  isInaccessible?: boolean
}

export const OrganizationAccessPill = ({
  slug,
  organization,
}: {
  slug: string
  organization: OrganizationsData[number] | undefined
}) => {
  const isInaccessible = organization == null
  return (
    <div
      className={cn(
        'flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border bg-surface-75 text-foreground-light px-3 py-1 text-xs',
        isInaccessible ? 'border-destructive-500 text-destructive' : 'border-strong text-foreground'
      )}
    >
      <Boxes size={14} strokeWidth={1.5} className="shrink-0 text-foreground-lighter" />
      {organization?.name ?? slug}{' '}
      {isInaccessible ? <span className="sr-only">(innaccessible)</span> : null}
    </div>
  )
}

export const ProjectAccessPill = ({ projectRef }: { projectRef: string }) => {
  const { data, isPending } = useProjectDetailQuery({ ref: projectRef })
  const isInaccessible = data == null && !isPending
  return (
    <div
      className={cn(
        'flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border bg-surface-75 text-foreground-light px-3 py-1 text-xs',
        isInaccessible ? 'border-destructive-500 text-destructive' : 'border-strong text-foreground'
      )}
    >
      <Box size={14} strokeWidth={1.5} className="shrink-0 text-foreground-lighter" />
      {data?.name ?? projectRef}{' '}
      {isInaccessible ? <span className="sr-only">(innaccessible)</span> : null}
    </div>
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
