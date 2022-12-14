import Head from 'next/head'
import { FC, ReactNode, PropsWithChildren, Fragment } from 'react'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import { useStore, withAuth, useFlag, useParams } from 'hooks'
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

interface Props {
  title?: string
  isLoading?: boolean
  product?: string
  productMenu?: ReactNode
  hideHeader?: boolean
  hideIconBar?: boolean
}

const ProjectLayout = ({
  title,
  isLoading = false,
  product = '',
  productMenu,
  children,
  hideHeader = false,
  hideIconBar = false,
}: PropsWithChildren<Props>) => {
  const { ref: projectRef } = useParams()
  const { ui } = useStore()
  const ongoingIncident = useFlag('ongoingIncident')
  const projectName = ui.selectedProject?.name

  return (
    <ProjectContextProvider projectRef={projectRef}>
      <Head>
        <title>
          {title ? `${title} | Supabase` : projectName ? `${projectName} | Supabase` : 'Supabase'}
        </title>
        <meta name="description" content="Supabase Studio" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex h-full">
        {/* Left-most navigation side bar to access products */}
        {!hideIconBar && <NavigationBar />}

        {/* Product menu bar */}
        <MenuBarWrapper isLoading={isLoading} productMenu={productMenu}>
          <ProductMenuBar title={product}>{productMenu}</ProductMenuBar>
        </MenuBarWrapper>

        <main
          className="flex flex-col flex-1 w-full overflow-x-hidden"
          style={{ height: ongoingIncident ? 'calc(100vh - 44px)' : '100vh' }}
        >
          {!hideHeader && <LayoutHeader />}
          <ContentWrapper isLoading={isLoading}>{children}</ContentWrapper>
        </main>
      </div>
    </ProjectContextProvider>
  )
}

export const ProjectLayoutWithAuth = withAuth(observer(ProjectLayout))

export default ProjectLayout

interface MenuBarWrapperProps {
  isLoading: boolean
  productMenu?: ReactNode
}

const MenuBarWrapper: FC<MenuBarWrapperProps> = observer(({ isLoading, productMenu, children }) => {
  const { ui } = useStore()
  return <>{!isLoading && productMenu && ui.selectedProject !== undefined ? children : null}</>
})

interface ContentWrapperProps {
  isLoading: boolean
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
const ContentWrapper: FC<ContentWrapperProps> = observer(({ isLoading, children }) => {
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

  const isProjectRestoring = ui.selectedProject?.status === PROJECT_STATUS.RESTORING
  const isProjectBuilding = [PROJECT_STATUS.COMING_UP, PROJECT_STATUS.RESTORING].includes(
    ui.selectedProject?.status ?? ''
  )
  const isProjectPausing = ui.selectedProject?.status === PROJECT_STATUS.GOING_DOWN
  const isProjectOffline = ui.selectedProject?.postgrestStatus === 'OFFLINE'

  return (
    <>
      {isLoading || ui.selectedProject === undefined ? (
        <Connecting />
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
