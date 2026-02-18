import Head from 'next/head'
import { useRouter } from 'next/router'
import { forwardRef, Fragment, PropsWithChildren, ReactNode, useEffect } from 'react'

import { mergeRefs, useParams } from 'common'
import { CreateBranchModal } from 'components/interfaces/BranchManagement/CreateBranchModal'
import { ProjectAPIDocs } from 'components/interfaces/ProjectAPIDocs/ProjectAPIDocs'
import { ResourceExhaustionWarningBanner } from 'components/ui/ResourceExhaustionWarningBanner/ResourceExhaustionWarningBanner'
import { AnimatePresence, motion } from 'framer-motion'
import { useCustomContent } from 'hooks/custom-content/useCustomContent'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { withAuth } from 'hooks/misc/withAuth'
import { usePHFlag } from 'hooks/ui/useFlag'
import { PROJECT_STATUS } from 'lib/constants'
import { useAppStateSnapshot } from 'state/app-state'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import { cn, LogoLoader, ResizableHandle, ResizablePanel, ResizablePanelGroup } from 'ui'
import MobileSheetNav from 'ui-patterns/MobileSheetNav/MobileSheetNav'
import { useEditorType } from '../editors/EditorsLayout.hooks'
import { useSetMainScrollContainer } from '../MainScrollContainerContext'
import BuildingState from './BuildingState'
import ConnectingState from './ConnectingState'
import { LoadingState } from './LoadingState'
import { ProjectPausedState } from './PausedState/ProjectPausedState'
import { PauseFailedState } from './PauseFailedState'
import { PausingState } from './PausingState'
import ProductMenuBar from './ProductMenuBar'
import { ResizingState } from './ResizingState'
import RestartingState from './RestartingState'
import { RestoreFailedState } from './RestoreFailedState'
import RestoringState from './RestoringState'
import { UpgradingState } from './UpgradingState'

// [Joshen] This is temporary while we unblock users from managing their project
// if their project is not responding well for any reason. Eventually needs a bit of an overhaul
const routesToIgnoreProjectDetailsRequest = [
  '/project/[ref]/settings/general',
  '/project/[ref]/database/settings',
  '/project/[ref]/storage/settings',
  '/project/[ref]/settings/infrastructure',
  '/project/[ref]/settings/addons',
]

const routesToIgnoreDBConnection = [
  '/project/[ref]/branches',
  '/project/[ref]/database/backups/scheduled',
  '/project/[ref]/database/backups/pitr',
  '/project/[ref]/settings/addons',
  '/project/[ref]/functions',
]

const routesToIgnorePostgrestConnection = [
  '/project/[ref]/reports',
  '/project/[ref]/settings/general',
  '/project/[ref]/database/settings',
  '/project/[ref]/settings/infrastructure',
  '/project/[ref]/settings/addons',
]

export interface ProjectLayoutProps {
  title?: string
  isLoading?: boolean
  isBlocking?: boolean
  product?: string
  productMenu?: ReactNode
  selectedTable?: string
  resizableSidebar?: boolean
  productMenuClassName?: string
}

