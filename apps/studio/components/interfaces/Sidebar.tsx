import { LOCAL_STORAGE_KEYS, useFlag, useIsMFAEnabled, useParams } from 'common'
import {
  generateOtherRoutes,
  generateProductRoutes,
  generateSettingsRoutes,
  generateToolRoutes,
} from 'components/layouts/ProjectLayout/NavigationBar/NavigationBar.utils'
import { ProjectIndexPageLink } from 'data/prefetchers/project.$ref'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { AnimatePresence, motion, MotionProps } from 'framer-motion'
import { useHideSidebar } from 'hooks/misc/useHideSidebar'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useLints } from 'hooks/misc/useLints'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Home } from 'icons'
import { isUndefined } from 'lodash'
import { Blocks, Boxes, ChartArea, PanelLeftDashed, Receipt, Settings, Users } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ComponentProps, ComponentPropsWithoutRef, FC, ReactNode, useEffect } from 'react'
import { useAppStateSnapshot } from 'state/app-state'
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Separator,
  SidebarContent as SidebarContentPrimitive,
  SidebarFooter,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  Sidebar as SidebarPrimitive,
  useSidebar,
} from 'ui'

import { Route } from '../ui/ui.types'
import {
  useIsAPIDocsSidePanelEnabled,
  useUnifiedLogsPreview,
} from './App/FeaturePreview/FeaturePreviewContext'

export const ICON_SIZE = 32
export const ICON_STROKE_WIDTH = 1.5
export type SidebarBehaviourType = 'expandable' | 'open' | 'closed'
export const DEFAULT_SIDEBAR_BEHAVIOR = 'expandable'

const SidebarMotion = motion.create(SidebarPrimitive) as FC<
  ComponentProps<typeof SidebarPrimitive> & {
    transition?: MotionProps['transition']
  }
>

export interface SidebarProps extends ComponentPropsWithoutRef<typeof SidebarPrimitive> {}

export const Sidebar = ({ className, ...props }: SidebarProps) => {
  const { setOpen } = useSidebar()
  const hideSideBar = useHideSidebar()

  const [sidebarBehaviour, setSidebarBehaviour] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.SIDEBAR_BEHAVIOR,
    DEFAULT_SIDEBAR_BEHAVIOR
  )

  useEffect(() => {
    // logic to toggle sidebar open based on sidebarBehaviour state
    if (sidebarBehaviour === 'open') setOpen(true)
    if (sidebarBehaviour === 'closed') setOpen(false)
  }, [sidebarBehaviour, setOpen])

  return (
    <AnimatePresence>
      {!hideSideBar && (
        <SidebarMotion
          {...props}
          transition={{ delay: 0.4, duration: 0.4 }}
          overflowing={sidebarBehaviour === 'expandable'}
          collapsible="icon"
          variant="sidebar"
          onMouseEnter={() => {
            if (sidebarBehaviour === 'expandable') setOpen(true)
          }}
          onMouseLeave={() => {
            if (sidebarBehaviour === 'expandable') setOpen(false)
          }}
        >
          <SidebarContent
            footer={
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="text"
                    className={`w-min px-1.5 mx-0.5 ${sidebarBehaviour === 'open' ? '!px-2' : ''}`}
                    icon={<PanelLeftDashed size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />}
                  />
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="start" className="w-40">
                  <DropdownMenuRadioGroup
                    value={sidebarBehaviour}
                    onValueChange={(value) => setSidebarBehaviour(value as SidebarBehaviourType)}
                  >
                    <DropdownMenuLabel>Sidebar control</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioItem value="open">Expanded</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="closed">Collapsed</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="expandable">
                      Expand on hover
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            }
          />
        </SidebarMotion>
      )}
    </AnimatePresence>
  )
}

export const SidebarContent = ({ footer }: { footer?: ReactNode }) => {
  const { ref: projectRef } = useParams()

  return (
    <>
      <AnimatePresence mode="wait">
        <SidebarContentPrimitive>
          {projectRef ? (
            <motion.div key="project-links">
              <ProjectLinks />
            </motion.div>
          ) : (
            <motion.div
              key="org-links"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <OrganizationLinks />
            </motion.div>
          )}
        </SidebarContentPrimitive>
      </AnimatePresence>
      <SidebarFooter>
        <SidebarGroup className="p-0">{footer}</SidebarGroup>
      </SidebarFooter>
    </>
  )
}

