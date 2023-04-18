import Head from 'next/head'
import { ReactNode, Fragment } from 'react'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import { useStore, withAuth, useFlag } from 'hooks'
import { useParams } from 'common/hooks'
import { PROJECT_STATUS } from 'lib/constants'

import Connecting from 'components/ui/Loading'
import NavigationBar from './NavigationBar/NavigationBar'
import ProductMenuBar from './ProductMenuBar'
import LayoutHeader from './LayoutHeader'
import ConnectingState from './ConnectingState'
import PausingState from './PausingState'
import BuildingState from './BuildingState'
import { ProjectContextProvider } from './ProjectContext'
import RestoringState from './RestoringState'
import UpgradingState from './UpgradingState'
import ProjectPausedState from './ProjectPausedState'

export interface ProjectLayoutProps {
  title?: string
  isLoading?: boolean
  product?: string
  productMenu?: ReactNode
  hideHeader?: boolean
  hideIconBar?: boolean
  children: ReactNode
}

const ProjectLayout = ({
  title,
  isLoading = false,
  product = '',
  productMenu,
  children,
  hideHeader = false,
  hideIconBar = false,
}: ProjectLayoutProps) => {
  const { ui } = useStore()
  const router = useRouter()
  const { ref: projectRef } = useParams()
  const ongoingIncident = useFlag('ongoingIncident')
  const projectName = ui.selectedProject?.name

  const isPaused = ui.selectedProject?.status === PROJECT_STATUS.INACTIVE
  const ignorePausedState =
    router.pathname === '/project/[ref]' || router.pathname.includes('/project/[ref]/settings')
  const showPausedState = isPaused && !ignorePausedState

  return (
    <ProjectContextProvider projectRef={projectRef}>
      <Head>
        <title>
          {title ? `${title} | Supabase` : projectName ? `${projectName} | Supabase` : 'Supabase'}
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

        <main
          className="flex flex-col flex-1 w-full overflow-x-hidden"
          style={{ height: ongoingIncident ? 'calc(100vh - 44px)' : '100vh' }}
        >
          {!hideHeader && <LayoutHeader />}
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
  )
}

export const ProjectLayoutWithAuth = withAuth(observer(ProjectLayout))

export default observer(ProjectLayout)

interface MenuBarWrapperProps {
  isLoading: boolean
  productMenu?: ReactNode
  children: ReactNode
}

const MenuBarWrapper = observer(({ isLoading, productMenu, children }: MenuBarWrapperProps) => {
  const { ui } = useStore()
  return <>{!isLoading && productMenu && ui.selectedProject !== undefined ? children : null}</>
})

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
const ContentWrapper = observer(({ isLoading, children }: ContentWrapperProps) => {
  const { ui } = useStore()
  const router = useRouter()

  const routesToIgnorePostgrestConnection = [
    '/project/[ref]/reports',
    '/project/[ref]/settings/general',
    '/project/[ref]/settings/database',
    '/project/[ref]/settings/billing/subscription',
    '/project/[ref]/settings/billing/update',
    '/project/[ref]/settings/billing/update/free',
    '/project/[ref]/settings/billing/update/pro',
  ]

  const requiresDbConnection: boolean = router.pathname !== '/project/[ref]/settings/general'
  const requiresPostgrestConnection = !routesToIgnorePostgrestConnection.includes(router.pathname)

  const isProjectUpgrading = ui.selectedProject?.status === PROJECT_STATUS.UPGRADING
  const isProjectRestoring = ui.selectedProject?.status === PROJECT_STATUS.RESTORING
  const isProjectBuilding = ui.selectedProject?.status === PROJECT_STATUS.COMING_UP
  const isProjectPausing = ui.selectedProject?.status === PROJECT_STATUS.GOING_DOWN
  const isProjectOffline = ui.selectedProject?.postgrestStatus === 'OFFLINE'

  return (
    <>
      {isLoading || ui.selectedProject === undefined ? (
        <Connecting />
      ) : isProjectUpgrading ? (
        <UpgradingState />
      ) : isProjectPausing ? (
        <PausingState project={ui.selectedProject} />
      ) : requiresPostgrestConnection && isProjectOffline ? (
        <ConnectingState project={ui.selectedProject} />
      ) : requiresDbConnection && isProjectRestoring ? (
        <RestoringState />
      ) : requiresDbConnection && isProjectBuilding ? (
        <BuildingState project={ui.selectedProject} />
      ) : (
        <Fragment key={ui.selectedProject.ref}>{children}</Fragment>
      )}
    </>
  )
})

/**
 * Shows the children irregardless of whether the selected project has loaded or not
 * We'll eventually want to use this instead of the current ProjectLayout to prevent
 * a catch-all spinner on the dashboard
 */
export const ProjectLayoutNonBlocking = observer(
  ({
    title,
    product = '',
    productMenu,
    children,
    hideHeader = false,
    hideIconBar = false,
  }: ProjectLayoutProps) => {
    const { ui } = useStore()
    const router = useRouter()
    const { ref: projectRef } = useParams()
    const ongoingIncident = useFlag('ongoingIncident')
    const isPaused = ui.selectedProject?.status === PROJECT_STATUS.INACTIVE
    const ignorePausedState =
      router.pathname === '/project/[ref]' || router.pathname.includes('/project/[ref]/settings')
    const showPausedState = isPaused && !ignorePausedState

    return (
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

          <main
            className="flex w-full flex-1 flex-col overflow-x-hidden"
            style={{ height: ongoingIncident ? 'calc(100vh - 44px)' : '100vh' }}
          >
            {!hideHeader && <LayoutHeader />}
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
    )
  }
)
