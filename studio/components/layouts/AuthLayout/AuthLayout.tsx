import { useEffect, PropsWithChildren } from 'react'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'

import ProjectLayout from '../'
import { useStore, withAuth } from 'hooks'
import ProductMenu from 'components/ui/ProductMenu'
import { generateAuthMenu } from './AuthLayout.utils'
import { useParams } from 'common'

export interface AuthLayoutProps {
  title?: string
}

const AuthLayout = ({ title, children }: PropsWithChildren<AuthLayoutProps>) => {
  const { ref: projectRef } = useParams()
  const { ui, meta } = useStore()

  const router = useRouter()
  const page = router.pathname.split('/')[4]

  useEffect(() => {
    if (ui.selectedProject?.ref) {
      meta.policies.load()
      meta.roles.load()
    }
  }, [ui.selectedProject?.ref])

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
