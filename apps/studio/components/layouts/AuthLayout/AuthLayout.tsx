import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'

import { useFlag, useParams } from 'common'
import { ProductMenu } from 'components/ui/ProductMenu'
import { useAuthConfigPrefetch } from 'data/auth/auth-config-query'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { withAuth } from 'hooks/misc/withAuth'
import { ProjectLayout } from '../ProjectLayout'
import { generateAuthMenu } from './AuthLayout.utils'

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

  return (
    <ProductMenu
      page={page}
      menu={generateAuthMenu(projectRef, {
        authenticationSignInProviders,
        authenticationRateLimits,
        authenticationEmails,
        authenticationMultiFactor,
        authenticationAttackProtection,
        authenticationShowOverview,
        authenticationOauth21,
        authenticationPerformance,
      })}
    />
  )
}

const AuthLayout = ({ children }: PropsWithChildren<{}>) => {
  return (
    <ProjectLayout
      title="Authentication"
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
