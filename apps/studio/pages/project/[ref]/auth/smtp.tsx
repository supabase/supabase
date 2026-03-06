import { PermissionAction } from '@supabase/shared-types/out/constants'

import { SmtpForm } from 'components/interfaces/Auth/SmtpForm/SmtpForm'
import { AuthEmailsLayout } from 'components/layouts/AuthLayout/AuthEmailsLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import NoPermission from 'components/ui/NoPermission'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import type { NextPageWithLayout } from 'types'
import { GenericSkeletonLoader } from 'ui-patterns'
import { PageContainer } from 'ui-patterns/PageContainer'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'

const SmtpPage: NextPageWithLayout = () => {
  const { can: canReadAuthSettings, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissions(
    PermissionAction.READ,
    'custom_config_gotrue'
  )

  if (isPermissionsLoaded && !canReadAuthSettings) {
    return <NoPermission isFullPage resourceText="access your project's email settings" />
  }

  return (
    <PageContainer size="default">
      {!isPermissionsLoaded ? (
        <PageSection>
          <PageSectionContent>
            <GenericSkeletonLoader />
          </PageSectionContent>
        </PageSection>
      ) : (
        <SmtpForm />
      )}
    </PageContainer>
  )
}

SmtpPage.getLayout = (page) => (
  <DefaultLayout>
    <AuthEmailsLayout>{page}</AuthEmailsLayout>
  </DefaultLayout>
)

export default SmtpPage
