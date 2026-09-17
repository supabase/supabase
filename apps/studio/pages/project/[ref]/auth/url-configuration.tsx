import { PermissionAction } from '@supabase/shared-types/out/constants'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { RedirectUrls } from '@/components/interfaces/Auth/RedirectUrls/RedirectUrls'
import SiteUrl from '@/components/interfaces/Auth/SiteUrl/SiteUrl'
import AuthLayout from '@/components/layouts/AuthLayout/AuthLayout'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { NoPermission } from '@/components/ui/NoPermission'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import type { NextPageWithLayout } from '@/types'

import { IS_PLATFORM } from 'common'
import { Alert, AlertDescription, AlertTitle } from 'ui'
import { Info } from 'lucide-react'

const URLConfiguration: NextPageWithLayout = () => {
  const { can: canReadAuthSettings, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissions(
    PermissionAction.READ,
    'custom_config_gotrue'
  )

  if (isPermissionsLoaded && !canReadAuthSettings) {
    return <NoPermission isFullPage resourceText="access your project's authentication settings" />
  }

  if (!IS_PLATFORM) {
    return (
      <PageContainer size="default">
        <Alert>
          <Info />
          <AlertTitle>URL Configuration is Managed via Environment Variables</AlertTitle>
          <AlertDescription>
            In self-hosted environments, site URLs and redirect URLs must be configured securely via your <code>.env</code> file (e.g. <code>API_EXTERNAL_URL</code>, <code>GOTRUE_SITE_URL</code>). Studio cannot modify these settings dynamically.
          </AlertDescription>
        </Alert>
      </PageContainer>
    )
  }

  return (
    <>
      <PageHeader size="default">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>URL Configuration</PageHeaderTitle>
            <PageHeaderDescription>
              Configure site URL and redirect URLs for authentication
            </PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>
      <PageContainer size="default">
        {!isPermissionsLoaded ? (
          <PageSection>
            <PageSectionContent>
              <GenericSkeletonLoader />
            </PageSectionContent>
          </PageSection>
        ) : (
          <>
            <SiteUrl />
            <RedirectUrls />
          </>
        )}
      </PageContainer>
    </>
  )
}

URLConfiguration.getLayout = (page) => (
  <DefaultLayout>
    <AuthLayout title="URL Configuration">{page}</AuthLayout>
  </DefaultLayout>
)

export default URLConfiguration
