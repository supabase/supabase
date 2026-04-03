import { IS_PLATFORM } from 'lib/constants'
import { Plug, Search } from 'lucide-react'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { Button, Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from 'ui'
import { useSetCommandMenuOpen } from 'ui-patterns'

import { OrgSelector } from '../Navigation/NavigationBar/OrgSelector'
import { ProjectBranchSelector } from '../Navigation/NavigationBar/ProjectBranchSelector'
import { NavGroup } from './NavGroup'
import { NavUser } from './NavUser'
import { useAppSidebarNavItems, type AppSidebarScope } from './useAppSidebarNavItems'
import { ConnectSheet } from '@/components/interfaces/ConnectSheet/ConnectSheet'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'

export type { AppSidebarScope }

interface AppSidebarV2Props {
  scope?: AppSidebarScope
}

export function AppSidebarV2({ scope }: AppSidebarV2Props = {}) {
  const setCommandMenuOpen = useSetCommandMenuOpen()
  const [, setShowConnect] = useQueryState('showConnect', parseAsBoolean.withDefault(false))
  const { data: selectedOrganization } = useSelectedOrganizationQuery()

  const {
    isProjectScope,
    isActiveHealthy,
    projectItems,
    databaseItems,
    platformItems,
    observabilityItems,
    integrationsItems,
    organizationItems,
  } = useAppSidebarNavItems({ scope })

  return (
    <>
      <Sidebar
        collapsible="none"
        className="hidden md:flex h-full w-full border-r border-default group"
      >
        <SidebarHeader className="gap-2 pt-2">
          <div className="space-y-2">
            {isProjectScope ? <ProjectBranchSelector /> : IS_PLATFORM ? <OrgSelector /> : null}
            {isProjectScope && (
              <div className="flex items-center gap-2 px-1.5">
                <Button
                  type="outline"
                  size="small"
                  onClick={() => setCommandMenuOpen(true)}
                  className="h-8 min-w-8 !w-8 px-0 justify-center text-foreground-lighter font-normal bg-transparent"
                  icon={<Search strokeWidth={1.5} />}
                />
                <Button
                  type="default"
                  size="small"
                  disabled={!isActiveHealthy}
                  onClick={() => setShowConnect(true)}
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
            ) : selectedOrganization ? (
              <NavGroup
                id="organization"
                label="Organization"
                items={organizationItems}
                isCollapsible={false}
              />
            ) : null}
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

      <ConnectSheet />
    </>
  )
}
