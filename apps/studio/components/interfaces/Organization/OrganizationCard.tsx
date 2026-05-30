import { useIsMFAEnabled } from 'common'
import { Boxes, Lock, Plus } from 'lucide-react'
import Link from 'next/link'
import { Fragment, type ReactNode } from 'react'
import { cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import { ActionCard } from '@/components/ui/ActionCard'
import PartnerIcon from '@/components/ui/PartnerIcon'
import { useOrgProjectsInfiniteQuery } from '@/data/projects/org-projects-infinite-query'
import type { Organization } from '@/types'

export const OrganizationCard = ({
  organization,
  href,
  isLink = true,
  className,
  onClick,
  description,
}: {
  organization: Organization
  href?: string
  isLink?: boolean
  className?: string
  onClick?: () => void
  description?: ReactNode
}) => {
  const isUserMFAEnabled = useIsMFAEnabled()
  const isPlatformOrg = organization.plan?.id === 'platform'
  const shouldRenderDefaultDescription = description === undefined
  const { data } = useOrgProjectsInfiniteQuery(
    { slug: organization.slug },
    { enabled: !isPlatformOrg && shouldRenderDefaultDescription }
  )
  const numProjects = data?.pages[0].pagination.count ?? 0
  const isMfaRequired = organization.organization_requires_mfa

  const renderContent = () => (
    <ActionCard
      bgColor="bg border"
      className={cn(
        'flex items-center min-h-[70px] [&>div]:w-full [&>div]:items-center max-h-min',
        className
      )}
      icon={<Boxes size={18} strokeWidth={1} className="text-foreground" />}
      title={organization.name}
      onClick={onClick}
      description={
        shouldRenderDefaultDescription ? (
          <div className="flex items-center justify-between text-xs text-foreground-light font-sans">
            <div className="flex items-center gap-x-1">
              <span>{organization.plan.name} Plan</span>
              {numProjects > 0 && (
                <>
                  <span className="text-foreground-lighter">·</span>
                  <span>
                    {numProjects} project{numProjects > 1 ? 's' : ''}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-x-2">
              <PartnerIcon organization={organization} />
              {isMfaRequired && (
                <Tooltip>
                  <TooltipTrigger className="cursor-default">
                    <Lock size={12} />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className={!isUserMFAEnabled ? 'w-80' : ''}>
                    MFA enforced
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        ) : (
          description
        )
      }
    />
  )

  if (isLink) {
    return <Link href={href ?? `/org/${organization.slug}`}>{renderContent()}</Link>
  } else {
    return <Fragment>{renderContent()}</Fragment>
  }
}

export const CreateOrganizationCard = ({
  params = {},
  label = 'Create new organization',
  onClick,
  disabled,
}: {
  params?: { [key: string]: string }
  label?: string
  onClick?: () => void
  disabled?: boolean
}) => {
  const createOrganizationHref = `/new${Object.keys(params).length > 0 ? `?${new URLSearchParams(params).toString()}` : ''}`
  const card = (
    <ActionCard
      bgColor="bg border"
      className={cn(
        'flex items-center min-h-[70px] [&>div]:w-full [&>div]:items-center max-h-min',
        'border-dashed shadow-none transition-colors group-hover:border-default group-hover:bg-surface-200'
      )}
      icon={<Plus size={18} strokeWidth={1} className="text-foreground" />}
      title={label}
    />
  )

  if (onClick) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className={cn(
          'group block w-full cursor-pointer text-left disabled:cursor-not-allowed disabled:opacity-50',
          disabled && 'pointer-events-none'
        )}
      >
        {card}
      </button>
    )
  }

  return (
    <Link href={createOrganizationHref} className="group block">
      {card}
    </Link>
  )
}
