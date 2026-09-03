import { Box, Boxes } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Badge, cn } from 'ui'

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
    <Badge
      variant={isInaccessible ? 'destructive' : 'default'}
      className={cn('normal-case text-xs font-normal tracking-normal pr-2', {
        'border-destructive-500': isInaccessible,
        'text-foreground': !isInaccessible,
      })}
    >
      <Boxes
        size={14}
        strokeWidth={1.5}
        className={cn('shrink-0', {
          'text-foreground-lighter': !isInaccessible,
        })}
      />
      {organization?.name ?? slug}
      {isInaccessible ? <span> - revoked</span> : null}
    </Badge>
  )
}

export const ProjectAccessPill = ({ projectRef }: { projectRef: string }) => {
  const { data: project, isPending } = useProjectDetailQuery({ ref: projectRef })
  const isInaccessible = project == null && !isPending
  return (
    <Badge
      variant={isInaccessible ? 'destructive' : 'default'}
      className={cn('normal-case text-xs font-normal tracking-normal pr-2', {
        'border-destructive-500': isInaccessible,
        'text-foreground': !isInaccessible,
      })}
    >
      <Box
        size={14}
        strokeWidth={1.5}
        className={cn('shrink-0', {
          'text-foreground-lighter': !isInaccessible,
        })}
      />
      {project?.name ?? projectRef}
      {isInaccessible ? <span> - revoked</span> : null}
    </Badge>
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
