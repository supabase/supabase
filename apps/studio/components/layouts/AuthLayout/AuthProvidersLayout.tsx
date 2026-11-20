import { useParams } from 'common'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PropsWithChildren } from 'react'
import { NavMenu, NavMenuItem } from 'ui'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderNavigationTabs,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'

import AuthLayout from './AuthLayout'
import { UnknownInterface } from '@/components/ui/UnknownInterface'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'

export const AuthProvidersLayout = ({ children }: PropsWithChildren<{}>) => {
  const { ref } = useParams()
  const pathname = usePathname()
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
            label: 'Third-Party Auth',
            href: `/project/${ref}/auth/third-party`,
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
            <PageHeaderNavigationTabs>
              <NavMenu>
                {navItems.map((item) => (
                  <NavMenuItem key={item.label} active={pathname === item.href}>
                    <Link href={item.href}>{item.label}</Link>
                  </NavMenuItem>
                ))}
              </NavMenu>
            </PageHeaderNavigationTabs>
          </PageHeader>
          {children}
        </>
      ) : (
        <UnknownInterface urlBack={`/project/${ref}/auth/users`} />
      )}
    </AuthLayout>
  )
}
