import { AnimatePresence, motion, MotionProps } from 'framer-motion'
import { isUndefined } from 'lodash'
import {
  ArrowUpRight,
  Blocks,
  Boxes,
  ChartArea,
  PanelLeftDashed,
  Receipt,
  Settings,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ComponentProps, ComponentPropsWithoutRef, FC, ReactNode, useEffect } from 'react'

import { useParams } from 'common'
import {
  generateOtherRoutes,
  generateProductRoutes,
  generateSettingsRoutes,
  generateToolRoutes,
} from 'components/layouts/ProjectLayout/NavigationBar/NavigationBar.utils'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { ProjectIndexPageLink } from 'data/prefetchers/project.$ref'
import { useHideSidebar } from 'hooks/misc/useHideSidebar'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useLints } from 'hooks/misc/useLints'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useFlag } from 'hooks/ui/useFlag'
import { Home } from 'icons'
import { LOCAL_STORAGE_KEYS } from 'lib/constants'
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
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  Sidebar as SidebarPrimitive,
  SidebarSeparator,
  useSidebar,
} from 'ui'
import {
  useIsAPIDocsSidePanelEnabled,
  useIsNewLayoutEnabled,
  useIsSQLEditorTabsEnabled,
} from './App/FeaturePreview/FeaturePreviewContext'

export const ICON_SIZE = 32
export const ICON_STROKE_WIDTH = 1.5
export type SidebarBehaviourType = 'expandable' | 'open' | 'closed'
export const DEFAULT_SIDEBAR_BEHAVIOR = 'expandable'

const SidebarMotion = motion(SidebarPrimitive) as FC<
  ComponentProps<typeof SidebarPrimitive> & {
    transition?: MotionProps['transition']
  }
>

export interface SidebarProps extends ComponentPropsWithoutRef<typeof SidebarPrimitive> {}

export const Sidebar = ({ className, ...props }: SidebarProps) => {
  const newLayoutPreview = useIsNewLayoutEnabled()

  const { ref } = useParams()

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

  if (!newLayoutPreview && !ref) {
    return null
  }

  return (
    <>
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
                      className="w-min px-1.5 mx-0.5 group-data-[state=expanded]:px-2"
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
    </>
  )
}

export const SidebarContent = ({ footer }: { footer?: ReactNode }) => {
  const newLayoutPreview = useIsNewLayoutEnabled()
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
              {newLayoutPreview ? <OrganizationLinks /> : <HomePageLinks />}
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
  route: any
  active?: boolean
  onClick?: () => void
} & ComponentPropsWithoutRef<typeof SidebarMenuButton>) {
  const [sidebarBehaviour] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.SIDEBAR_BEHAVIOR,
    DEFAULT_SIDEBAR_BEHAVIOR
  )

  const buttonProps = {
    tooltip: sidebarBehaviour === 'closed' ? route.label : '',
    isActive: active,
    className: 'text-sm',
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
      {route.link ? (
        <SidebarMenuButton {...buttonProps} asChild>
          <Link href={route.link}>{content}</Link>
        </SidebarMenuButton>
      ) : (
        <SidebarMenuButton {...buttonProps}>{content}</SidebarMenuButton>
      )}
    </SidebarMenuItem>
  )
}

const ActiveDot = (errorArray: any[], warningArray: any[]) => {
  return (
    <div
      className={cn(
        'absolute pointer-events-none flex h-2 w-2 left-[18px] group-data-[state=expanded]:left-[20px] top-2 z-10 rounded-full',
        errorArray.length > 0
          ? 'bg-destructive-600'
          : warningArray.length > 0
            ? 'bg-warning-600'
            : 'bg-transparent'
      )}
    />
  )
}

