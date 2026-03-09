import { useParams } from 'common'
import { ProductMenu } from 'components/ui/ProductMenu'
import { useAuthConfigPrefetch } from 'data/auth/auth-config-query'
import { withAuth } from 'hooks/misc/withAuth'
import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'

import { ProjectLayout } from '../ProjectLayout'
import { useGenerateAuthMenu } from './AuthLayout.utils'

const AUTH_SECTION_TITLE_BY_PAGE: Record<string, string> = {
  overview: 'Overview',
  users: 'Users',
  'oauth-apps': 'OAuth Apps',
  policies: 'Policies',
  providers: 'Sign In / Providers',
  'third-party': 'Sign In / Providers',
  'oauth-server': 'OAuth Server',
  sessions: 'Sessions',
  'rate-limits': 'Rate Limits',
  mfa: 'Multi-Factor',
  'url-configuration': 'URL Configuration',
  protection: 'Attack Protection',
  hooks: 'Auth Hooks',
  'audit-logs': 'Audit Logs',
  performance: 'Performance',
  templates: 'Email',
  smtp: 'Email',
}

const AuthProductMenu = () => {
  const router = useRouter()
  const { ref: projectRef = 'default' } = useParams()

  useAuthConfigPrefetch({ projectRef })
  const page = router.pathname.split('/')[4]
  const menu = useGenerateAuthMenu()

  return <ProductMenu page={page} menu={menu} />
}

const AuthLayout = ({ children }: PropsWithChildren<{}>) => {
  const router = useRouter()
  const page = router.pathname.split('/')[4]
  const sectionTitle = page !== undefined ? AUTH_SECTION_TITLE_BY_PAGE[page] : undefined

  return (
    <ProjectLayout
      title={sectionTitle}
      product="Authentication"
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
