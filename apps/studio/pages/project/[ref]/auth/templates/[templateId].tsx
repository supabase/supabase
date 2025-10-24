import { PermissionAction } from '@supabase/shared-types/out/constants'

import { AuthEmailsLayout } from 'components/layouts/AuthLayout/AuthEmailsLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import {
  ScaffoldContainer,
  ScaffoldSection,
  ScaffoldSectionDescription,
  ScaffoldSectionTitle,
} from 'components/layouts/Scaffold'
import NoPermission from 'components/ui/NoPermission'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useRouter } from 'next/router'
import type { NextPageWithLayout } from 'types'
import { GenericSkeletonLoader } from 'ui-patterns'

const TemplatePage: NextPageWithLayout = () => {
  const router = useRouter()
  const { templateId } = router.query

  const { can: canReadAuthSettings, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissions(
    PermissionAction.READ,
    'custom_config_gotrue'
  )

  if (isPermissionsLoaded && !canReadAuthSettings) {
    return <NoPermission isFullPage resourceText="access your project's email settings" />
  }

  return (
    <ScaffoldContainer bottomPadding>
      {!isPermissionsLoaded ? (
        <ScaffoldSection isFullWidth>
          <GenericSkeletonLoader />
        </ScaffoldSection>
      ) : (
        <ScaffoldSection isFullWidth>
          <div>
            <ScaffoldSectionTitle>Email Template: {templateId}</ScaffoldSectionTitle>
            <ScaffoldSectionDescription>
              Configure and customize your email template settings.
            </ScaffoldSectionDescription>
          </div>
          {/* Template content will go here */}
          <div className="mt-6">
            <p className="text-foreground-light">Template editor will be implemented here.</p>
          </div>
        </ScaffoldSection>
      )}
    </ScaffoldContainer>
  )
}

TemplatePage.getLayout = (page) => (
  <DefaultLayout>
    <AuthEmailsLayout>{page}</AuthEmailsLayout>
  </DefaultLayout>
)

export default TemplatePage