export function SideBarNavLink({
  route,
  active,
  onClick,
  ...props
}: {
  route: Route
  active?: boolean
  onClick?: () => void
} & ComponentPropsWithoutRef<typeof SidebarMenuButton>) {
  const [sidebarBehaviour] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.SIDEBAR_BEHAVIOR,
    DEFAULT_SIDEBAR_BEHAVIOR
  )

  const buttonProps = {
    disabled: route.disabled,
    tooltip: sidebarBehaviour === 'closed' ? route.label : '',
    isActive: active,
    className: cn('text-sm', sidebarBehaviour === 'open' ? '!px-2' : ''),
    size: 'default' as const,
    onClick: onClick,
  }

  const content = props.children ? (
    props.children
  ) : (
    <>
      {route.icon}
      <span>{route.label}</span>
    </>
  )

  return (
    <SidebarMenuItem>
      {route.link && !route.disabled ? (
        <SidebarMenuButton {...buttonProps} asChild>
          <Link href={route.link}>{content}</Link>
        </SidebarMenuButton>
      ) : (
        <SidebarMenuButton {...buttonProps}>{content}</SidebarMenuButton>
      )}
    </SidebarMenuItem>
  )
}

const ActiveDot = ({ hasErrors, hasWarnings }: { hasErrors: boolean; hasWarnings: boolean }) => {
  return (
    <div
      className={cn(
        'absolute pointer-events-none flex h-2 w-2 left-[18px] group-data-[state=expanded]:left-[20px] top-2 z-10 rounded-full',
        hasErrors ? 'bg-destructive-600' : hasWarnings ? 'bg-warning-600' : 'bg-transparent'
      )}
    />
  )
}

const ProjectLinks = () => {
  const router = useRouter()
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { data: org } = useSelectedOrganizationQuery()
  const snap = useAppStateSnapshot()
  const { securityLints, errorLints } = useLints()
  const showReports = useIsFeatureEnabled('reports:all')
  const { mutate: sendEvent } = useSendEventMutation()

  const isNewAPIDocsEnabled = useIsAPIDocsSidePanelEnabled()
  const { isEnabled: isUnifiedLogsEnabled } = useUnifiedLogsPreview()

  const activeRoute = router.pathname.split('/')[3]

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

  const toolRoutes = generateToolRoutes(ref, project)
  const productRoutes = generateProductRoutes(ref, project, {
    auth: authEnabled,
    edgeFunctions: edgeFunctionsEnabled,
    storage: storageEnabled,
    realtime: realtimeEnabled,
    authOverviewPage: authOverviewPageEnabled,
  })
  const otherRoutes = generateOtherRoutes(ref, project, {
    unifiedLogs: isUnifiedLogsEnabled,
    showReports,
    apiDocsSidePanel: isNewAPIDocsEnabled,
  })
  const settingsRoutes = generateSettingsRoutes(ref, project)

  return (
    <SidebarMenu>
      <SidebarGroup className="gap-0.5">
        <SideBarNavLink
          key="home"
          active={isUndefined(activeRoute) && !isUndefined(router.query.ref)}
          route={{
            key: 'HOME',
            label: 'Project Overview',
            icon: <Home size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
            link: `/project/${ref}`,
            linkElement: <ProjectIndexPageLink projectRef={ref} />,
          }}
        />
        {toolRoutes.map((route, i) => (
          <SideBarNavLink
            key={`tools-routes-${i}`}
            route={route}
            active={activeRoute === route.key}
          />
        ))}
      </SidebarGroup>
      <Separator className="w-[calc(100%-1rem)] mx-auto" />
      <SidebarGroup className="gap-0.5">
        {productRoutes.map((route, i) => (
          <SideBarNavLink
            key={`product-routes-${i}`}
            route={route}
            active={activeRoute === route.key}
          />
        ))}
      </SidebarGroup>
      <Separator className="w-[calc(100%-1rem)] mx-auto" />
      <SidebarGroup className="gap-0.5">
        {otherRoutes.map((route, i) => {
          if (route.key === 'api') {
            const handleApiClick = () => {
              if (isNewAPIDocsEnabled) {
                snap.setShowProjectApiDocs(true)
              }
              sendEvent({
                action: 'api_docs_opened',
                properties: {
                  source: 'sidebar',
                },
                groups: {
                  project: ref ?? 'Unknown',
                  organization: org?.slug ?? 'Unknown',
                },
              })
            }

            return (
              <SideBarNavLink
                key={route.key}
                route={
                  isNewAPIDocsEnabled
                    ? {
                        label: route.label,
                        icon: route.icon,
                        key: route.key,
                        disabled: route.disabled,
                      }
                    : route
                }
                active={activeRoute === route.key}
                onClick={handleApiClick}
              />
            )
          } else if (route.key === 'advisors') {
            return (
              <div className="relative" key={route.key}>
                {!route.disabled && (
                  <ActiveDot
                    hasErrors={errorLints.length > 0}
                    hasWarnings={securityLints.length > 0}
                  />
                )}
                <SideBarNavLink key={route.key} route={route} active={activeRoute === route.key} />
              </div>
            )
          } else {
            return (
              <SideBarNavLink key={route.key} route={route} active={activeRoute === route.key} />
            )
          }
        })}
      </SidebarGroup>
      {/* Settings routes to be added in with project/org nav */}
      <SidebarGroup className="gap-0.5">
        {settingsRoutes.map((route, i) => (
          <SideBarNavLink
            key={`settings-routes-${i}`}
            route={route}
            active={activeRoute === route.key}
          />
        ))}
      </SidebarGroup>
    </SidebarMenu>
  )
}

