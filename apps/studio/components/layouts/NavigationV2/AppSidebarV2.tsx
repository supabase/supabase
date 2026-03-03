import { useFlag, useIsMFAEnabled, useParams } from 'common'
import {
  useIsColumnLevelPrivilegesEnabled,
  useUnifiedLogsPreview,
} from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { Connect } from 'components/interfaces/Connect/Connect'
import { ConnectSheet } from 'components/interfaces/ConnectSheet/ConnectSheet'
import { useIsETLPrivateAlpha } from 'components/interfaces/Database/Replication/useIsETLPrivateAlpha'
import { useInstalledIntegrations } from 'components/interfaces/Integrations/Landing/useInstalledIntegrations'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { usePHFlag } from 'hooks/ui/useFlag'
import { Home } from 'icons'
import { IS_PLATFORM, PROJECT_STATUS } from 'lib/constants'
import {
  Blocks,
  Boxes,
  ChartArea,
  Compass,
  Plug,
  Receipt,
  Search,
  Settings,
  Users,
} from 'lucide-react'
import { useRouter } from 'next/router'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { Button, Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from 'ui'
import { useSetCommandMenuOpen } from 'ui-patterns'

import { generateSettingsMenu } from '../ProjectSettingsLayout/SettingsMenu.utils'
import { NavGroup } from './NavGroup'
import {
  generateDatabaseNavItems,
  generateObservabilityNavItems,
  generatePlatformNavItems,
} from './NavigationV2.utils'
import { NavUser } from './NavUser'
import { OrgSelector } from './OrgSelector'
import { ProjectBranchSelector } from './ProjectBranchSelector'

export type AppSidebarScope = 'project' | 'organization'

interface AppSidebarV2Props {
  scope?: AppSidebarScope
}

export function AppSidebarV2({ scope }: AppSidebarV2Props = {}) {
  const router = useRouter()
  const { ref: projectRef, slug } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { data: selectedOrganization } = useSelectedOrganizationQuery()
  const setCommandMenuOpen = useSetCommandMenuOpen()
  const isUserMFAEnabled = useIsMFAEnabled()
  const [, setShowConnect] = useQueryState('showConnect', parseAsBoolean.withDefault(false))
  const connectSheetFlag = usePHFlag<string | boolean>('connectSheet')
  const isFlagResolved = connectSheetFlag !== undefined
  const isConnectSheetEnabled = connectSheetFlag === true || connectSheetFlag === 'variation'

  const currentScope =
    scope ?? (router.pathname.startsWith('/project') ? 'project' : 'organization')
  const isProjectScope = currentScope === 'project'

  const ref = projectRef ?? project?.ref ?? ''
  const organizationSlug = slug ?? (router.query.orgSlug as string | undefined) ?? ''

  const isActiveHealthy = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY
  const isProjectBuilding = project?.status === PROJECT_STATUS.COMING_UP

  // Database flags
  const { data: extensions } = useDatabaseExtensionsQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
    },
    {
      enabled: isProjectScope,
    }
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

  // Platform flags
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

  // Other flags
  const showReports = useIsFeatureEnabled('reports:all')
  const showBilling = useIsFeatureEnabled('billing:all')
  const { isEnabled: isUnifiedLogsEnabled } = useUnifiedLogsPreview()

  const disableAccessMfa =
    selectedOrganization?.organization_requires_mfa === true && !isUserMFAEnabled
  const buildOrgHref = (href: string) => (disableAccessMfa ? router.asPath : href)

  const projectSettingsItems =
    isProjectScope && ref
      ? generateSettingsMenu(ref, project, selectedOrganization)
          .flatMap((group) => {
            if (group.title === 'Billing' && !selectedOrganization?.slug) return []
            return group.items
          })
          .filter((item) => !item.disabled)
          .map((item) => ({
            title: item.name,
            url: item.url,
          }))
      : []

  const isProjectHome =
    router.pathname === `/project/[ref]` || router.pathname === `/project/${ref}`
  const isProjectSettings = router.pathname.includes('/settings')

  const projectItems = isProjectScope
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

  const databaseItems =
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

  const platformItems =
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

  const observabilityItems =
    isProjectScope && ref
      ? generateObservabilityNavItems(ref, project, {
          showReports,
          unifiedLogs: isUnifiedLogsEnabled,
          pathname: router.pathname,
        })
      : []

  const { installedIntegrations } = useInstalledIntegrations()

  const integrationsItems =
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
  const organizationItems =
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

  return (
    <>
      <Sidebar collapsible="none" className="h-full min-h-0 w-full border-r border-default group">
        <SidebarHeader className="gap-2 pt-4">
          <div className="space-y-2">
            {isProjectScope ? <ProjectBranchSelector /> : IS_PLATFORM ? <OrgSelector /> : null}
            {isProjectScope && (
              <div className="flex items-center gap-2 px-1.5">
                <Button
                  type="outline"
                  size="small"
                  onClick={() => {
                    setCommandMenuOpen(true)
                  }}
                  className="h-8 min-w-8 !w-8 px-0 justify-center text-foreground-lighter font-normal bg-transparent"
                  icon={<Search strokeWidth={1.5} />}
                />
                <Button
                  type="default"
                  size="small"
                  disabled={!isActiveHealthy}
                  onClick={() => {
                    setShowConnect(true)
                  }}
                  className="h-8 flex-1 justify-center gap-0 pl-2"
                  icon={<Plug className="rotate-90" strokeWidth={1.5} />}
                >
                  <span>Connect</span>
                </Button>
              </div>
            )}
          </div>
        </SidebarHeader>
        <div className="relative min-h-0 flex-1 overflow-hidden">
          <SidebarContent className="h-full gap-0">
            {isProjectScope ? (
              <>
                <NavGroup id="project" label="Project" items={projectItems} />
                <NavGroup id="database" label="Database" items={databaseItems} />
                <NavGroup id="platform" label="Platform" items={platformItems} />
                <NavGroup id="observability" label="Observability" items={observabilityItems} />
                <NavGroup id="integrations" label="Integrations" items={integrationsItems} />
              </>
            ) : (
              <NavGroup
                id="organization"
                label="Organization"
                items={organizationItems}
                isCollapsible={false}
              />
            )}
          </SidebarContent>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 z-10 h-4 bg-gradient-to-b from-sidebar to-transparent"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-4 bg-gradient-to-t from-sidebar to-transparent"
          />
        </div>
        <SidebarFooter>{IS_PLATFORM && <NavUser />}</SidebarFooter>
      </Sidebar>

      {isProjectScope && isFlagResolved ? (
        isConnectSheetEnabled ? (
          <ConnectSheet />
        ) : (
          <Connect />
        )
      ) : null}
    </>
  )
}
