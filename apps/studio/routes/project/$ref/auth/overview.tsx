import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { FeatureFlagContext, useFlag } from 'common'
import { useContext, useEffect } from 'react'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderAside,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'

import { OverviewLearnMore } from '@/components/interfaces/Auth/Overview/OverviewLearnMore'
import { OverviewMetrics } from '@/components/interfaces/Auth/Overview/OverviewMetrics'
import { DocsButton } from '@/components/ui/DocsButton'
import { useAuthOverviewQuery } from '@/data/auth/auth-overview-query'
import { DOCS_URL } from '@/lib/constants'

export const Route = createFileRoute('/project/$ref/auth/overview')({
  component: AuthOverviewPage,
  staticData: {
    authLayoutTitle: 'Overview',
  },
})

function AuthOverviewPage() {
  const navigate = useNavigate()
  const { ref } = Route.useParams()
  const { hasLoaded } = useContext(FeatureFlagContext)
  const authOverviewPageEnabled = useFlag('authOverviewPage')

  const {
    data: metrics,
    isPending: isLoading,
    error,
  } = useAuthOverviewQuery({ projectRef: ref }, { enabled: !!ref })

  useEffect(() => {
    if (hasLoaded && !authOverviewPageEnabled) {
      void navigate({ to: '/project/$ref/auth/users', params: { ref }, replace: true })
    }
  }, [hasLoaded, authOverviewPageEnabled, navigate, ref])

  if (!authOverviewPageEnabled) {
    return null
  }

  return (
    <>
      <PageHeader size="large">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Overview</PageHeaderTitle>
          </PageHeaderSummary>
          <PageHeaderAside>
            <div className="flex items-center gap-2">
              <span className="text-sm text-foreground-light">
                <span className="text-foreground">Last 24 hours</span>
              </span>
              <DocsButton href={`${DOCS_URL}/guides/auth`} />
            </div>
          </PageHeaderAside>
        </PageHeaderMeta>
      </PageHeader>
      <PageContainer size="large">
        <OverviewMetrics metrics={metrics} isLoading={isLoading} error={error} />
        <OverviewLearnMore />
      </PageContainer>
    </>
  )
}
