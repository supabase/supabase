import { useParams } from 'common'
import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'

import ProductMenu from 'components/ui/ProductMenu'
import { useAuthConfigPrefetch } from 'data/auth/auth-config-query'
import { useFlag, withAuth } from 'hooks'
import ProjectLayout from '../'
import { generateAuthMenu } from './AuthLayout.utils'

export interface AuthLayoutProps {
  title?: string
}

const AuthLayout = ({ title, children }: PropsWithChildren<AuthLayoutProps>) => {
  const { ref: projectRef = 'default' } = useParams()
  const hooksReleased = useFlag('authHooksReleased')

  useAuthConfigPrefetch({ projectRef })

  const router = useRouter()
  const page = router.pathname.split('/')[4]

  return (
    <ProjectLayout
      title={title || 'Authentication'}
      product="Authentication"
      productMenu={
        <ProductMenu
          page={page}
          menu={generateAuthMenu(projectRef ?? 'default', { hooksReleased })}
        />
      }
      isBlocking={false}
    >
      <main style={{ maxHeight: '100vh' }} className="flex-1 overflow-y-auto">
        {children}
      </main>
    </ProjectLayout>
  )
}

export default withAuth(AuthLayout)
