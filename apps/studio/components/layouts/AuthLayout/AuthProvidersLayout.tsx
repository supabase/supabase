import { Link, useMatchRoute } from '@tanstack/react-router'
import { useParams } from 'common'
import { PropsWithChildren } from 'react'
import { NavMenu, NavMenuItem } from 'ui'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { PageNav } from 'ui-patterns/PageNav'

import AuthLayout from './AuthLayout'
import { UnknownInterface } from '@/components/ui/UnknownInterface'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'

export const AuthProvidersLayout = ({ children }: PropsWithChildren<{}>) => {
  const { ref } = useParams()
  const matchRoute = useMatchRoute()
  const { authenticationSignInProviders, authenticationThirdPartyAuth } = useIsFeatureEnabled([
    'authentication:sign_in_providers',
    'authentication:third_party_auth',
  ])

  const navItems = [
    {
      label: 'Supabase Auth',
      to: '/project/$ref/auth/providers' as const,
    },
    ...(authenticationThirdPartyAuth
      ? [
          {
            label: 'Third-Party Auth',
            to: '/project/$ref/auth/third-party' as const,
          },
        ]
      : []),
  ]

  return (
    <AuthLayout title="Sign In / Providers">
      {authenticationSignInProviders ? (
        <>
          <PageHeader>
            <PageHeaderMeta>
              <PageHeaderSummary>
                <PageHeaderTitle>Sign In / Providers</PageHeaderTitle>
                <PageHeaderDescription>
                  Configure authentication providers and login methods for your users
                </PageHeaderDescription>
              </PageHeaderSummary>
            </PageHeaderMeta>
          </PageHeader>
          <PageNav size="default">
            <NavMenu>
              {navItems.map((item) => (
                <NavMenuItem
                  key={item.label}
                  active={!!matchRoute({ to: item.to, params: { ref: ref ?? '_' }, fuzzy: false })}
                >
                  <Link
                    to={item.to}
                    params={{ ref: ref ?? '_' }}
                    activeOptions={{ exact: true, includeSearch: false }}
                  >
                    {item.label}
                  </Link>
                </NavMenuItem>
              ))}
            </NavMenu>
          </PageNav>
          {children}
        </>
      ) : (
        <UnknownInterface urlBack={`/project/${ref}/auth/users`} />
      )}
    </AuthLayout>
  )
}
