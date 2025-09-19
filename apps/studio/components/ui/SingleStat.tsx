import Link from 'next/link'
import type { ReactNode } from 'react'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import type { HomeActivityStatClickedEvent } from 'common/telemetry-constants'

type SingleStatProps = {
  icon: ReactNode
  label: ReactNode
  value: ReactNode
  className?: string
  href?: string
  onClick?: () => void
  trackingAction?: 'home_activity_stat_clicked'
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
  trackingAction,
  trackingProperties,
}: SingleStatProps) => {
  const { mutate: sendEvent } = useSendEventMutation()
  const { data: project } = useSelectedProjectQuery()
  const { data: organization } = useSelectedOrganizationQuery()

  const handleClick = () => {
    if (onClick) onClick()
    if (
      trackingAction === 'home_activity_stat_clicked' &&
      trackingProperties &&
      project?.ref &&
      organization?.slug
    ) {
      const event: HomeActivityStatClickedEvent = {
        action: 'home_activity_stat_clicked',
        properties: trackingProperties,
        groups: {
          project: project.ref,
          organization: organization.slug,
        },
      }
      sendEvent(event)
    }
  }
  const content = (
    <div className={`group flex items-center gap-4 p-0 text-base justify-start ${className || ''}`}>
      <div className="w-16 h-16 rounded-md bg-surface-75 group-hover:bg-muted border flex items-center justify-center">
        {icon}
      </div>
      <div>
        <div className="text-left heading-meta text-foreground-light">{label}</div>
        <div className="text-foreground truncate h-[34px] flex items-center capitalize-sentence">
          {value}
        </div>
      </div>
    </div>
  )

  if (href) {
    return (
      <Link
        className="group block"
        href={href}
        onClick={() => {
          if (
            trackingAction === 'home_activity_stat_clicked' &&
            trackingProperties &&
            project?.ref &&
            organization?.slug
          ) {
            const event: HomeActivityStatClickedEvent = {
              action: 'home_activity_stat_clicked',
              properties: trackingProperties,
              groups: {
                project: project.ref,
                organization: organization.slug,
              },
            }
            sendEvent(event)
          }
        }}
      >
        {content}
      </Link>
    )
  }

  if (onClick) {
    return (
      <button className="group" onClick={handleClick}>
        {content}
      </button>
    )
  }

  return content
}
