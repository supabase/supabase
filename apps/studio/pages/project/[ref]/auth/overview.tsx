import { FeatureFlagContext, useFlag, useParams } from 'common'
import { OverviewLearnMore } from 'components/interfaces/Auth/Overview/OverviewLearnMore'
import { OverviewMetrics } from 'components/interfaces/Auth/Overview/OverviewMetrics'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer } from 'components/layouts/Scaffold'
import { DocsButton } from 'components/ui/DocsButton'
import { DOCS_URL } from 'lib/constants'
import { useRouter } from 'next/router'
import { useContext, useEffect } from 'react'
import type { NextPageWithLayout } from 'types'
import { useAuthOverviewQuery } from 'data/auth/auth-overview-query'

const AuthOverview: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = useParams()
  const { hasLoaded } = useContext(FeatureFlagContext)
  const authOverviewPageEnabled = useFlag('authOverviewPage')

  const {
    data: metrics,
    isLoading,
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
    <ScaffoldContainer size="large">
      <div className="mb-4 flex flex-col gap-2">
        <OverviewMetrics metrics={metrics} isLoading={isLoading} error={error} />
        <OverviewLearnMore />
      </div>
    </ScaffoldContainer>
  )
}

AuthOverview.getLayout = (page) => (
  <DefaultLayout>
    <AuthLayout>
      <PageLayout
        title="Overview"
        secondaryActions={
          <div className="flex items-center gap-2">
            <span className="text-sm text-foreground-light">
              <span className="text-foreground">Last 24 hours</span>
            </span>
            <DocsButton href={`${DOCS_URL}/guides/auth`} />
          </div>
        }
        size="large"
      >
        {page}
      </PageLayout>
    </AuthLayout>
  </DefaultLayout>
)

export default AuthOverview
