import { PermissionAction } from '@supabase/shared-types/out/constants'
import { ReactNode } from 'react'

import { MfaAuthSettingsForm } from 'components/interfaces/Auth'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer } from 'components/layouts/Scaffold'
import NoPermission from 'components/ui/NoPermission'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import type { NextPageWithLayout } from 'types'

interface MfaLayoutProps {
  children: ReactNode
}

export const MfaLayout = ({ children }: MfaLayoutProps) => {
  return (
    <DefaultLayout>
      <AuthLayout>
        <PageLayout
          title="Multi-Factor Authentication (MFA)"
          subtitle="Requires users to provide additional verification factors to authenticate"
        >
          {children}
        </PageLayout>
      </AuthLayout>
    </DefaultLayout>
  )
}

const MfaPage: NextPageWithLayout = () => {
  const isPermissionsLoaded = usePermissionsLoaded()
  const canReadAuthSettings = useCheckPermissions(PermissionAction.READ, 'custom_config_gotrue')

  if (isPermissionsLoaded && !canReadAuthSettings) {
    return <NoPermission isFullPage resourceText="access your project's authentication settings" />
  }

  return (
    <ScaffoldContainer>
      {!isPermissionsLoaded ? <GenericSkeletonLoader /> : <MfaAuthSettingsForm />}
    </ScaffoldContainer>
  )
}

MfaPage.getLayout = (page) => <MfaLayout>{page}</MfaLayout>

export default MfaPage
