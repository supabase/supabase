import Head from 'next/head'
import { FC, ReactNode } from 'react'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import { useStore } from 'hooks'

import Connecting from 'components/ui/Loading'
import NavigationBar from './NavigationBar/NavigationBar'
import ProductMenuBar from './ProductMenuBar'
import LayoutHeader from './LayoutHeader'
import TestConnection from './TestConnection'

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

export default observer(ProjectLayout)

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

const ContentWrapper: FC<ContentWrapperProps> = observer(({ isLoading, children }) => {
  const { ui } = useStore()
  const router = useRouter()
  const project = ui.selectedProject
  const requiresDbConnection: boolean = router.pathname !== '/project/[ref]/settings/general'

  return (
    <>
      {isLoading || project === undefined ? (
        <Connecting />
      ) : requiresDbConnection ? (
        <TestConnection project={project!}>
          <div className="flex flex-col flex-1 overflow-y-auto">{children}</div>
        </TestConnection>
      ) : (
        <>{children}</>
      )}
    </>
  )
})
