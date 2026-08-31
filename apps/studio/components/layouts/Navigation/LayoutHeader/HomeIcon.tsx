import Link from 'next/link'
import { useRouter } from 'next/router'
import { cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import { useOrganizationsQuery } from '@/data/organizations/organizations-query'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useLastVisitedOrganization } from '@/hooks/misc/useLastVisitedOrganization'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { IS_PLATFORM } from '@/lib/constants'
import { useTrack } from '@/lib/telemetry/track'

export const HomeIcon = ({ className }: { className?: string }) => {
  const { data: selectedOrganization } = useSelectedOrganizationQuery()
  const { data: organizations } = useOrganizationsQuery()
  const track = useTrack()

  const largeLogo = useIsFeatureEnabled('branding:large_logo')

  const router = useRouter()
  const { lastVisitedOrganization } = useLastVisitedOrganization()

  const getDefaultOrgRedirect = () => {
    if (lastVisitedOrganization) return `/org/${lastVisitedOrganization}`
    if (selectedOrganization?.slug) return `/org/${selectedOrganization.slug}`
    if (organizations && organizations.length > 0) return `/org/${organizations[0].slug}`
    return '/organizations'
  }

  const href = IS_PLATFORM ? getDefaultOrgRedirect() : '/project/default'

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={href}
          onClick={() => track('header_home_logo_clicked')}
          className={cn('items-center justify-center shrink-0 flex', className)}
          tabIndex={0}
        >
          <img
            alt="Supabase"
            src={`${router.basePath}/img/supabase-logo.svg`}
            className={largeLogo ? 'h-[20px]' : 'h-[18px]'}
          />
          <span className="sr-only">Back to organization home</span>
        </Link>
      </TooltipTrigger>
      <TooltipContent aria-hidden>Back to organization home</TooltipContent>
    </Tooltip>
  )
}
