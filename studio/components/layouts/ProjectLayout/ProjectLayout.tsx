import Head from 'next/head'
import { useRouter } from 'next/router'
import { Fragment, PropsWithChildren, ReactNode } from 'react'

import { useParams } from 'common/hooks'
import Connecting from 'components/ui/Loading'
import { useFlag, useSelectedOrganization, useSelectedProject, withAuth } from 'hooks'
import { PROJECT_STATUS } from 'lib/constants'
import BuildingState from './BuildingState'
import ConnectingState from './ConnectingState'
import LayoutHeader from './LayoutHeader'
import NavigationBar from './NavigationBar/NavigationBar'
import PausingState from './PausingState'
import ProductMenuBar from './ProductMenuBar'
import { ProjectContextProvider } from './ProjectContext'
import ProjectPausedState from './ProjectPausedState'
import RestoringState from './RestoringState'
import UpgradingState from './UpgradingState'
import AppLayout from '../AppLayout/AppLayout'

// [Joshen] This is temporary while we unblock users from managing their project
// if their project is not responding well for any reason. Eventually needs a bit of an overhaul
const routesToIgnoreProjectDetailsRequest = [
  '/project/[ref]/settings/general',
  '/project/[ref]/settings/database',
  '/project/[ref]/settings/storage',
  '/project/[ref]/settings/billing/subscription',
  '/project/[ref]/settings/billing/usage',
  '/project/[ref]/settings/billing/invoices',
]

const routesToIgnorePostgrestConnection = [
  '/project/[ref]/reports',
  '/project/[ref]/settings/general',
  '/project/[ref]/settings/database',
  '/project/[ref]/settings/billing/subscription',
  '/project/[ref]/settings/billing/usage',
  '/project/[ref]/settings/billing/invoices',
]

export interface ProjectLayoutProps {
  title?: string
  isLoading?: boolean
  product?: string
  productMenu?: ReactNode
  hideHeader?: boolean
  hideIconBar?: boolean
  selectedTable?: string
}

const ProjectLayout = ({
  title,
  isLoading = false,
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
            <MenuBarWrapper isLoading={isLoading} productMenu={productMenu}>
              <ProductMenuBar title={product}>{productMenu}</ProductMenuBar>
            </MenuBarWrapper>
          )}

          <main className="flex flex-col flex-1 w-full overflow-x-hidden">
            {!navLayoutV2 && !hideHeader && <LayoutHeader />}
            {showPausedState ? (
              <div className="mx-auto my-16 w-full h-full max-w-7xl flex items-center">
                <div className="w-full">
                  <ProjectPausedState product={product} />
                </div>
              </div>
            ) : (
              <ContentWrapper isLoading={isLoading}>{children}</ContentWrapper>
            )}
          </main>
        </div>
      </ProjectContextProvider>
    </AppLayout>
  )
}

export const ProjectLayoutWithAuth = withAuth(ProjectLayout)

export default ProjectLayout

interface MenuBarWrapperProps {
  isLoading: boolean
  productMenu?: ReactNode
  children: ReactNode
}

const MenuBarWrapper = ({ isLoading, productMenu, children }: MenuBarWrapperProps) => {
  const router = useRouter()
  const selectedProject = useSelectedProject()
  const requiresProjectDetails = !routesToIgnoreProjectDetailsRequest.includes(router.pathname)

  const showMenuBar =
    !requiresProjectDetails || (requiresProjectDetails && selectedProject !== undefined)

  return <>{!isLoading && productMenu && showMenuBar ? children : null}</>
}

interface ContentWrapperProps {
  isLoading: boolean
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
const ContentWrapper = ({ isLoading, children }: ContentWrapperProps) => {
  const selectedProject = useSelectedProject()
  const router = useRouter()

  const requiresDbConnection: boolean =
    !router.pathname.includes('/project/[ref]/settings') ||
    router.pathname.includes('/project/[ref]/settings/vault')
  const requiresPostgrestConnection = !routesToIgnorePostgrestConnection.includes(router.pathname)
  const requiresProjectDetails = !routesToIgnoreProjectDetailsRequest.includes(router.pathname)

  const isProjectUpgrading = selectedProject?.status === PROJECT_STATUS.UPGRADING
  const isProjectRestoring = selectedProject?.status === PROJECT_STATUS.RESTORING
  const isProjectBuilding = selectedProject?.status === PROJECT_STATUS.COMING_UP
  const isProjectPausing =
    selectedProject?.status === PROJECT_STATUS.GOING_DOWN ||
    selectedProject?.status === PROJECT_STATUS.PAUSING
  const isProjectOffline = selectedProject?.postgrestStatus === 'OFFLINE'

  return (
    <>
      {isLoading || (requiresProjectDetails && selectedProject === undefined) ? (
        <Connecting />
      ) : isProjectUpgrading ? (
        <UpgradingState />
      ) : isProjectPausing ? (
        <PausingState project={selectedProject} />
      ) : requiresPostgrestConnection && isProjectOffline ? (
        <ConnectingState project={selectedProject} />
      ) : requiresDbConnection && isProjectRestoring ? (
        <RestoringState />
      ) : requiresDbConnection && isProjectBuilding ? (
        <BuildingState project={selectedProject} />
      ) : (
        <Fragment key={selectedProject?.ref}>{children}</Fragment>
      )}
    </>
  )
}

/**
 * Shows the children irregardless of whether the selected project has loaded or not
 * We'll eventually want to use this instead of the current ProjectLayout to prevent
 * a catch-all spinner on the dashboard
 */
export const ProjectLayoutNonBlocking = ({
  title,
  product = '',
  productMenu,
  children,
  hideHeader = false,
  hideIconBar = false,
}: PropsWithChildren<ProjectLayoutProps>) => {
  const selectedProject = useSelectedProject()
  const router = useRouter()
  const { ref: projectRef } = useParams()
  const isPaused = selectedProject?.status === PROJECT_STATUS.INACTIVE
  const ignorePausedState =
    router.pathname === '/project/[ref]' || router.pathname.includes('/project/[ref]/settings')
  const showPausedState = isPaused && !ignorePausedState

  const navLayoutV2 = useFlag('navigationLayoutV2')

  return (
    <AppLayout>
      <ProjectContextProvider projectRef={projectRef}>
        <Head>
          <title>{title ? `${title} | Supabase` : 'Supabase'}</title>
          <meta name="description" content="Supabase Studio" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <div className="flex h-full">
          {/* Left-most navigation side bar to access products */}
          {!hideIconBar && <NavigationBar />}

          {/* Product menu bar */}
          {productMenu && !showPausedState && (
            <ProductMenuBar title={product}>{productMenu}</ProductMenuBar>
          )}

          <main className="flex w-full flex-1 flex-col overflow-x-hidden">
            {!navLayoutV2 && !hideHeader && <LayoutHeader />}
            {showPausedState ? (
              <div className="mx-auto my-16 w-full h-full max-w-7xl flex items-center">
                <div className="w-full">
                  <ProjectPausedState product={product} />
                </div>
              </div>
            ) : (
              children
            )}
          </main>
        </div>
      </ProjectContextProvider>
    </AppLayout>
  )
}
