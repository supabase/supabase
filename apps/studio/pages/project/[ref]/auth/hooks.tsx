import { PermissionAction } from '@supabase/shared-types/out/constants'
import { ReactNode } from 'react'

import { HooksListing } from 'components/interfaces/Auth/Hooks/HooksListing'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer } from 'components/layouts/Scaffold'
import NoPermission from 'components/ui/NoPermission'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import type { NextPageWithLayout } from 'types'

interface HooksLayoutProps {
  children: ReactNode
}

export const HooksLayout = ({ children }: HooksLayoutProps) => {
  return (
    <DefaultLayout>
      <AuthLayout>
        <PageLayout
          title="Auth Hooks"
          subtitle="Use Postgres functions or HTTP endpoints to customize the behavior of Supabase Auth to meet your needs"
        >
          {children}
        </PageLayout>
      </AuthLayout>
    </DefaultLayout>
  )
}

const Hooks: NextPageWithLayout = () => {
  const canReadAuthSettings = useCheckPermissions(PermissionAction.READ, 'custom_config_gotrue')
  const isPermissionsLoaded = usePermissionsLoaded()

  if (isPermissionsLoaded && !canReadAuthSettings) {
    return <NoPermission isFullPage resourceText="access your project's auth hooks" />
  }

  return (
    <ScaffoldContainer>
      <HooksListing />
    </ScaffoldContainer>
  )
}

Hooks.getLayout = (page) => <HooksLayout>{page}</HooksLayout>

export default Hooks
