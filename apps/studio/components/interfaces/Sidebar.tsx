import { useParams } from 'common'
import {
  generateOtherRoutes,
  generateProductRoutes,
  generateSettingsRoutes,
  generateToolRoutes,
} from 'components/layouts/ProjectLayout/NavigationBar/NavigationBar.utils'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { ProjectIndexPageLink } from 'data/prefetchers/project.$ref'
import { AnimatePresence, motion, MotionProps } from 'framer-motion'
import { useHideSidebar } from 'hooks/misc/useHideSidebar'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { Home } from 'icons'
import { LOCAL_STORAGE_KEYS } from 'lib/constants'
import { isUndefined } from 'lodash'
import {
  Blocks,
  Boxes,
  ChartArea,
  ChevronLeft,
  Command,
  PanelLeftDashed,
  Settings,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { useAppStateSnapshot, type SidebarBehaviourType } from 'state/app-state'
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
  useSidebar,
} from 'ui'
import { useSetCommandMenuOpen } from 'ui-patterns'
import { UserDropdown } from './UserDropdown'
import MobileSheetNav from 'ui-patterns/MobileSheetNav/MobileSheetNav'

export const ICON_SIZE = 32
export const ICON_STROKE_WIDTH = 1.5

const SidebarMotion = motion(SidebarPrimitive) as React.FC<
  React.ComponentProps<typeof SidebarPrimitive> & {
    transition?: MotionProps['transition']
  }
>

export interface SidebarProps extends React.ComponentPropsWithoutRef<typeof SidebarPrimitive> {}

export function Sidebar({ className, ...props }: SidebarProps) {
  const { setOpen } = useSidebar()

  const hideSideBar = useHideSidebar()

  const [storedAllowNavPanel] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.EXPAND_NAVIGATION_PANEL,
    true
  )
  const { sidebarBehaviour, setSidebarBehaviour } = useAppStateSnapshot()

  useEffect(() => {
    if (sidebarBehaviour === 'open') {
      setOpen(true)
    }
    if (sidebarBehaviour === 'closed') {
      setOpen(false)
    }
  }, [sidebarBehaviour, setOpen])

  return (
    <>
      <AnimatePresence>
        {!hideSideBar && (
          <SidebarMotion
            {...props}
            transition={{
              delay: 0.4,
              duration: 0.4,
            }}
            overflowing={sidebarBehaviour === 'expandable'}
            collapsible="icon"
            variant="sidebar"
            onMouseEnter={() => {
              if (sidebarBehaviour === 'expandable') {
                setOpen(true)
              }
            }}
            onMouseLeave={() => {
              if (sidebarBehaviour === 'expandable') {
                setOpen(false)
              }
            }}
          >
            <SidebarContent
              footer={
                <div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="text"
                        className="px-1.5 mx-0.5 group-data-[state=expanded]:px-2"
                        icon={<PanelLeftDashed size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />}
                      ></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="top" align="start" className="w-40">
                      <DropdownMenuRadioGroup
                        value={sidebarBehaviour}
                        onValueChange={(value) =>
                          setSidebarBehaviour(value as SidebarBehaviourType)
                        }
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
                </div>
              }
            />
          </SidebarMotion>
        )}
      </AnimatePresence>
    </>
  )
}

export function SidebarContent({ footer }: { footer?: React.ReactNode }) {
  const setCommandMenuOpen = useSetCommandMenuOpen()
  return (
    <>
      <AnimatePresence mode="wait">
        <SidebarContentPrimitive>
          {/* {project ? ( */}
          <motion.div key="project-links">
            <ProjectLinks />
          </motion.div>
          {/* ) : (
                <motion.div
                  key="org-links"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  <OrganizationLinks />
                </motion.div>
                )} */}
        </SidebarContentPrimitive>
      </AnimatePresence>
      <SidebarFooter>
        <SidebarMenu className="group-data-[state=expanded]:p-0">
          <SidebarGroup className="p-0">
            <NavLink
              key="cmdk"
              route={{
                key: 'cmdk',
                label: 'Command Menu',
                icon: <Command size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
              }}
              onClick={() => setCommandMenuOpen(true)}
            />
          </SidebarGroup>
        </SidebarMenu>
        <SidebarMenu className="group-data-[state=expanded]:p-0">
          <SidebarGroup className="p-0">
            <SidebarMenuItem className="h-10 flex items-center">
              <UserDropdown />
            </SidebarMenuItem>
          </SidebarGroup>
        </SidebarMenu>
        <SidebarGroup className="p-0">{footer}</SidebarGroup>
      </SidebarFooter>
    </>
  )
}

function NavLink({
  route,
  active,
  onClick,
}: {
  route: any
  active?: boolean
  onClick?: () => void
}) {
  const { sidebarBehaviour } = useAppStateSnapshot()

  const buttonProps = {
    tooltip: sidebarBehaviour === 'closed' ? route.label : '',
    isActive: active,
    className: 'text-sm',
    size: 'default' as const,
    onClick: onClick,
  }

  const content = (
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

function ProjectLinks() {
  const router = useRouter()
  const { ref } = useParams()
  const { project } = useProjectContext()
  const { sidebarBehaviour } = useAppStateSnapshot()

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

  const toolRoutes = generateToolRoutes(ref, project)
  const productRoutes = generateProductRoutes(ref, project, {
    auth: authEnabled,
    edgeFunctions: edgeFunctionsEnabled,
    storage: storageEnabled,
    realtime: realtimeEnabled,
  })
  const otherRoutes = generateOtherRoutes(ref, project)
  const settingsRoutes = generateSettingsRoutes(ref, project)

  // console.log(productRoutes)

  return (
    <>
      <SidebarMenu className="">
        <SidebarGroup className="gap-0.5">
          <NavLink
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
            <NavLink key={`tools-routes-${i}`} route={route} active={activeRoute === route.key} />
          ))}
        </SidebarGroup>
        <Separator className="w-[calc(100%-1rem)] mx-auto" />

        <SidebarGroup className="gap-0.5">
          {productRoutes.map((route, i) => (
            <NavLink key={`product-routes-${i}`} route={route} active={activeRoute === route.key} />
          ))}
        </SidebarGroup>

        <Separator className="w-[calc(100%-1rem)] mx-auto" />
        <SidebarGroup className="gap-0.5">
          {otherRoutes.map((route, i) => (
            <NavLink key={`other-routes-${i}`} route={route} active={activeRoute === route.key} />
          ))}
        </SidebarGroup>
        <SidebarGroup className="gap-0.5">
          {settingsRoutes.map((route, i) => (
            <NavLink
              key={`settings-routes-${i}`}
              route={route}
              active={activeRoute === route.key}
            />
          ))}
        </SidebarGroup>
      </SidebarMenu>
    </>
  )
}

const OrganizationLinks = () => {
  const router = useRouter()
  const { slug } = useParams()
  const { open } = useSidebar()

  const activeRoute = router.pathname.split('/')[3]

  const navMenuItems = [
    {
      label: 'Projects',
      href: `/org/${slug}`,
      key: '',
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
      label: 'Organization settings',
      href: `/org/${slug}/settings/general`,
      key: 'settings',
      icon: <Settings size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
    },
  ]

  return (
    <SidebarMenu className="flex flex-col gap-1 items-start">
      <SidebarGroup className="gap-0.5">
        {navMenuItems.map((item, i) => (
          <NavLink
            active={i === 0 ? activeRoute === undefined : activeRoute === item.key}
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
