import { useParams } from 'common'
import BranchDropdown from 'components/layouts/AppLayout/BranchDropdown'
import OrganizationDropdown from 'components/layouts/AppLayout/OrganizationDropdown'
import ProjectDropdown from 'components/layouts/AppLayout/ProjectDropdown'
import {
  generateOtherRoutes,
  generateProductRoutes,
  generateSettingsRoutes,
  generateToolRoutes,
} from 'components/layouts/ProjectLayout/NavigationBar/NavigationBar.utils'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { getResourcesExceededLimitsOrg } from 'components/ui/OveragesBanner/OveragesBanner.utils'
import { ProjectIndexPageLink } from 'data/prefetchers/project.$ref'
import { useOrgUsageQuery } from 'data/usage/org-usage-query'
import { AnimatePresence, motion } from 'framer-motion'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { Home } from 'icons'
import { isUndefined } from 'lodash'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
import {
  Button,
  cn,
  Collapsible_Shadcn_,
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
  Separator,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from 'ui'
import { AppDefaultNavigationUsageBanner } from './app-default-navigation-usage-banner'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import {
  Blocks,
  Boxes,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CornerLeftUp,
  SidebarClose,
} from 'lucide-react'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import Connect from './Connect/Connect'
import { useFlag } from 'hooks/ui/useFlag'
import EnableBranchingButton from 'components/layouts/AppLayout/EnableBranchingButton/EnableBranchingButton'
import { UserDropdown } from './user-dropdown'

export const ICON_SIZE = 18
export const ICON_STROKE_WIDTH = 1.5

const SidebarMotion = motion(Sidebar)

export function AppDefaultNavigation() {
  // Function logic goes here
  const router = useRouter()
  const { ref } = useParams()

  const selectedProject = useSelectedProject()
  const selectedOrg = useSelectedOrganization()
  const isBranchingEnabled = selectedProject?.is_branch_enabled === true

  const activeRoute = router.pathname.split('/')[3]

  const isProjects = router.asPath.includes('/project/')

  const connectDialogUpdate = useFlag('connectDialogUpdate')

  const { state, open, setOpen, openMobile, setOpenMobile, isMobile, toggleSidebar } = useSidebar()

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
          {open && (
            <SidebarHeader className="">
              <div className="flex flex-col gap-1">
                {!isProjects && <OrganizationDropdown />}
                <AnimatePresence>
                  {isProjects && open && (
                    <motion.div
                      initial={{ opacity: 0, x: -20, height: 0 }}
                      animate={{ opacity: 1, x: 0, height: 'auto' }}
                      exit={{ opacity: 0, x: -20, height: 0 }}
                      transition={{
                        duration: 0.15,
                        ease: 'easeOut',
                      }}
                      className="flex gap-1.5 items-center mb-1 px-2"
                    >
                      {/* <div className="-ml-5">
                    <Button
                      onClick={() => setOpen(false)}
                      className="px-1 justify-start"
                      type="text"
                    >
                      <SidebarClose size={12} strokeWidth={1} />
                    </Button>
                  </div> */}
                      <button
                        onClick={() => router.push(`/org/${selectedOrg?.slug}`)}
                        className="group/org-back-button text-foreground-lighter flex items-center gap-1 hover:text-foreground text-xs cursor-pointer"
                      >
                        <CornerLeftUp
                          size={14}
                          strokeWidth={1}
                          className="text-forefground-lighter group-hover/org-back-button:text-foreground group-hover/org-back-button:translate-y-[-2px] transition-transform"
                        />
                        Organization
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
                {/* <UserDropdown /> */}
                <AnimatePresence>
                  {ref && open && (
                    <motion.div
                      className="flex items-center"
                      initial={{ opacity: 0, x: -20, height: 0 }}
                      animate={{ opacity: 1, x: 0, height: 'auto' }}
                      exit={{ opacity: 0, x: -20, height: 0 }}
                      transition={{
                        duration: 0.15,
                        ease: 'easeOut',
                      }}
                    >
                      <ProjectDropdown />
                      <AppDefaultNavigationUsageBanner />
                      {selectedProject && isBranchingEnabled && (
                        <>
                          <BranchDropdown />
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </SidebarHeader>
          )}
          <AnimatePresence mode="wait">
            <SidebarContent className="">
              {isProjects ? (
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
            <AnimatePresence>
              {ref && (
                <motion.div
                  className="flex flex-col"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{
                    duration: 0.12,
                    ease: 'easeOut',
                  }}
                >
                  {!isBranchingEnabled && <EnableBranchingButton />}
                </motion.div>
              )}
              {connectDialogUpdate && ref && (
                <motion.div
                  className="px-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{
                    duration: 0.12,
                    ease: 'easeOut',
                  }}
                >
                  <div>
                    <Connect />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
  // }

  return (
    <Collapsible_Shadcn_ className="group/collapsible" open={open} onOpenChange={setOpen}>
      <SidebarMenuItem>
        <CollapsibleTrigger_Shadcn_ asChild>
          <SidebarMenuButton
            className="text-sm flex items-center [&_svg]:opacity-50 data-[active=true]>[&>svg]:opacity-100"
            size={'sm'}
          >
            <>
              {route.icon}
              <span className="flex-grow">{route.label}</span>
              <ChevronDown className="text-foreground-muted self-end transition-transform group-data-[state=closed]/collapsible:rotate-90" />
            </>
          </SidebarMenuButton>
        </CollapsibleTrigger_Shadcn_>
        <CollapsibleContent_Shadcn_ forceMount>
          <motion.div
            initial={false}
            animate={{
              height: open ? 'auto' : 0,
              opacity: open ? 1 : 0,
            }}
            transition={{ duration: 0.12 }}
            style={{ overflow: 'hidden' }}
          >
            <SidebarMenuSub className="gap-0.5">
              {route.items.map((item, i) => {
                // console.log('item', item)
                return (
                  <SidebarMenuSubItem key={`${item.key}-${i}`}>
                    <SidebarMenuSubButton asChild isActive={router.asPath === item.link} size="md">
                      <Link href={item.link ?? '/wrong-url'}>{item.title}</Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                )
              })}
            </SidebarMenuSub>
          </motion.div>
        </CollapsibleContent_Shadcn_>
      </SidebarMenuItem>
    </Collapsible_Shadcn_>
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
      <SidebarGroup
      // className={cn(!open && 'pt-0')}
      >
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
      {/* <Separator className="my-1 bg-border-muted" /> */}
      <SidebarGroup>
        <SidebarGroupLabel className="text-foreground-muted text-xs uppercase font-mono text-[12px] tracking-wider">
          products
        </SidebarGroupLabel>
        {productRoutes.map((route, i) => (
          <NavLink key={`product-routes-${i}`} route={route} active={activeRoute === route.key} />
        ))}
      </SidebarGroup>
      {/* <Separator className="my-1 bg-border-muted" /> */}
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
      label: 'General',
      href: `/org/${slug}/general`,
      key: 'general',
      icon: <Blocks size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
    },
    {
      label: 'Team',
      href: `/org/${slug}/team`,
      key: 'team',
      icon: <Blocks size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
    },
    {
      label: 'Integrations',
      href: `/org/${slug}/integrations`,
      key: 'integrations',
      icon: <Blocks size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
    },
    {
      label: 'Billing',
      href: `/org/${slug}/billing`,
      key: 'billing',
      icon: <Blocks size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
    },
    {
      label: 'Usage',
      href: `/org/${slug}/usage`,
      key: 'usage',
      icon: <Blocks size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
    },
    {
      label: 'Invoices',
      href: `/org/${slug}/invoices`,
      key: 'invoices',
      icon: <Blocks size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      //   hidden: !invoicesEnabled,
    },
    {
      label: 'OAuth Apps',
      href: `/org/${slug}/apps`,
      key: 'apps',
      icon: <Blocks size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
    },
    {
      label: 'Audit Logs',
      href: `/org/${slug}/audit`,
      key: 'audit',
      icon: <Blocks size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
    },
    {
      label: 'Legal Documents',
      href: `/org/${slug}/documents`,
      key: 'documents',
      icon: <Blocks size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
    },
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