export const ProjectLayout = forwardRef<HTMLDivElement, PropsWithChildren<ProjectLayoutProps>>(
  (
    {
      title,
      isLoading = false,
      isBlocking = true,
      product = '',
      productMenu,
      children,
      selectedTable,
      resizableSidebar = false,

      productMenuClassName,
    },
    ref
  ) => {
    const router = useRouter()
    const { data: selectedOrganization } = useSelectedOrganizationQuery()
    const { data: selectedProject } = useSelectedProjectQuery()
    const { mobileMenuOpen, showSidebar, setMobileMenuOpen } = useAppStateSnapshot()

    const setMainScrollContainer = useSetMainScrollContainer()
    const combinedRef = mergeRefs(ref, setMainScrollContainer)

    const { appTitle } = useCustomContent(['app:title'])
    const titleSuffix = appTitle || 'Supabase'

    const editor = useEditorType()
    const forceShowProductMenu = editor === undefined
    const sideBarIsOpen = forceShowProductMenu || showSidebar

    const projectName = selectedProject?.name
    const organizationName = selectedOrganization?.name

    const isPaused = selectedProject?.status === PROJECT_STATUS.INACTIVE

    const ignorePausedState =
      router.pathname === '/project/[ref]' ||
      router.pathname.includes('/project/[ref]/settings') ||
      router.pathname.includes('/project/[ref]/functions')
    const showPausedState = isPaused && !ignorePausedState

    const sidebarMinSizePercentage = 1
    const sidebarDefaultSizePercentage = 15
    const sidebarMaxSizePercentage = 33

    return (
      <>
        <Head>
          <title>
            {title
              ? `${title} | ${titleSuffix}`
              : selectedTable
                ? `${selectedTable} | ${projectName} | ${organizationName} | ${titleSuffix}`
                : projectName
                  ? `${projectName} | ${organizationName} | ${titleSuffix}`
                  : organizationName
                    ? `${organizationName} | ${titleSuffix}`
                    : titleSuffix}
          </title>
          <meta name="description" content="Supabase Studio" />
        </Head>
        <div className="flex flex-row h-full w-full">
          {/*  autoSaveId="project-layout" */}
          <ResizablePanelGroup direction="horizontal">
            {productMenu && (
              <ResizablePanel
                order={1}
                minSize={sidebarMinSizePercentage}
                maxSize={sidebarMaxSizePercentage}
                defaultSize={sidebarDefaultSizePercentage}
                id="panel-left"
                className={cn(
                  'hidden md:block',
                  'transition-[max-width,min-width,width] duration-[120ms]',
                  sideBarIsOpen
                    ? resizableSidebar
                      ? 'min-w-64 max-w-[32rem]'
                      : 'min-w-64 max-w-64'
                    : 'w-0 flex-shrink-0 max-w-0'
                )}
              >
                {sideBarIsOpen && (
                  <AnimatePresence initial={false}>
                    <motion.div
                      initial={{ width: 0, opacity: 0, height: '100%' }}
                      animate={{ width: 'auto', opacity: 1, height: '100%' }}
                      exit={{ width: 0, opacity: 0, height: '100%' }}
                      className="h-full"
                      transition={{ duration: 0.12 }}
                    >
                      <MenuBarWrapper
                        isLoading={isLoading}
                        isBlocking={isBlocking}
                        productMenu={productMenu}
                      >
                        <ProductMenuBar title={product} className={productMenuClassName}>
                          {productMenu}
                        </ProductMenuBar>
                      </MenuBarWrapper>
                    </motion.div>
                  </AnimatePresence>
                )}
              </ResizablePanel>
            )}
            {productMenu && sideBarIsOpen && (
              <ResizableHandle
                withHandle
                disabled={resizableSidebar ? false : true}
                className="hidden md:flex"
              />
            )}
            <ResizablePanel
              order={2}
              minSize={100 - sidebarMaxSizePercentage}
              maxSize={100 - sidebarMinSizePercentage}
              defaultSize={100 - sidebarDefaultSizePercentage}
              id="panel-project-content"
              className={cn('h-full flex flex-col w-full xl:min-w-[600px] bg-dash-sidebar')}
            >
              <main
                className="h-full flex flex-col flex-1 w-full overflow-y-auto overflow-x-hidden @container"
                ref={combinedRef}
              >
                {showPausedState ? (
                  <div className="mx-auto my-16 w-full h-full max-w-7xl flex items-center">
                    <div className="w-full">
                      <ProjectPausedState product={product} />
                    </div>
                  </div>
                ) : (
                  <ContentWrapper isLoading={isLoading} isBlocking={isBlocking}>
                    <ResourceExhaustionWarningBanner />
                    {children}
                  </ContentWrapper>
                )}
              </main>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
        <CreateBranchModal />
        <ProjectAPIDocs />
        <MobileSheetNav open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          {productMenu}
        </MobileSheetNav>
      </>
    )
  }
)

ProjectLayout.displayName = 'ProjectLayout'

export const ProjectLayoutWithAuth = withAuth(ProjectLayout)

interface MenuBarWrapperProps {
  isLoading: boolean
  isBlocking?: boolean
  productMenu?: ReactNode
  children: ReactNode
}

const MenuBarWrapper = ({
  isLoading,
  isBlocking = true,
  productMenu,
  children,
}: MenuBarWrapperProps) => {
  const router = useRouter()
  const { data: selectedProject } = useSelectedProjectQuery()
  const requiresProjectDetails = !routesToIgnoreProjectDetailsRequest.includes(router.pathname)

  if (!isBlocking) {
    return children
  }

  const showMenuBar =
    !requiresProjectDetails || (requiresProjectDetails && selectedProject !== undefined)

  return !isLoading && productMenu && showMenuBar ? children : null
}

interface ContentWrapperProps {
  isLoading: boolean
  isBlocking?: boolean
  children: ReactNode
}

