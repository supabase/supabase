import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import { PropsWithChildren, useEffect, useState } from 'react'

import { useParams } from 'common'
import Error from 'components/ui/Error'
import ProductMenu from 'components/ui/ProductMenu'
import { useStore, withAuth } from 'hooks'
import ProjectLayout from '../'
import { generateAuthMenu } from './AuthLayout.utils'

export interface AuthLayoutProps {
  title?: string
}

const AuthLayout = ({ title, children }: PropsWithChildren<AuthLayoutProps>) => {
  const { ui, meta } = useStore()
  const { isInitialized, isLoading, error } = meta.tables
  const { ref: projectRef = 'default' } = useParams()

  const router = useRouter()
  const page = router.pathname.split('/')[4]

  const [loaded, setLoaded] = useState<boolean>(isInitialized)

  useEffect(() => {
    if (ui.selectedProjectRef) {
      meta.policies.load()
      meta.tables.load()
      meta.roles.load()
      meta.schemas.load()
    }
  }, [ui.selectedProjectRef])

  useEffect(() => {
    if (!isLoading && !loaded) {
      setLoaded(true)
    }
  }, [isLoading])

  if (error) {
    return (
      <ProjectLayout>
        <Error error={error} />
      </ProjectLayout>
    )
  }

  return (
    <ProjectLayout
      isLoading={!loaded}
      title={title || 'Authentication'}
      product="Authentication"
      productMenu={<ProductMenu page={page} menu={generateAuthMenu(projectRef)} />}
    >
      <main style={{ maxHeight: '100vh' }} className="flex-1 overflow-y-auto">
        {children}
      </main>
    </ProjectLayout>
  )
}

export default withAuth(observer(AuthLayout))
