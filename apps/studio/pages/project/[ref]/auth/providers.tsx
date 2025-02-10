import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { AuthProvidersForm, BasicAuthSettingsForm } from 'components/interfaces/Auth'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import {
  ScaffoldContainer,
  ScaffoldDescription,
  ScaffoldDivider,
  ScaffoldHeader,
  ScaffoldTitle,
} from 'components/layouts/Scaffold'
import NoPermission from 'components/ui/NoPermission'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import { useCurrentPath } from 'hooks/misc/useCurrentPath'
import Link from 'next/link'
import type { NextPageWithLayout } from 'types'
import { NavMenu, NavMenuItem } from 'ui'

const PageLayout: NextPageWithLayout = () => {
  const canReadAuthSettings = useCheckPermissions(PermissionAction.READ, 'custom_config_gotrue')
  const isPermissionsLoaded = usePermissionsLoaded()
  const { ref } = useParams()
  const currentPath = useCurrentPath()

  const navMenuItems = [
    {
      label: 'Supabase Auth',
      href: `/project/${ref}/auth/providers`,
    },
    {
      label: 'Third Party Auth',
      href: `/project/${ref}/auth/third-party`,
    },
  ]

  if (isPermissionsLoaded && !canReadAuthSettings) {
    return <NoPermission isFullPage resourceText="access your project's auth provider settings" />
  }

  return (
    <div>
      <ScaffoldHeader className="pb-0">
        <ScaffoldContainer id="auth-page-top">
          <ScaffoldTitle>Sign In / Up</ScaffoldTitle>
          <ScaffoldDescription>
            Configure authentication providers and login methods for your users
          </ScaffoldDescription>
          <NavMenu
            className="border-none max-w-full overflow-y-hidden overflow-x-auto mt-4"
            aria-label="Auth provider settings navigation"
          >
            {navMenuItems.map((item) => (
              <NavMenuItem key={item.label} active={currentPath === item.href}>
                <Link href={item.href}>{item.label}</Link>
              </NavMenuItem>
            ))}
          </NavMenu>
        </ScaffoldContainer>
      </ScaffoldHeader>

      <ScaffoldDivider />

      <ScaffoldContainer className="my-8 space-y-8">
        <BasicAuthSettingsForm />
        <AuthProvidersForm />
      </ScaffoldContainer>
    </div>
  )
}

PageLayout.getLayout = (page) => {
  return (
    <DefaultLayout>
      <AuthLayout>{page}</AuthLayout>
    </DefaultLayout>
  )
}

export default PageLayout
