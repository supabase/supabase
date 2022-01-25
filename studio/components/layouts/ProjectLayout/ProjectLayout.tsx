import Head from 'next/head'
import { FC, ReactNode } from 'react'
import { observer } from 'mobx-react-lite'
import { isUndefined } from 'lodash'
import { useRouter } from 'next/router'

import { Project } from 'types'
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
  const { ui } = useStore()
  const project: Project | undefined = ui.selectedProject

  const router = useRouter()
  const requiresDbConnection: boolean = router.pathname !== '/project/[ref]/settings/general'

  // useEffect(() => {
  //   if (isUndefined(project)) router.push('/404')
  // }, [])

  const renderContent = () => {
    if (!isUndefined(project)) {
      return requiresDbConnection ? (
        <TestConnection project={project}>
          {isLoading ? (
            <Connecting />
          ) : (
            <div className="flex flex-col flex-1 overflow-y-auto">{children}</div>
          )}
        </TestConnection>
      ) : (
        <>{children}</>
      )
    } else {
      return <>{children}</>
    }
  }

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
        {productMenu && !isLoading && (
          <ProductMenuBar title={product}>{productMenu}</ProductMenuBar>
        )}

        <main
          style={{ maxHeight: '100vh' }}
          className="w-full flex flex-col flex-1 overflow-x-hidden"
        >
          {!hideHeader && <LayoutHeader />}
          {renderContent()}
        </main>
      </div>
    </>
  )
}

export default observer(ProjectLayout)
