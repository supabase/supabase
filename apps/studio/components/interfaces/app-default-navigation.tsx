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
import { useMemo } from 'react'
import { Badge, Button, cn, Separator } from 'ui'
import { AppDefaultNavigationUsageBanner } from './app-default-navigation-usage-banner'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { Blocks, Boxes, CornerLeftUp } from 'lucide-react'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import Connect from './Connect/Connect'
import { useFlag } from 'hooks/ui/useFlag'
import EnableBranchingButton from 'components/layouts/AppLayout/EnableBranchingButton/EnableBranchingButton'

export const ICON_SIZE = 18
export const ICON_STROKE_WIDTH = 1.5

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

  return (
    <>
      <nav className="min-w-[180px] px-3 py-2 flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          {!isProjects && <OrganizationDropdown />}
          <AnimatePresence>
            {isProjects && (
              <motion.div
                initial={{ opacity: 0, x: -20, height: 0 }}
                animate={{ opacity: 1, x: 0, height: 'auto' }}
                exit={{ opacity: 0, x: -20, height: 0 }}
                transition={{
                  duration: 0.15,
                  ease: 'easeOut',
                }}
              >
                <button
                  onClick={() => router.push(`/org/${selectedOrg?.slug}`)}
                  className="group/org-back-button text-foreground-light flex items-center gap-2 hover:text-foreground text-xs mb-2"
                >
                  <CornerLeftUp
                    size={14}
                    strokeWidth={1}
                    className="text-forefground-lighter group-hover/org-back-button:text-foreground"
                  />
                  Organization
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          {/* <UserDropdown /> */}
          <AnimatePresence>
            {ref && (
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
        {isProjects ? <ProjectLinks /> : <OrganizationLinks />}
        <AnimatePresence>
          {ref && (
            <motion.div
              className="flex flex-col"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{
                duration: 0.15,
                ease: 'easeOut',
              }}
            >
              {!isBranchingEnabled && <EnableBranchingButton />}
            </motion.div>
          )}
          {connectDialogUpdate && ref && (
            <motion.div
              className="flex flex-col"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{
                duration: 0.15,
                ease: 'easeOut',
              }}
            >
              <Connect />
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  )
}

function NavLink({ route, active }: { route: any; active?: boolean }) {
  return (
    <Button
      asChild
      type={'text'}
      icon={route.icon}
      className={cn(
        'px-1 justify-start text-foreground-light [&_svg]:text-foreground-lighter',
        active && 'bg-selection text-foreground [&_svg]:text-foreground'
      )}
      block
    >
      <Link href={route.link ?? ''}>{route.label}</Link>
    </Button>
  )
}

function ProjectLinks() {
  const router = useRouter()
  const { ref } = useParams()
  const { project } = useProjectContext()

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

  return (
    <ul className="flex flex-col gap-1 items-start">
      <NavLink
        active={isUndefined(activeRoute) && !isUndefined(router.query.ref)}
        route={{
          key: 'HOME',
          label: 'Project overview',
          icon: <Home size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
          link: `/project/${ref}`,
          linkElement: <ProjectIndexPageLink projectRef={ref} />,
        }}
      />
      {/* <Separator className="my-1 bg-border-muted" /> */}
      <span className="text-foreground-muted text-xs uppercase font-mono text-[12px] px-1.5 mt-2 tracking-wider">
        tools
      </span>
      {toolRoutes.map((route) => (
        <NavLink key={route.key} route={route} active={activeRoute === route.key} />
      ))}
      <span className="text-foreground-muted text-xs uppercase font-mono text-[12px] px-1.5 mt-2 tracking-wider">
        products
      </span>
      {productRoutes.map((route) => (
        <NavLink key={route.key} route={route} active={activeRoute === route.key} />
      ))}
      <span className="text-foreground-muted text-xs uppercase font-mono text-[12px] px-1.5 mt-2 tracking-wider">
        develop
      </span>
      {otherRoutes.map((route) => (
        <NavLink key={route.key} route={route} active={activeRoute === route.key} />
      ))}
      {settingsRoutes.map((route) => (
        <NavLink key={route.key} route={route} active={activeRoute === route.key} />
      ))}
      {/* <Separator className="my-1 bg-border-muted" /> */}
    </ul>
  )
}

const OrganizationLinks = () => {
  const router = useRouter()
  const activeRoute = router.pathname.split('/')[3]
  const { slug } = useParams()

  const invoicesEnabledOnProfileLevel = useIsFeatureEnabled('billing:invoices')
  const invoicesEnabled = invoicesEnabledOnProfileLevel

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

  //   const filteredNavMenuItems = navMenuItems.filter((item) => !item.hidden)

  //   console.log(activeRoute)

  return (
    <ul className="flex flex-col gap-1 items-start">
      {navMenuItems.map((item) => (
        <NavLink
          key={item.label}
          active={activeRoute === item.key}
          route={{
            label: item.label,
            link: item.href,
            key: item.label,
            icon: item.icon,
          }}
        />
      ))}
    </ul>
  )
}
