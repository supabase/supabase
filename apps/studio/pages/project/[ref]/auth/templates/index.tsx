import { PermissionAction } from '@supabase/shared-types/out/constants'

import { EmailTemplates } from 'components/interfaces/Auth/EmailTemplates/EmailTemplates'
import { AuthEmailsLayout } from 'components/layouts/AuthLayout/AuthEmailsLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import NoPermission from 'components/ui/NoPermission'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import type { NextPageWithLayout } from 'types'
import { GenericSkeletonLoader } from 'ui-patterns'
import { PageContainer } from 'ui-patterns/PageContainer'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'

const TemplatesPage: NextPageWithLayout = () => {
  const { can: canReadAuthSettings, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissions(
    PermissionAction.READ,
    'custom_config_gotrue'
  )

  if (isPermissionsLoaded && !canReadAuthSettings) {
    return <NoPermission isFullPage resourceText="access your project's email settings" />
  }

  return (
    <PageContainer size="default" className="pb-16">
      {!isPermissionsLoaded ? (
        <PageSection>
          <PageSectionContent>
            <GenericSkeletonLoader />
          </PageSectionContent>
        </PageSection>
      ) : (
        <EmailTemplates />
      )}
    </PageContainer>
  )
}

TemplatesPage.getLayout = (page) => (
  <DefaultLayout>
    <AuthEmailsLayout>{page}</AuthEmailsLayout>
  </DefaultLayout>
)

export default TemplatesPage
