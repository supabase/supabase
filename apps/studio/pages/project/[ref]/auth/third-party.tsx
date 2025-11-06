import Link from 'next/link'
import { useRouter } from 'next/router'
import React from 'react'

import { PermissionAction } from '@supabase/shared-types/out/constants'

import { useParams } from 'common'
import { ThirdPartyAuthForm } from 'components/interfaces/Auth/ThirdPartyAuthForm'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageContainer } from 'ui-patterns/PageContainer'
import { PageHeader } from 'ui-patterns/PageHeader'
import { NavMenu, NavMenuItem } from 'ui'
import NoPermission from 'components/ui/NoPermission'
import { UnknownInterface } from 'components/ui/UnknownInterface'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import type { NextPageWithLayout } from 'types'

const ThirdPartyPage: NextPageWithLayout = () => {
  const { ref } = useParams()
  const { can: canReadAuthSettings, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissions(
    PermissionAction.READ,
    'custom_config_gotrue'
  )

  const showThirdPartyAuth = useIsFeatureEnabled('authentication:third_party_auth')

  if (!showThirdPartyAuth) {
    return (
      <DefaultLayout>
        <AuthLayout>
          <UnknownInterface urlBack={`/project/${ref}/auth/providers`} />
        </AuthLayout>
      </DefaultLayout>
    )
  }

  return (
    <PageContainer className="pb-16">
      {isPermissionsLoaded && !canReadAuthSettings ? (
        <NoPermission isFullPage resourceText="access your project's auth provider settings" />
      ) : (
        <ThirdPartyAuthForm />
      )}
    </PageContainer>
  )
}

ThirdPartyPage.getLayout = (page: React.ReactElement) => {
  const ThirdPartyPageLayout = () => {
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
        <ThirdPartyPageLayout />
      </AuthLayout>
    </DefaultLayout>
  )
}

export default ThirdPartyPage
