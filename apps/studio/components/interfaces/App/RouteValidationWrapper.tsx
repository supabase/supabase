import { useMatches, useNavigate } from '@tanstack/react-router'
import { useIsLoggedIn, useIsMFAEnabled, useParams } from 'common'
import { PropsWithChildren, useEffect } from 'react'
import { toast } from 'sonner'

import { MCP_SECRETS_ROUTE } from '@/components/interfaces/MCP/Secrets/McpSecrets.constants'
import { useOrganizationsQuery } from '@/data/organizations/organizations-query'
import { useProjectDetailQuery } from '@/data/projects/project-detail-query'
import { useDashboardHistory } from '@/hooks/misc/useDashboardHistory'
import { useLastVisitedOrganization } from '@/hooks/misc/useLastVisitedOrganization'
import { useLatest } from '@/hooks/misc/useLatest'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { IS_PLATFORM } from '@/lib/constants'

export const RouteValidationWrapper = ({ children }: PropsWithChildren<{}>) => {
  const navigate = useNavigate()
  // leaf route pattern, e.g. `/project/$ref/sql/$id` (index routes without the trailing slash)
  const routePattern = useMatches({
    select: (matches) => matches.at(-1)?.fullPath.replace(/(.)\/$/, '$1') ?? '',
  })
  const { ref, slug, id } = useParams()
  const { data: organization } = useSelectedOrganizationQuery()

  const isLoggedIn = useIsLoggedIn()
  const isUserMFAEnabled = useIsMFAEnabled()

  const { setLastVisitedSnippet, setLastVisitedTable, setLastVisitedExplorerTab } =
    useDashboardHistory()
  const { lastVisitedOrganization, setLastVisitedOrganization } = useLastVisitedOrganization()

  const DEFAULT_HOME = IS_PLATFORM
    ? !!lastVisitedOrganization
      ? `/org/${lastVisitedOrganization}`
      : '/organizations'
    : '/project/default'

  /**
   * Array of urls/routes that should be ignored
   */
  const excemptUrls: string[] = [
    // project creation route, allows the page to self determine it's own route, it will redirect to the first org
    // or prompt the user to create an organaization
    // this is used by database.dev, usually as /new/new-project
    '/new/$slug',
    '/join',
    MCP_SECRETS_ROUTE,
  ]

  /**
   * Map through all the urls that are excluded
   * from route validation check
   *
   * @returns a boolean
   */
  function isExceptUrl() {
    return excemptUrls.includes(routePattern)
  }

  const { isError: isErrorProject, error: projectError } = useProjectDetailQuery({ ref })

  const { data: organizations, isSuccess: orgsInitialized } = useOrganizationsQuery({
    enabled: isLoggedIn,
  })
  const organizationsRef = useLatest(organizations)

  useEffect(() => {
    // check if current route is excempted from route validation check
    if (isExceptUrl() || !isLoggedIn) return

    if (orgsInitialized && slug) {
      // Check validity of organization that user is trying to access
      const organizations = organizationsRef.current ?? []
      const isValidOrg = organizations.some((org) => org.slug === slug)

      if (!isValidOrg) {
        toast.error('You do not have access to this organization')
        void navigate({ href: DEFAULT_HOME })
        return
      }
    }
  }, [orgsInitialized])

  useEffect(() => {
    // check if current route is excempted from route validation check
    if (isExceptUrl() || !isLoggedIn) return

    // A successful request to project details will validate access to both project and branches
    if (!!ref && isErrorProject) {
      // 404 means the project no longer exists (e.g. was deleted), not an access error
      if (projectError?.code !== 404) {
        toast.error('You do not have access to this project')
      }
      void navigate({ href: DEFAULT_HOME })
      return
    }
  }, [isErrorProject])

  useEffect(() => {
    if (ref !== undefined && id !== undefined) {
      if (routePattern.endsWith('/sql/$id') && id !== 'new') {
        setLastVisitedSnippet(id)
      } else if (routePattern.endsWith('/editor/$id')) {
        setLastVisitedTable(id)
      } else if (routePattern.endsWith('/explorer/notebook/$id')) {
        setLastVisitedExplorerTab({ type: 'notebook', id })
      } else if (routePattern.endsWith('/explorer/query/$id')) {
        setLastVisitedExplorerTab({ type: 'query', id })
      } else if (routePattern.endsWith('/explorer/chat/$id')) {
        setLastVisitedExplorerTab({ type: 'chat', id })
      }
    }
  }, [ref, id, routePattern, setLastVisitedSnippet, setLastVisitedTable, setLastVisitedExplorerTab])

  useEffect(() => {
    if (organization) {
      setLastVisitedOrganization(organization.slug)

      if (
        organization.organization_requires_mfa &&
        !isUserMFAEnabled &&
        routePattern !== '/org/$slug'
      ) {
        void navigate({ to: '/org/$slug', params: { slug: organization.slug } })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization])

  return <>{children}</>
}
