import { PageContainer } from 'ui-patterns/PageContainer'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { SmtpForm } from '@/components/interfaces/Auth/SmtpForm/SmtpForm'
import { AuthEmailsLayout } from '@/components/layouts/AuthLayout/AuthEmailsLayout'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { NoPermission } from '@/components/ui/NoPermission'
import { FGA_PERMISSIONS, useAsyncCheckPermissionsV2 } from '@/hooks/misc/useCheckPermissionsV2'
import type { NextPageWithLayout } from '@/types'

const SmtpPage: NextPageWithLayout = () => {
  const { can: canReadAuthSettings, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissionsV2(
    FGA_PERMISSIONS.PROJECT.AUTH_CONFIG_READ
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
