import { useLocation } from '@tanstack/react-router'
import { useParams } from 'common'
import type { PropsWithChildren } from 'react'

import { ProjectLayout } from '../ProjectLayout'
import { useGenerateAuthMenu } from './AuthLayout.utils'
import { ProductMenu } from '@/components/ui/ProductMenu'
import { ProductMenuShortcuts } from '@/components/ui/ProductMenu/ProductMenuShortcuts'
import { useAuthConfigPrefetch } from '@/data/auth/auth-config-query'
import { withAuth } from '@/hooks/misc/withAuth'

export const AuthProductMenu = () => {
  const pathname = useLocation({ select: (location) => location.pathname })
  const { ref: projectRef = 'default' } = useParams()

  useAuthConfigPrefetch({ projectRef })
  const page = pathname.split('/')[4]
  const menu = useGenerateAuthMenu()

  return <ProductMenu page={page} menu={menu} />
}

const AuthLayout = ({ title, children }: PropsWithChildren<{ title: string }>) => {
  const pathname = useLocation({ select: (location) => location.pathname })
  const { ref: projectRef = 'default' } = useParams()

  useAuthConfigPrefetch({ projectRef })
  const page = pathname.split('/')[4]
  const menu = useGenerateAuthMenu()

  return (
    <ProjectLayout
      product="Authentication"
      browserTitle={{ section: title }}
      productMenu={<ProductMenu page={page} menu={menu} />}
      isBlocking={false}
    >
      <ProductMenuShortcuts menu={menu} />
      {children}
    </ProjectLayout>
  )
}

/**
 * Layout for all auth pages on the dashboard, wrapped with withAuth to verify logged in state
 *
 * Handles rendering the navigation for each section under the auth pages.
 */
export default withAuth(AuthLayout)