/**
 * Check project.status to show building state or error state
 *
 * [Joshen] As of 210422: Current testing connection by pinging postgres
 * Ideally we'd have a more specific monitoring of the project such as during restarts
 * But that will come later: https://supabase.slack.com/archives/C01D6TWFFFW/p1650427619665549
 *
 * Just note that this logic does not differentiate between a "restarting" state and
 * a "something is wrong and can't connect to project" state.
 *
 * [TODO] Next iteration should scrape long polling and just listen to the project's status
 */
const ContentWrapper = ({ isLoading, isBlocking = true, children }: ContentWrapperProps) => {
  const router = useRouter()
  const { ref } = useParams()
  const state = useDatabaseSelectorStateSnapshot()
  const { data: selectedProject } = useSelectedProjectQuery()
  const isHomeNew = usePHFlag('homeNew') === 'new-home'

  const isBranchesPage = router.pathname.includes('/project/[ref]/branches')
  const isSettingsPages = router.pathname.includes('/project/[ref]/settings')
  const isEdgeFunctionPages = router.pathname.includes('/project/[ref]/functions')
  const isVaultPage = router.pathname === '/project/[ref]/settings/vault'
  const isBackupsPage = router.pathname.includes('/project/[ref]/database/backups')
  const isHomePage = router.pathname === '/project/[ref]'

  const requiresDbConnection: boolean =
    (!isEdgeFunctionPages &&
      !isSettingsPages &&
      !routesToIgnoreDBConnection.includes(router.pathname)) ||
    isVaultPage
  const requiresPostgrestConnection = !routesToIgnorePostgrestConnection.includes(router.pathname)
  const requiresProjectDetails = !routesToIgnoreProjectDetailsRequest.includes(router.pathname)

  const isRestarting = selectedProject?.status === PROJECT_STATUS.RESTARTING
  const isResizing = selectedProject?.status === PROJECT_STATUS.RESIZING
  const isProjectUpgrading = selectedProject?.status === PROJECT_STATUS.UPGRADING
  const isProjectRestoring = selectedProject?.status === PROJECT_STATUS.RESTORING
  const isProjectRestoreFailed = selectedProject?.status === PROJECT_STATUS.RESTORE_FAILED
  const isProjectBuilding =
    selectedProject?.status === PROJECT_STATUS.COMING_UP ||
    selectedProject?.status === PROJECT_STATUS.UNKNOWN
  const isProjectPausing = selectedProject?.status === PROJECT_STATUS.PAUSING
  const isProjectPauseFailed = selectedProject?.status === PROJECT_STATUS.PAUSE_FAILED
  const isProjectOffline = selectedProject?.postgrestStatus === 'OFFLINE'

  // handle redirect to home for building state
  const shouldRedirectToHomeForBuilding =
    isHomeNew && requiresDbConnection && isProjectBuilding && !isBranchesPage && !isHomePage

  // We won't be showing the building state with the new home page
  const shouldShowBuildingState =
    requiresDbConnection && isProjectBuilding && !isBranchesPage && !(isHomeNew && isHomePage)

  useEffect(() => {
    if (shouldRedirectToHomeForBuilding && ref) {
      router.replace(`/project/${ref}`)
    }
  }, [shouldRedirectToHomeForBuilding, ref, router])

  useEffect(() => {
    if (ref) state.setSelectedDatabaseId(ref)
  }, [ref])

  if (isBlocking && (isLoading || (requiresProjectDetails && selectedProject === undefined))) {
    return router.pathname.endsWith('[ref]') ? <LoadingState /> : <LogoLoader />
  }

  if (isRestarting && !isBackupsPage) {
    return <RestartingState />
  }

  if (isResizing && !isBackupsPage) {
    return <ResizingState />
  }

  if (isProjectUpgrading && !isBackupsPage) {
    return <UpgradingState />
  }

  if (isProjectPausing) {
    return <PausingState project={selectedProject} />
  }

  if (isProjectPauseFailed) {
    return <PauseFailedState />
  }

  if (requiresPostgrestConnection && isProjectOffline) {
    return <ConnectingState project={selectedProject} />
  }

  if (requiresDbConnection && isProjectRestoring) {
    return <RestoringState />
  }

  if (isProjectRestoreFailed && !isBackupsPage && !isEdgeFunctionPages) {
    return <RestoreFailedState />
  }

  if (shouldRedirectToHomeForBuilding) {
    return <LogoLoader />
  }

  if (shouldShowBuildingState) {
    return <BuildingState />
  }

  return <Fragment key={selectedProject?.ref}>{children}</Fragment>
}
