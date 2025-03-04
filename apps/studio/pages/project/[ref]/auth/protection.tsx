import { PermissionAction } from '@supabase/shared-types/out/constants'
import { ReactNode } from 'react'

import { useParams } from 'common'
import { ProtectionAuthSettingsForm } from 'components/interfaces/Auth'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer } from 'components/layouts/Scaffold'
import NoPermission from 'components/ui/NoPermission'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import type { NextPageWithLayout } from 'types'

interface ProtectionLayoutProps {
  children: ReactNode
}

export const ProtectionLayout = ({ children }: ProtectionLayoutProps) => {
  const { ref } = useParams()

  return (
    <DefaultLayout>
      <AuthLayout>
        <PageLayout
          title="Attack Protection"
          subtitle="Configure security settings to protect your project from attacks"
        >
          {children}
        </PageLayout>
      </AuthLayout>
    </DefaultLayout>
  )
}

const ProtectionPage: NextPageWithLayout = () => {
  const isPermissionsLoaded = usePermissionsLoaded()
  const canReadAuthSettings = useCheckPermissions(PermissionAction.READ, 'custom_config_gotrue')

  if (isPermissionsLoaded && !canReadAuthSettings) {
    return <NoPermission isFullPage resourceText="access your project's auth provider settings" />
  }

  return (
    <ScaffoldContainer>
      {!isPermissionsLoaded ? (
        <div className="mt-12">
          <GenericSkeletonLoader />
        </div>
      ) : (
        <ProtectionAuthSettingsForm />
      )}
    </ScaffoldContainer>
  )
}

ProtectionPage.getLayout = (page) => <ProtectionLayout>{page}</ProtectionLayout>

export default ProtectionPage
