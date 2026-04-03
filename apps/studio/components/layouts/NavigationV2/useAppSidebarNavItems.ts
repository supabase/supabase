import { useFlag, useIsMFAEnabled, useParams } from 'common'
import {
  useIsColumnLevelPrivilegesEnabled,
  useUnifiedLogsPreview,
} from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { useIsETLPrivateAlpha } from 'components/interfaces/Database/Replication/useIsETLPrivateAlpha'
import { useInstalledIntegrations } from 'components/interfaces/Integrations/Landing/useInstalledIntegrations'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Home } from 'icons'
import { IS_PLATFORM, PROJECT_STATUS } from 'lib/constants'
import { Blocks, Boxes, ChartArea, Compass, Receipt, Settings, Users } from 'lucide-react'
import { useRouter } from 'next/router'

import { useGenerateSettingsMenu } from '../ProjectSettingsLayout/SettingsMenu.utils'
import type { NavGroupItem } from './NavGroup'
import {
  generateDatabaseNavItems,
  generateObservabilityNavItems,
  generatePlatformNavItems,
} from './Navigation.utils'

export type AppSidebarScope = 'project' | 'organization'

export interface UseAppSidebarNavItemsParams {
  scope?: AppSidebarScope
}

export interface UseAppSidebarNavItemsResult {
  ref: string
  organizationSlug: string
  isProjectScope: boolean
  isActiveHealthy: boolean
  isProjectBuilding: boolean
  projectItems: NavGroupItem[]
  databaseItems: NavGroupItem[]
  platformItems: NavGroupItem[]
  observabilityItems: NavGroupItem[]
  integrationsItems: NavGroupItem[]
  organizationItems: NavGroupItem[]
}

