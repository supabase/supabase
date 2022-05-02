import Head from 'next/head'
import { FC, ReactNode } from 'react'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import { useStore } from 'hooks'
import { PROJECT_STATUS } from 'lib/constants'

import Connecting from 'components/ui/Loading'
import NavigationBar from './NavigationBar/NavigationBar'
import ProductMenuBar from './ProductMenuBar'
import LayoutHeader from './LayoutHeader'
import ConnectingState from './ConnectingState'
import BuildingState from './BuildingState'

interface Props {
  title?: string
  isLoading?: boolean
  product?: string
  productMenu?: ReactNode
  children: ReactNode
  hideHeader?: boolean
  hideIconBar?: boolean
}

const ProjectLayout: FC<Props> = ({
  title,
  isLoading = false,
  product = '',
  productMenu,
  children,
  hideHeader = false,
  hideIconBar = false,
}) => {
  return (
    <>
      <Head>
        <title>{title ? `${title} | Supabase` : 'Supabase'}</title>
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
          style={{ maxHeight: '100vh' }}
          className="w-full flex flex-col flex-1 overflow-x-hidden"
        >
          {!hideHeader && <LayoutHeader />}
          <ContentWrapper isLoading={isLoading}>{children}</ContentWrapper>
        </main>
      </div>
    </>
  )
}

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
  const requiresDbConnection: boolean = router.pathname !== '/project/[ref]/settings/general'
  const isProjectBuilding = [PROJECT_STATUS.COMING_UP, PROJECT_STATUS.RESTORING].includes(
    ui.selectedProject?.status ?? ''
  )
  const isProjectOffline = ui.selectedProject?.postgrestStatus === 'OFFLINE'

  return (
    <>
      {isLoading || ui.selectedProject === undefined ? (
        <Connecting />
      ) : requiresDbConnection && isProjectOffline ? (
        <ConnectingState project={ui.selectedProject} />
      ) : requiresDbConnection && isProjectBuilding ? (
        <BuildingState project={ui.selectedProject} />
      ) : (
        <>{children}</>
      )}
    </>
  )
})
