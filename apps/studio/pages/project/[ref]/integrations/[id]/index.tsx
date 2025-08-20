import { useParams } from 'common'
import { INTEGRATIONS } from 'components/interfaces/Integrations/Landing/Integrations.constants'
import { useInstalledIntegrations } from 'components/interfaces/Integrations/Landing/useInstalledIntegrations'
import DefaultLayout from 'components/layouts/DefaultLayout'
import IntegrationsLayout from 'components/layouts/Integrations/layout'
import { PageLayout, NavigationItem } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer } from 'components/layouts/Scaffold'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useRouter } from 'next/compat/router'
import { useEffect, useMemo } from 'react'
import { NextPageWithLayout } from 'types'

const IntegrationPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref, id, pageId, childId } = useParams()

  const { installedIntegrations: installedIntegrations, isLoading: isIntegrationsLoading } =
    useInstalledIntegrations()

  // everything is wrapped in useMemo to avoid UI resets when installing additional extensions like pg_net
  const integration = useMemo(() => INTEGRATIONS.find((i) => i.id === id), [id])

  const installation = useMemo(
    () => installedIntegrations.find((inst) => inst.id === id),
    [installedIntegrations, id]
  )

  // Get the corresponding component dynamically
  useEffect(() => {
    // Always redirect to the overview page since this route should not render content
    if (router?.isReady) {
      router.replace(`/project/${ref}/integrations/${id}/overview`)
    }
  }, [router, ref, id])

  return (
    <PageLayout title="Loading...">
      <ScaffoldContainer>
        <div className="px-10 py-6">
          <GenericSkeletonLoader />
        </div>
      </ScaffoldContainer>
    </PageLayout>
  )
}

IntegrationPage.getLayout = (page) => (
  <DefaultLayout>
    <IntegrationsLayout>{page}</IntegrationsLayout>
  </DefaultLayout>
)

export default IntegrationPage
