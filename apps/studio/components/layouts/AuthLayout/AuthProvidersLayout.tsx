import { PropsWithChildren } from 'react'

import { useParams } from 'common'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { UnknownInterface } from 'components/ui/UnknownInterface'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import AuthLayout from './AuthLayout'

export const AuthProvidersLayout = ({ children }: PropsWithChildren<{}>) => {
  const { ref } = useParams()
  const { authenticationSignInProviders, authenticationThirdPartyAuth } = useIsFeatureEnabled([
    'authentication:sign_in_providers',
    'authentication:third_party_auth',
  ])

  const navItems = [
    {
      label: 'Supabase Auth',
      href: `/project/${ref}/auth/providers`,
    },
    ...(authenticationThirdPartyAuth
      ? [
          {
            label: 'Third Party Auth',
            href: `/project/${ref}/auth/third-party`,
          },
        ]
      : []),
  ]

  return (
    <AuthLayout>
      {authenticationSignInProviders ? (
        <PageLayout
          title="Sign In / Providers"
          subtitle="Configure authentication providers and login methods for your users"
          navigationItems={navItems}
        >
          {children}
        </PageLayout>
      ) : (
        <UnknownInterface urlBack={`/project/${ref}/auth/users`} />
      )}
    </AuthLayout>
  )
}
