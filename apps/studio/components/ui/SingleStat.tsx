import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { cn } from 'ui'

type SingleStatProps = {
  icon: ReactNode
  label: ReactNode
  value: ReactNode
  className?: string
  href?: string
  onClick?: () => void
  trackingProperties?: {
    stat_type: 'migrations' | 'backups' | 'branches'
    stat_value: number
  }
}

export const SingleStat = ({
  icon,
  label,
  value,
  className,
  href,
  onClick,
  trackingProperties,
}: SingleStatProps) => {
  const { mutate: sendEvent } = useSendEventMutation()
  const { data: project } = useSelectedProjectQuery()
  const { data: organization } = useSelectedOrganizationQuery()

  const trackActivityStat = () => {
    if (trackingProperties && project?.ref && organization?.slug) {
      sendEvent({
        action: 'home_activity_stat_clicked',
        properties: trackingProperties,
        groups: {
          project: project.ref,
          organization: organization.slug,
        },
      })
    }
  }
  const content = (
    <div className={cn('group flex items-center gap-4 p-0 text-base justify-start', className)}>
      <div className="min-w-16 w-16 h-16 rounded-md bg-surface-75 group-hover:bg-muted border flex items-center justify-center">
        {icon}
      </div>
      <div className="truncate">
        <div className="text-left heading-meta text-foreground-light">{label}</div>
        <div className="text-foreground truncate h-[34px] flex items-center capitalize-sentence">
          {value}
        </div>
      </div>
    </div>
  )

  if (href) {
    return (
      <Link className="group block" href={href} onClick={trackActivityStat}>
        {content}
      </Link>
    )
  }

  if (onClick) {
    return (
      <button className="group" onClick={onClick}>
        {content}
      </button>
    )
  }

  return content
}
