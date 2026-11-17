import { createFileRoute } from '@tanstack/react-router'
import { useParams } from 'common'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderAside,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { RateLimits } from '@/components/interfaces/Auth/RateLimits/RateLimits'
import { DocsButton } from '@/components/ui/DocsButton'
import { NoPermission } from '@/components/ui/NoPermission'
import { UnknownInterface } from '@/components/ui/UnknownInterface'
import { FGA_PERMISSIONS, useAsyncCheckPermissionsV2 } from '@/hooks/misc/useCheckPermissionsV2'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { DOCS_URL } from '@/lib/constants'

export const Route = createFileRoute('/project/$ref/auth/rate-limits')({
  component: RateLimitsPage,
  staticData: {
    authLayoutTitle: 'Rate Limits',
  },
})

function RateLimitsPage() {
  const { ref } = useParams()
  const showRateLimits = useIsFeatureEnabled('authentication:rate_limits')

  const { can: canReadAuthSettings, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissionsV2(
    FGA_PERMISSIONS.PROJECT.AUTH_CONFIG_READ
  )

  if (!showRateLimits) {
    return <UnknownInterface urlBack={`/project/${ref}/auth/users`} />
  }

  if (isPermissionsLoaded && !canReadAuthSettings) {
    return <NoPermission isFullPage resourceText="access your project's auth rate limit settings" />
  }

  return (
    <>
      <PageHeader size="default">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Rate Limits</PageHeaderTitle>
            <PageHeaderDescription>
              Safeguard against bursts of incoming traffic to prevent abuse and maximize stability
            </PageHeaderDescription>
          </PageHeaderSummary>
          <PageHeaderAside>
            <DocsButton
              href={`${DOCS_URL}/guides/platform/going-into-prod#rate-limiting-resource-allocation--abuse-prevention`}
            />
          </PageHeaderAside>
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
          <RateLimits />
        )}
      </PageContainer>
    </>
  )
}
