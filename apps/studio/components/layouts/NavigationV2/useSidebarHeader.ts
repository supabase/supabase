import { useParams } from 'common'
import { useRouter } from 'next/router'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { useSidebar } from 'ui'

import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { IS_PLATFORM, PROJECT_STATUS } from '@/lib/constants'

export type SidebarHeaderProps = {
  variant: 'desktop' | 'mobile-sheet'
  scope?: 'project' | 'organization'
}

export function useSidebarHeader({ variant, scope: scopeProp }: SidebarHeaderProps) {
  const { state, isMobile } = useSidebar()
  const [, setShowConnect] = useQueryState('showConnect', parseAsBoolean.withDefault(false))
  const router = useRouter()
  const { slug: orgRouteSlug } = useParams()
  const { data: selectedOrganization } = useSelectedOrganizationQuery()
  const { data: project } = useSelectedProjectQuery()

  const resolvedScope =
    scopeProp ?? (router.pathname.startsWith('/project') ? 'project' : 'organization')
  const isProjectScope = resolvedScope === 'project'
  const isActiveHealthy = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  const shouldShowOrgSelector =
    !isProjectScope && IS_PLATFORM && (Boolean(orgRouteSlug) || Boolean(selectedOrganization))

  const selectorHeaderClass = 'flex-col gap-2 hidden md:flex'
  const isCollapsedRail = variant === 'desktop' && state === 'collapsed' && !isMobile

  return {
    setShowConnect,
    isProjectScope,
    isActiveHealthy,
    shouldShowOrgSelector,
    selectorHeaderClass,
    isCollapsedRail,
  }
}
