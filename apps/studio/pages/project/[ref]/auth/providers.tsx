import Link from 'next/link'
import { useRouter } from 'next/router'
import React from 'react'

import { useParams } from 'common'
import { AuthProvidersForm } from 'components/interfaces/Auth/AuthProvidersForm'
import { BasicAuthSettingsForm } from 'components/interfaces/Auth/BasicAuthSettingsForm'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageContainer } from 'ui-patterns/PageContainer'
import { PageHeader } from 'ui-patterns/PageHeader'
import { NavMenu, NavMenuItem } from 'ui'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { UnknownInterface } from 'components/ui/UnknownInterface'
import type { NextPageWithLayout } from 'types'

const ProvidersPage: NextPageWithLayout = () => {
  const showProviders = useIsFeatureEnabled('authentication:show_providers')

  return (
    <PageContainer>
      <BasicAuthSettingsForm />
      {showProviders && <AuthProvidersForm />}
    </PageContainer>
  )
}

ProvidersPage.getLayout = (page: React.ReactElement) => {
  const AuthProvidersPageLayout = () => {
    const { ref } = useParams()
    const router = useRouter()
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

    if (!authenticationSignInProviders) {
      return (
        <DefaultLayout>
          <AuthLayout>
            <UnknownInterface urlBack={`/project/${ref}/auth/users`} />
          </AuthLayout>
        </DefaultLayout>
      )
    }

    return (
      <div className="w-full min-h-full flex flex-col items-stretch">
        <PageHeader.Root>
          <PageHeader.Summary>
            <PageHeader.Title>Sign In / Providers</PageHeader.Title>
            <PageHeader.Description>
              Configure authentication providers and login methods for your users
            </PageHeader.Description>
          </PageHeader.Summary>
          {navItems.length > 0 && (
            <PageHeader.Footer>
              <NavMenu>
                {navItems.map((item) => {
                  const isActive = router.asPath.split('?')[0] === item.href
                  return (
                    <NavMenuItem key={item.label} active={isActive}>
                      <Link href={item.href}>{item.label}</Link>
                    </NavMenuItem>
                  )
                })}
              </NavMenu>
            </PageHeader.Footer>
          )}
        </PageHeader.Root>

        {page}
      </div>
    )
  }

  return (
    <DefaultLayout>
      <AuthLayout>
        <AuthProvidersPageLayout />
      </AuthLayout>
    </DefaultLayout>
  )
}

export default ProvidersPage
