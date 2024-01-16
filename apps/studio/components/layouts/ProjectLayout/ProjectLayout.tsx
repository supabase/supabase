import { useParams } from 'common'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { Fragment, PropsWithChildren, ReactNode, useEffect } from 'react'

import ProjectAPIDocs from 'components/interfaces/ProjectAPIDocs/ProjectAPIDocs'
import AISettingsModal from 'components/ui/AISettingsModal'
import Connecting from 'components/ui/Loading/Loading'
import ResourceExhaustionWarningBanner from 'components/ui/ResourceExhaustionWarningBanner/ResourceExhaustionWarningBanner'
import { useFlag, useSelectedOrganization, useSelectedProject, withAuth } from 'hooks'
import { IS_PLATFORM, PROJECT_STATUS } from 'lib/constants'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import AppLayout from '../AppLayout/AppLayout'
import EnableBranchingModal from '../AppLayout/EnableBranchingButton/EnableBranchingModal'
import BuildingState from './BuildingState'
import ConnectingState from './ConnectingState'
import LayoutHeader from './LayoutHeader'
import LoadingState from './LoadingState'
import NavigationBar from './NavigationBar/NavigationBar'
import PausingState from './PausingState'
import ProductMenuBar from './ProductMenuBar'
import { ProjectContextProvider } from './ProjectContext'
import ProjectPausedState from './ProjectPausedState'
import RestoringState from './RestoringState'
import UpgradingState from './UpgradingState'

// [Joshen] This is temporary while we unblock users from managing their project
// if their project is not responding well for any reason. Eventually needs a bit of an overhaul
const routesToIgnoreProjectDetailsRequest = [
  '/project/[ref]/settings/general',
  '/project/[ref]/settings/database',
  '/project/[ref]/settings/storage',
  '/project/[ref]/settings/infrastructure',
  '/project/[ref]/settings/addons',
]

const routesToIgnoreDBConnection = [
  '/project/[ref]/branches',
  '/project/[ref]/database/backups/scheduled',
  '/project/[ref]/settings/addons',
]

const routesToIgnorePostgrestConnection = [
  '/project/[ref]/reports',
  '/project/[ref]/settings/general',
  '/project/[ref]/settings/database',
  '/project/[ref]/settings/infrastructure',
  '/project/[ref]/settings/addons',
]

export interface ProjectLayoutProps {
  title?: string
  isLoading?: boolean
  isBlocking?: boolean
  product?: string
  productMenu?: ReactNode
  hideHeader?: boolean
  hideIconBar?: boolean
  selectedTable?: string
}

const ProjectLayout = ({
  title,
  isLoading = false,
  isBlocking = true,
  product = '',
  productMenu,
  children,
  hideHeader = false,
  hideIconBar = false,
  selectedTable,
}: PropsWithChildren<ProjectLayoutProps>) => {
  const router = useRouter()
  const { ref: projectRef } = useParams()
  const selectedOrganization = useSelectedOrganization()
  const selectedProject = useSelectedProject()
  const projectName = selectedProject?.name
  const organizationName = selectedOrganization?.name

  const navLayoutV2 = useFlag('navigationLayoutV2')

  const isPaused = selectedProject?.status === PROJECT_STATUS.INACTIVE
  const ignorePausedState =
    router.pathname === '/project/[ref]' || router.pathname.includes('/project/[ref]/settings')
  const showPausedState = isPaused && !ignorePausedState

  return (
    <AppLayout>
      <ProjectContextProvider projectRef={projectRef}>
        <Head>
          <title>
            {title
              ? `${title} | Supabase`
              : selectedTable
              ? `${selectedTable} | ${projectName} | ${organizationName} | Supabase`
              : projectName
              ? `${projectName} | ${organizationName} | Supabase`
              : organizationName
              ? `${organizationName} | Supabase`
              : 'Supabase'}
          </title>
          <meta name="description" content="Supabase Studio" />
        </Head>
        <div className="flex h-full">
          {/* Left-most navigation side bar to access products */}
          {!hideIconBar && <NavigationBar />}
          {/* Product menu bar */}
          {!showPausedState && (
            <MenuBarWrapper isLoading={isLoading} isBlocking={isBlocking} productMenu={productMenu}>
              <ProductMenuBar title={product}>{productMenu}</ProductMenuBar>
            </MenuBarWrapper>
          )}
          <main className="flex flex-col flex-1 w-full overflow-x-hidden">
            {!navLayoutV2 && !hideHeader && IS_PLATFORM && <LayoutHeader />}
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
        </div>

        <EnableBranchingModal />
        <AISettingsModal />
        <ProjectAPIDocs />
      </ProjectContextProvider>
    </AppLayout>
  )
}

export const ProjectLayoutWithAuth = withAuth(ProjectLayout)

export default ProjectLayout

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
  const selectedProject = useSelectedProject()
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
  const selectedProject = useSelectedProject()

  const isSettingsPages = router.pathname.includes('/project/[ref]/settings')
  const isVaultPage = router.pathname === '/project/[ref]/settings/vault'

  const requiresDbConnection: boolean =
    (!isSettingsPages && !routesToIgnoreDBConnection.includes(router.pathname)) || isVaultPage
  const requiresPostgrestConnection = !routesToIgnorePostgrestConnection.includes(router.pathname)
  const requiresProjectDetails = !routesToIgnoreProjectDetailsRequest.includes(router.pathname)

  const isProjectUpgrading = selectedProject?.status === PROJECT_STATUS.UPGRADING
  const isProjectRestoring = selectedProject?.status === PROJECT_STATUS.RESTORING
  const isProjectBuilding =
    selectedProject?.status === PROJECT_STATUS.COMING_UP ||
    selectedProject?.status === PROJECT_STATUS.UNKNOWN
  const isProjectPausing =
    selectedProject?.status === PROJECT_STATUS.GOING_DOWN ||
    selectedProject?.status === PROJECT_STATUS.PAUSING
  const isProjectOffline = selectedProject?.postgrestStatus === 'OFFLINE'

  useEffect(() => {
    if (ref) state.setSelectedDatabaseId(ref)
  }, [ref])

  if (isBlocking && (isLoading || (requiresProjectDetails && selectedProject === undefined))) {
    return router.pathname.endsWith('[ref]') ? <LoadingState /> : <Connecting />
  }

  if (isProjectUpgrading) {
    return <UpgradingState />
  }

  if (isProjectPausing) {
    return <PausingState project={selectedProject} />
  }

  if (requiresPostgrestConnection && isProjectOffline) {
    return <ConnectingState project={selectedProject} />
  }

  if (requiresDbConnection && isProjectRestoring) {
    return <RestoringState />
  }

  if (requiresDbConnection && isProjectBuilding) {
    return <BuildingState />
  }

  return <Fragment key={selectedProject?.ref}>{children}</Fragment>
}