const OrganizationLinks = () => {
  const router = useRouter()
  const { slug } = useParams()

  const organizationSlug: string = slug ?? (router.query.orgSlug as string) ?? ''

  const { data: org } = useSelectedOrganizationQuery()
  const isUserMFAEnabled = useIsMFAEnabled()
  const disableAccessMfa = org?.organization_requires_mfa && !isUserMFAEnabled

  const showBilling = useIsFeatureEnabled('billing:all')

  const activeRoute = router.pathname.split('/')[3]

  const navMenuItems = [
    {
      label: 'Projects',
      href: `/org/${organizationSlug}`,
      key: 'projects',
      icon: <Boxes size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
    },
    {
      label: 'Team',
      href: `/org/${organizationSlug}/team`,
      key: 'team',
      icon: <Users size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
    },
    {
      label: 'Integrations',
      href: `/org/${organizationSlug}/integrations`,
      key: 'integrations',
      icon: <Blocks size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
    },
    {
      label: 'Usage',
      href: `/org/${organizationSlug}/usage`,
      key: 'usage',
      icon: <ChartArea size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
    },
    ...(showBilling
      ? [
          {
            label: 'Billing',
            href: `/org/${organizationSlug}/billing`,
            key: 'billing',
            icon: <Receipt size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
          },
        ]
      : []),
    {
      label: 'Organization settings',
      href: `/org/${organizationSlug}/general`,
      key: 'settings',
      icon: <Settings size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
    },
  ]

  if (!organizationSlug) return null

  return (
    <SidebarMenu className="flex flex-col gap-1 items-start">
      <SidebarGroup className="gap-0.5">
        {navMenuItems.map((item, i) => (
          <SideBarNavLink
            key={item.key}
            active={
              i === 0
                ? activeRoute === undefined
                : item.key === 'settings'
                  ? router.pathname.includes('/general') ||
                    router.pathname.includes('/apps') ||
                    router.pathname.includes('/audit') ||
                    router.pathname.includes('/documents') ||
                    router.pathname.includes('/security')
                  : activeRoute === item.key
            }
            route={{
              label: item.label,
              link: item.href,
              key: item.label,
              icon: item.icon,
              disabled: disableAccessMfa,
            }}
          />
        ))}
      </SidebarGroup>
    </SidebarMenu>
  )
}
