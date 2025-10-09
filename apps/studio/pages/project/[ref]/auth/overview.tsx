import { NextPageWithLayout } from 'types'
import DefaultLayout from 'components/layouts/DefaultLayout'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { DocsButton } from 'components/ui/DocsButton'
import { DOCS_URL } from 'lib/constants'
import { OverviewMonitoring } from 'components/interfaces/Auth/Overview/OverviewMonitoring'
import { OverviewUsage } from 'components/interfaces/Auth/Overview/OverviewUsage'
import { OverviewLearnMore } from 'components/interfaces/Auth/Overview/OverviewLearnMore'
import { useRouter } from 'next/router'
import { FeatureFlagContext, useFlag, useParams } from 'common'
import { useContext, useEffect } from 'react'

const AuthOverview: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = useParams()
  const { hasLoaded } = useContext(FeatureFlagContext)
  const authOverviewPageEnabled = useFlag('authOverviewPage')

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
        <OverviewMonitoring />
        <OverviewUsage />
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
              All reports <span className="text-foreground">Last 24 hours</span>
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
