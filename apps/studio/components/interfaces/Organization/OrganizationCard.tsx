import { useIsMFAEnabled } from 'common'
import { Boxes, Lock } from 'lucide-react'
import Link from 'next/link'
import { Fragment } from 'react'
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
}: {
  organization: Organization
  href?: string
  isLink?: boolean
  className?: string
  onClick?: () => void
}) => {
  const isUserMFAEnabled = useIsMFAEnabled()
  const isPlatformOrg = organization.plan?.id === 'platform'
  const { data } = useOrgProjectsInfiniteQuery(
    { slug: organization.slug },
    { enabled: !isPlatformOrg }
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
      }
    />
  )

  if (isLink) {
    return <Link href={href ?? `/org/${organization.slug}`}>{renderContent()}</Link>
  } else {
    return <Fragment>{renderContent()}</Fragment>
  }
}
