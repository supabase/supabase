import Link from 'next/link'
import type { ReactNode } from 'react'
import { cn } from 'ui'

import { useSendEventMutation } from '@/data/telemetry/send-event-mutation'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

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
    <div
      className={cn('group flex items-center gap-4 p-0 text-base justify-start min-w-0', className)}
    >
      <div className="min-w-16 w-16 h-16 rounded-md bg-surface-75 group-hover:bg-muted border flex items-center justify-center">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-left heading-meta text-foreground-light">{label}</div>
        <div className="text-foreground min-h-[34px] flex items-center capitalize-sentence py-0.5">
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