export function useAppSidebarNavItems(
  params: UseAppSidebarNavItemsParams = {}
): UseAppSidebarNavItemsResult {
  const router = useRouter()
  const { ref: projectRef, slug } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { data: selectedOrganization } = useSelectedOrganizationQuery()
  const isUserMFAEnabled = useIsMFAEnabled()

  const currentScope: AppSidebarScope =
    params.scope ?? (router.pathname.startsWith('/project') ? 'project' : 'organization')
  const isProjectScope = currentScope === 'project'

  const ref = projectRef ?? project?.ref ?? ''
  const organizationSlug = slug ?? (router.query.orgSlug as string | undefined) ?? ''

  const isActiveHealthy = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY
  const isProjectBuilding = project?.status === PROJECT_STATUS.COMING_UP

  const settingsMenu = useGenerateSettingsMenu()

  const { data: extensions } = useDatabaseExtensionsQuery(
    { projectRef: project?.ref, connectionString: project?.connectionString },
    { enabled: isProjectScope }
  )
  const { data: addons } = useProjectAddonsQuery(
    { projectRef: project?.ref },
    { enabled: isProjectScope }
  )

  const pgNetExtensionExists = (extensions ?? []).find((ext) => ext.name === 'pg_net') !== undefined
  const pitrEnabled = addons?.selected_addons.find((addon) => addon.type === 'pitr') !== undefined

  const columnLevelPrivileges = useIsColumnLevelPrivilegesEnabled()
  const enablePgReplicate = useIsETLPrivateAlpha()

  const {
    databaseReplication: showPgReplicate,
    databaseRoles: showRoles,
    integrationsWrappers: showWrappers,
  } = useIsFeatureEnabled(['database:replication', 'database:roles', 'integrations:wrappers'])

  const {
    projectAuthAll: authEnabled,
    projectEdgeFunctionAll: edgeFunctionsEnabled,
    projectStorageAll: storageEnabled,
    realtimeAll: realtimeEnabled,
  } = useIsFeatureEnabled([
    'project_auth:all',
    'project_edge_function:all',
    'project_storage:all',
    'realtime:all',
  ])

  const authOverviewPageEnabled = useFlag('authOverviewPage')
  const showReports = useIsFeatureEnabled('reports:all')
  const showBilling = useIsFeatureEnabled('billing:all')
  const { isEnabled: isUnifiedLogsEnabled } = useUnifiedLogsPreview()

  const disableAccessMfa =
    selectedOrganization?.organization_requires_mfa === true && !isUserMFAEnabled
  const buildOrgHref = (href: string) => (disableAccessMfa ? router.asPath : href)

  const projectSettingsItems =
    isProjectScope && ref
      ? settingsMenu
          .flatMap((group) => {
            if (group.title === 'Billing' && !selectedOrganization?.slug) return []
            return group.items
          })
          .filter((item) => !item.disabled)
          .map((item) => ({ title: item.name, url: item.url }))
      : []

  const isProjectHome =
    router.pathname === `/project/[ref]` || router.pathname === `/project/${ref}`
  const isProjectSettings = router.pathname.includes('/settings')

  const projectItems: NavGroupItem[] = isProjectScope
    ? [
        {
          title: 'Home',
          url: ref ? `/project/${ref}` : '/project',
          icon: Home,
          isActive: isProjectHome,
        },
        {
          title: 'Project Settings',
          url:
            ref && IS_PLATFORM
              ? `/project/${ref}/settings/general`
              : ref
                ? `/project/${ref}/settings/log-drains`
                : '/project',
          icon: Settings,
          items: projectSettingsItems.map((item) => ({
            ...item,
            isActive: router.pathname.includes(item.url),
          })),
          isActive: isProjectSettings,
        },
      ]
    : []

  const databaseItems: NavGroupItem[] =
    isProjectScope && ref
      ? generateDatabaseNavItems(ref, project, {
          pgNetExtensionExists,
          pitrEnabled,
          columnLevelPrivileges,
          showPgReplicate,
          enablePgReplicate,
          showRoles,
          showWrappers,
          pathname: router.pathname,
        })
      : []

  const platformItems: NavGroupItem[] =
    isProjectScope && ref
      ? generatePlatformNavItems(ref, project, {
          authEnabled,
          edgeFunctionsEnabled,
          storageEnabled,
          realtimeEnabled,
          authOverviewPageEnabled,
          pathname: router.pathname,
        })
      : []

  const observabilityItems: NavGroupItem[] =
    isProjectScope && ref
      ? generateObservabilityNavItems(ref, project, {
          showReports,
          unifiedLogs: isUnifiedLogsEnabled,
          pathname: router.pathname,
        })
      : []

  const { installedIntegrations } = useInstalledIntegrations()

  const integrationsItems: NavGroupItem[] =
    isProjectScope && ref
      ? [
          {
            title: 'Explore',
            url: isProjectBuilding ? `/project/${ref}` : `/project/${ref}/integrations`,
            icon: Compass,
            isActive:
              router.pathname === `/project/[ref]/integrations` ||
              (router.pathname.includes('/integrations') &&
                !installedIntegrations.some((int) =>
                  router.pathname.includes(`/integrations/${int.id}`)
                )),
          },
          ...installedIntegrations.map((integration) => ({
            title: integration.name,
            label: integration.status,
            url: `/project/${ref}/integrations/${integration.id}/overview`,
            icon: Blocks,
            isActive: router.pathname.includes(`/integrations/${integration.id}`),
          })),
        ]
      : []

  const activeOrganizationRoute = router.pathname.split('/')[3]

  const organizationItems: NavGroupItem[] =
    organizationSlug.length > 0
      ? [
          {
            title: 'Projects',
            url: buildOrgHref(`/org/${organizationSlug}`),
            icon: Boxes,
            isActive: activeOrganizationRoute === undefined,
          },
          {
            title: 'Team',
            url: buildOrgHref(`/org/${organizationSlug}/team`),
            icon: Users,
            isActive: activeOrganizationRoute === 'team',
          },
          {
            title: 'Integrations',
            url: buildOrgHref(`/org/${organizationSlug}/integrations`),
            icon: Blocks,
            isActive: activeOrganizationRoute === 'integrations',
          },
          {
            title: 'Usage',
            url: buildOrgHref(`/org/${organizationSlug}/usage`),
            icon: ChartArea,
            isActive: activeOrganizationRoute === 'usage',
          },
          ...(showBilling
            ? [
                {
                  title: 'Billing',
                  url: buildOrgHref(`/org/${organizationSlug}/billing`),
                  icon: Receipt,
                  isActive: activeOrganizationRoute === 'billing',
                },
              ]
            : []),
          {
            title: 'Organization Settings',
            url: buildOrgHref(`/org/${organizationSlug}/general`),
            icon: Settings,
            isActive:
              router.pathname.includes('/general') ||
              router.pathname.includes('/apps') ||
              router.pathname.includes('/audit') ||
              router.pathname.includes('/documents') ||
              router.pathname.includes('/security') ||
              router.pathname.includes('/sso'),
          },
        ]
      : []

  return {
    ref,
    organizationSlug,
    isProjectScope,
    isActiveHealthy,
    isProjectBuilding,
    projectItems,
    databaseItems,
    platformItems,
    observabilityItems,
    integrationsItems,
    organizationItems,
  }
}
