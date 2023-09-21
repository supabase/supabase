import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import { PropsWithChildren, useEffect } from 'react'

import { useParams } from 'common'
import ProductMenu from 'components/ui/ProductMenu'
import { useAuthConfigPrefetch } from 'data/auth/auth-config-query'
import { useStore, withAuth } from 'hooks'
import ProjectLayout from '../'
import { generateAuthMenu } from './AuthLayout.utils'

export interface AuthLayoutProps {
  title?: string
}

const AuthLayout = ({ title, children }: PropsWithChildren<AuthLayoutProps>) => {
  const { ref: projectRef = 'default' } = useParams()
  const { ui, meta } = useStore()

  useAuthConfigPrefetch({ projectRef })

  const router = useRouter()
  const page = router.pathname.split('/')[4]

  useEffect(() => {
    if (ui.selectedProjectRef) {
      meta.policies.load()
      meta.roles.load()
    }
  }, [ui.selectedProjectRef])

  return (
    <ProjectLayout
      title={title || 'Authentication'}
      product="Authentication"
      productMenu={<ProductMenu page={page} menu={generateAuthMenu(projectRef ?? 'default')} />}
    >
      <main style={{ maxHeight: '100vh' }} className="flex-1 overflow-y-auto">
        {children}
      </main>
    </ProjectLayout>
  )
}

export default withAuth(observer(AuthLayout))
