import { useIsMFAEnabled } from 'common'
import { ActionCard } from 'components/ui/ActionCard'
import { useOrgProjectsInfiniteQuery } from 'data/projects/org-projects-infinite-query'
import { Boxes, Lock } from 'lucide-react'
import Link from 'next/link'
import { Fragment } from 'react'
import type { Organization } from 'types'
import { cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

export const OrganizationCard = ({
  organization,
  href,
  isLink = true,
  className,
}: {
  organization: Organization
  href?: string
  isLink?: boolean
  className?: string
}) => {
  const isUserMFAEnabled = useIsMFAEnabled()
  const { data } = useOrgProjectsInfiniteQuery({ slug: organization.slug })
  const numProjects = data?.pages[0].pagination.count ?? 0
  const isMfaRequired = organization.organization_requires_mfa

  const renderContent = () => (
    <ActionCard
      bgColor="bg border"
      className={cn(
        'flex items-center min-h-[70px] [&>div]:w-full [&>div]:items-center',
        className
      )}
      icon={<Boxes size={18} strokeWidth={1} className="text-foreground" />}
      title={organization.name}
      description={
        <div className="flex items-center justify-between text-xs text-foreground-light font-sans">
          <div className="flex items-center gap-x-1.5">
            <span>{organization.plan.name} Plan</span>
            {numProjects > 0 && (
              <>
                <span>•</span>
                <span>
                  {numProjects} project{numProjects > 1 ? 's' : ''}
                </span>
              </>
            )}
          </div>
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
      }
    />
  )

  if (isLink) {
    return <Link href={href ?? `/org/${organization.slug}`}>{renderContent()}</Link>
  } else {
    return <Fragment>{renderContent()}</Fragment>
  }
}
