import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { EmailTemplates } from 'components/interfaces/Auth'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import { useCurrentPath } from 'hooks/misc/useCurrentPath'
import Link from 'next/link'
import { NavMenu, NavMenuItem } from 'ui'
import {
  ScaffoldContainer,
  ScaffoldDescription,
  ScaffoldDivider,
  ScaffoldHeader,
  ScaffoldTitle,
} from 'components/layouts/Scaffold'
import NoPermission from 'components/ui/NoPermission'
import type { NextPageWithLayout } from 'types'
import DefaultLayout from 'components/layouts/DefaultLayout'
const PageLayout: NextPageWithLayout = () => {
  const canReadAuthSettings = useCheckPermissions(PermissionAction.READ, 'custom_config_gotrue')
  const isPermissionsLoaded = usePermissionsLoaded()
  const { ref } = useParams()
  const currentPath = useCurrentPath()

  const navMenuItems = [
    {
      label: 'Templates',
      href: `/project/${ref}/auth/templates`,
    },
    {
      label: 'SMTP Settings',
      href: `/project/${ref}/auth/smtp`,
    },
  ]

  if (isPermissionsLoaded && !canReadAuthSettings) {
    return <NoPermission isFullPage resourceText="access your project's email settings" />
  }

  return (
    <div>
      <ScaffoldHeader className="pb-0">
        <ScaffoldContainer id="auth-page-top">
          <ScaffoldTitle>Emails</ScaffoldTitle>
          <ScaffoldDescription>
            Configure what emails your users receive and how they are sent
          </ScaffoldDescription>
          <NavMenu
            className="border-none max-w-full overflow-y-hidden overflow-x-auto mt-4"
            aria-label="Auth email settings navigation"
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
        <EmailTemplates />
      </ScaffoldContainer>
    </div>
  )
}

PageLayout.getLayout = (page) => (
  <DefaultLayout>
    <AuthLayout>{page}</AuthLayout>
  </DefaultLayout>
)

export default PageLayout
