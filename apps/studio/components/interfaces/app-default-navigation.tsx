import { useParams } from 'common'
import {
  generateOtherRoutes,
  generateProductRoutes,
  generateSettingsRoutes,
  generateToolRoutes,
} from 'components/layouts/ProjectLayout/NavigationBar/NavigationBar.utils'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { ProjectIndexPageLink } from 'data/prefetchers/project.$ref'
import { AnimatePresence, motion } from 'framer-motion'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { useFlag } from 'hooks/ui/useFlag'
import { Home } from 'icons'
import { isUndefined } from 'lodash'
import { Blocks, Boxes, ChartArea, ChevronDown, ChevronLeft, Settings, Users } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import {
  cn,
  Collapsible_Shadcn_,
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from 'ui'
import { UserDropdown } from './user-dropdown'

export const ICON_SIZE = 18
export const ICON_STROKE_WIDTH = 1.5

const SidebarMotion = motion(Sidebar)

export function AppDefaultNavigation() {
  const router = useRouter()
  const project = useSelectedProject()
  const { open, toggleSidebar } = useSidebar()

  return (
    <>
      <AnimatePresence>
        <SidebarMotion
          className={cn(
            '!border-r-0'
            // !open && 'pt-[38px]'
          )}
          transition={{
            delay: 0.4,
            duration: 0.4,
          }}
          collapsible="icon"
        >
          <AnimatePresence mode="wait">
            <SidebarContent className="">
              {project ? (
                <motion.div
                  key="project-links"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
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
            </SidebarContent>
          </AnimatePresence>
          <SidebarFooter>
            <SidebarGroup>
              <button onClick={() => toggleSidebar()}>
                <ChevronLeft
                  size={14}
                  strokeWidth={2}
                  className={cn(
                    'text-foreground-muted transition-transform',
                    !open && 'rotate-180'
                  )}
                />
              </button>
            </SidebarGroup>

            <UserDropdown />
          </SidebarFooter>
        </SidebarMotion>
      </AnimatePresence>
    </>
  )
}

function NavLink({ route, active }: { route: any; active?: boolean }) {
  const router = useRouter()
  // const hasItems = route.items && route.items.some((section) => section.items.length > 0)
  const [open, setOpen] = useState(false)

  // console.log('route', route)

  // if (!route.items) {
  return (
    <SidebarMenuItem key={route.key}>
      <SidebarMenuButton
        tooltip={route.label}
        asChild
        isActive={active}
        className="text-sm [&_svg]:opacity-50"
        size={'sm'}
      >
        <Link href={route.link ?? ''}>
          {route.icon}
          {route.label}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function ProjectLinks() {
  const router = useRouter()
  const { ref } = useParams()
  const { project } = useProjectContext()
  const { open } = useSidebar()

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
    <SidebarMenu className="gap-[2px]">
      <SidebarGroup>
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

      <SidebarGroup>
        <SidebarGroupLabel className="text-foreground-muted text-xs uppercase font-mono text-[12px] tracking-wider">
          products
        </SidebarGroupLabel>
        {productRoutes.map((route, i) => (
          <NavLink key={`product-routes-${i}`} route={route} active={activeRoute === route.key} />
        ))}
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel className="text-foreground-muted text-xs uppercase font-mono text-[12px] tracking-wider">
          develop
        </SidebarGroupLabel>
        {otherRoutes.map((route, i) => (
          <NavLink key={`other-routes-${i}`} route={route} active={activeRoute === route.key} />
        ))}
      </SidebarGroup>
      <SidebarGroup>
        {settingsRoutes.map((route, i) => (
          <NavLink key={`settings-routes-${i}`} route={route} active={activeRoute === route.key} />
        ))}
      </SidebarGroup>
    </SidebarMenu>
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
    // {
    //   label: 'Billing',
    //   href: `/org/${slug}/billing`,
    //   key: 'billing',
    //   icon: <Blocks size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
    // },
    {
      label: 'Organization settings',
      href: `/org/${slug}/settings`,
      key: 'settings',
      icon: <Settings size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
    },
    // {
    //   label: 'OAuth Apps',
    //   href: `/org/${slug}/apps`,
    //   key: 'apps',
    //   icon: <Blocks size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
    // },
    // {
    //   label: 'General',
    //   href: `/org/${slug}/general`,
    //   key: 'general',
    //   icon: <Blocks size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
    // },
    // {
    //   label: 'Audit Logs',
    //   href: `/org/${slug}/audit`,
    //   key: 'audit',
    //   icon: <Blocks size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
    // },
    // {
    //   label: 'Legal Documents',
    //   href: `/org/${slug}/documents`,
    //   key: 'documents',
    //   icon: <Blocks size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
    // },
    // {
    //   label: 'Invoices',
    //   href: `/org/${slug}/invoices`,
    //   key: 'invoices',
    //   icon: <Blocks size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
    //   //   hidden: !invoicesEnabled,
    // },
  ]

  return (
    <SidebarMenu className="flex flex-col gap-1 items-start">
      <SidebarGroup
      // className={cn(!open && 'pt-0')}
      >
        {navMenuItems.map((item, i) => (
          <SidebarMenuItem key={`${item.label}-${i}`}>
            <NavLink
              active={i === 0 ? activeRoute === undefined : activeRoute === item.key}
              route={{
                label: item.label,
                link: item.href,
                key: item.label,
                icon: item.icon,
              }}
            />
          </SidebarMenuItem>
        ))}
      </SidebarGroup>
    </SidebarMenu>
  )
}
