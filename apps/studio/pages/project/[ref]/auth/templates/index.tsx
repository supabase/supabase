import { PermissionAction } from '@supabase/shared-types/out/constants'
import { GenericSkeletonLoader } from 'ui-patterns'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'

import { EmailTemplates } from '@/components/interfaces/Auth/EmailTemplates/EmailTemplates'
import { AuthEmailsLayout } from '@/components/layouts/AuthLayout/AuthEmailsLayout'
import DefaultLayout from '@/components/layouts/DefaultLayout'
import NoPermission from '@/components/ui/NoPermission'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import type { NextPageWithLayout } from '@/types'

const TemplatesPage: NextPageWithLayout = () => {
  const { can: canReadAuthSettings, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissions(
    PermissionAction.READ,
    'custom_config_gotrue'
  )

  if (isPermissionsLoaded && !canReadAuthSettings) {
    return <NoPermission isFullPage resourceText="access your project's email settings" />
  }

  return (
    <>
      <PageHeader size="small">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Templates</PageHeaderTitle>
            <PageHeaderDescription>
              Configure what emails your users receive and how they are sent
            </PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>

      <PageContainer size="small" className="pb-16">
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
    </>
  )
}

TemplatesPage.getLayout = (page) => (
  <DefaultLayout>
    <AuthEmailsLayout>{page}</AuthEmailsLayout>
  </DefaultLayout>
)

export default TemplatesPage
