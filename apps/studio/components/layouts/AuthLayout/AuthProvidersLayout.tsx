import { PropsWithChildren } from 'react'

import { useParams } from 'common'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import AuthLayout from './AuthLayout'

export const AuthProvidersLayout = ({ children }: PropsWithChildren<{}>) => {
  const { ref } = useParams()
  const showThirdPartyAuth = useIsFeatureEnabled('authentication:third_party_auth')

  const navItems = [
    {
      label: 'Supabase Auth',
      href: `/project/${ref}/auth/providers`,
    },
    ...(showThirdPartyAuth
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
      <PageLayout
        title="Sign In / Providers"
        subtitle="Configure authentication providers and login methods for your users"
        navigationItems={navItems}
      >
        {children}
      </PageLayout>
    </AuthLayout>
  )
}
