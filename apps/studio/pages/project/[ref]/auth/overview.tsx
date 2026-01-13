import { useRouter } from 'next/router'
import { useContext, useEffect } from 'react'

import { FeatureFlagContext, useFlag, useParams } from 'common'
import { OverviewLearnMore } from 'components/interfaces/Auth/Overview/OverviewLearnMore'
import { OverviewMetrics } from 'components/interfaces/Auth/Overview/OverviewMetrics'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { DocsButton } from 'components/ui/DocsButton'
import { useAuthOverviewQuery } from 'data/auth/auth-overview-query'
import { DOCS_URL } from 'lib/constants'
import { NextPageWithLayout } from 'types'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderAside,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'

const AuthOverview: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = useParams()
  const { hasLoaded } = useContext(FeatureFlagContext)
  const authOverviewPageEnabled = useFlag('authOverviewPage')

  const {
    data: metrics,
    isPending: isLoading,
    error,
  } = useAuthOverviewQuery({ projectRef: ref }, { enabled: !!ref })

  useEffect(() => {
    if (hasLoaded && !authOverviewPageEnabled) {
      router.replace(`/project/${ref}/auth/users`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authOverviewPageEnabled, router, ref])

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

AuthOverview.getLayout = (page) => (
  <DefaultLayout>
    <AuthLayout>{page}</AuthLayout>
  </DefaultLayout>
)

export default AuthOverview
