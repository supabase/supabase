import { useParams } from 'common'
import { useIsNavigationV2Enabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { useRouter } from 'next/router'
import type { PropsWithChildren } from 'react'

import { ProjectLayoutV2 } from '../NavigationV2/ProjectLayout'
import { ProjectLayout } from '../ProjectLayout'
import { useGenerateAuthMenu } from './AuthLayout.utils'
import { ProductMenu } from '@/components/ui/ProductMenu'
import { useAuthConfigPrefetch } from '@/data/auth/auth-config-query'
import { withAuth } from '@/hooks/misc/withAuth'

export const AuthProductMenu = () => {
  const router = useRouter()
  const { ref: projectRef = 'default' } = useParams()

  useAuthConfigPrefetch({ projectRef })
  const page = router.pathname.split('/')[4]
  const menu = useGenerateAuthMenu()

  return <ProductMenu page={page} menu={menu} />
}

const AuthLayout = ({ title, children }: PropsWithChildren<{ title: string }>) => {
  const isNavigationV2 = useIsNavigationV2Enabled()

  if (isNavigationV2) {
    return (
      <ProjectLayoutV2 title="Authentication" product="Authentication" isBlocking={false}>
        {children}
      </ProjectLayoutV2>
    )
  }

  return (
    <ProjectLayout
      product="Authentication"
      browserTitle={{ section: title }}
      productMenu={<AuthProductMenu />}
      isBlocking={false}
    >
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