const ProjectLinks = () => {
  const router = useRouter()
  const { ref } = useParams()
  const { project } = useProjectContext()
  const snap = useAppStateSnapshot()
  const isNewAPIDocsEnabled = useIsAPIDocsSidePanelEnabled()
  const { securityLints, errorLints } = useLints()

  const showWarehouse = useFlag('warehouse')
  const isSqlEditorTabsEnabled = useIsSQLEditorTabsEnabled()

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

  const toolRoutes = generateToolRoutes(ref, project, {
    sqlEditorTabs: isSqlEditorTabsEnabled,
  })
  const productRoutes = generateProductRoutes(ref, project, {
    auth: authEnabled,
    edgeFunctions: edgeFunctionsEnabled,
    storage: storageEnabled,
    realtime: realtimeEnabled,
  })
  const otherRoutes = generateOtherRoutes(ref, project)
  const settingsRoutes = generateSettingsRoutes(ref, project)

  return (
    <SidebarMenu>
      <SidebarGroup className="gap-0.5">
        <SideBarNavLink
          key="home"
          active={isUndefined(activeRoute) && !isUndefined(router.query.ref)}
          route={{
            key: 'HOME',
            label: 'Project overview',
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
          if (route.key === 'api' && isNewAPIDocsEnabled) {
            return (
              <SideBarNavLink
                key={`other-routes-${i}`}
                route={{
                  label: route.label,
                  icon: route.icon,
                  key: route.key,
                }}
                onClick={() => {
                  snap.setShowProjectApiDocs(true)
                }}
              />
            )
          } else if (route.key === 'advisors') {
            return (
              <div className="relative" key={route.key}>
                {ActiveDot(errorLints, securityLints)}
                <SideBarNavLink
                  key={`other-routes-${i}`}
                  route={route}
                  active={activeRoute === route.key}
                />
              </div>
            )
          } else if (route.key === 'logs') {
            // TODO: Undo this when warehouse flag is removed
            const label = showWarehouse ? 'Logs & Analytics' : route.label
            const newRoute = { ...route, label }
            return (
              <SideBarNavLink
                key={`other-routes-${i}`}
                route={newRoute}
                active={activeRoute === newRoute.key}
              />
            )
          } else {
            return (
              <SideBarNavLink
                key={`other-routes-${i}`}
                route={route}
                active={activeRoute === route.key}
              />
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

const HomePageLinks = () => {
  const { data: organizations = [] } = useOrganizationsQuery()
  const organizationLinks = organizations.map((org) => {
    return { label: org.name, href: `/org/${org.slug}/general`, key: org.slug }
  })
  const accountLinks = [
    { label: 'Preferences', href: `/account/me`, key: 'preferences' },
    { label: 'Access Tokens', href: `/account/tokens`, key: 'account-tokens' },
    { label: 'Security', href: `/account/security`, key: 'security' },
    { label: 'Audit Logs', href: `/account/audit`, key: 'audit-logs' },
  ]
  const docsLinks = [
    { label: 'Guides', href: `https://supabase.com/docs`, key: 'guides', icon: <ArrowUpRight /> },
    {
      label: 'API Reference',
      href: `https://supabase.com/docs/guides/api`,
      key: 'api-reference',
      icon: <ArrowUpRight />,
    },
  ]

  return (
    <SidebarMenu className="flex flex-col gap-y-1 items-start">
      <SidebarGroupLabel className="px-4 h-auto pt-4">Organizations</SidebarGroupLabel>
      <SidebarGroup className="gap-0.5">
        {organizationLinks.map((x) => (
          <SideBarNavLink
            key={x.key}
            active={false}
            route={{
              label: x.label,
              link: x.href,
              key: x.label,
            }}
          />
        ))}
      </SidebarGroup>
      <SidebarSeparator className="!bg-border-overlay w-full mx-0" />
      <SidebarGroupLabel className="px-4 h-auto pt-4">Account</SidebarGroupLabel>
      <SidebarGroup className="gap-0.5">
        {accountLinks.map((x) => (
          <SideBarNavLink
            key={x.key}
            active={false}
            route={{
              label: x.label,
              link: x.href,
              key: x.label,
            }}
          />
        ))}
      </SidebarGroup>
      <SidebarSeparator className="!bg-border-overlay w-full mx-0" />
      <SidebarGroupLabel className="px-4 h-auto pt-4">Documentation</SidebarGroupLabel>
      <SidebarGroup className="gap-0.5">
        {docsLinks.map((x) => (
          <SideBarNavLink
            key={x.key}
            active={false}
            route={{
              label: x.label,
              link: x.href,
              key: x.label,
              icon: x.icon,
            }}
          />
        ))}
      </SidebarGroup>
    </SidebarMenu>
  )
}

const OrganizationLinks = () => {
  const router = useRouter()
  const { slug } = useParams()

  const activeRoute = router.pathname.split('/')[3]

  const navMenuItems = [
    {
      label: 'Projects',
      href: `/org/${slug}`,
      key: 'projects',
      icon: <Boxes size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
    },
    {
      label: 'Team',
      href: `/org/${slug}/team`,
      key: 'team',
      icon: <Users size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
    },
    {
      label: 'Integrations',
      href: `/org/${slug}/integrations`,
      key: 'integrations',
      icon: <Blocks size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
    },
    {
      label: 'Usage',
      href: `/org/${slug}/usage`,
      key: 'usage',
      icon: <ChartArea size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
    },
    {
      label: 'Billing',
      href: `/org/${slug}/billing`,
      key: 'billing',
      icon: <Receipt size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
    },
    {
      label: 'Organization settings',
      href: `/org/${slug}/general`,
      key: 'settings',
      icon: <Settings size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
    },
  ]

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
                    router.pathname.includes('/documents')
                  : activeRoute === item.key
            }
            route={{
              label: item.label,
              link: item.href,
              key: item.label,
              icon: item.icon,
            }}
          />
        ))}
      </SidebarGroup>
    </SidebarMenu>
  )
}
