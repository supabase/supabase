import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'

import { useFlag, useParams } from 'common'
import { ProductMenu } from 'components/ui/ProductMenu'
import { useAuthConfigPrefetch } from 'data/auth/auth-config-query'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { withAuth } from 'hooks/misc/withAuth'
import { ProjectLayout } from '../ProjectLayout'
import { generateAuthMenu } from './AuthLayout.utils'

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

  const authenticationShowOverview = useFlag('authOverviewPage')
  const authenticationOauth21 = useFlag('EnableOAuth21')

  const {
    authenticationSignInProviders,
    authenticationRateLimits,
    authenticationEmails,
    authenticationMultiFactor,
    authenticationAttackProtection,
    authenticationPerformance,
  } = useIsFeatureEnabled([
    'authentication:sign_in_providers',
    'authentication:rate_limits',
    'authentication:emails',
    'authentication:multi_factor',
    'authentication:attack_protection',
    'authentication:performance',
  ])

  useAuthConfigPrefetch({ projectRef })
  const page = router.pathname.split('/')[4]
  const menu = generateAuthMenu(projectRef, {
    authenticationSignInProviders,
    authenticationRateLimits,
    authenticationEmails,
    authenticationMultiFactor,
    authenticationAttackProtection,
    authenticationShowOverview,
    authenticationOauth21,
    authenticationPerformance,
  })

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
