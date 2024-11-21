import { useParams } from 'common'
import { INTEGRATIONS } from 'components/interfaces/Integrations/Landing/Integrations.constants'
import { useInstalledIntegrations } from 'components/interfaces/Integrations/Landing/useInstalledIntegrations'
import IntegrationsLayout from 'components/layouts/Integrations/layout'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useRouter } from 'next/compat/router'
import { NextPageWithLayout } from 'types'

const IntegrationPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref, id, pageId, childId } = useParams()

  const { installedIntegrations: installedIntegrations, isLoading: isIntegrationsLoading } =
    useInstalledIntegrations()

  if (!router?.isReady || isIntegrationsLoading) {
    return (
      <div className="px-10 py-6">
        <GenericSkeletonLoader />
      </div>
    )
  }

  const integration = INTEGRATIONS.find((i) => i.id === id)
  if (!id || !integration) {
    return <div>Integration not found</div>
  }

  const installation = installedIntegrations.find((inst) => inst.id === id)

  // if the integration is not installed, redirect to the overview page
  if (!installation && pageId !== 'overview') {
    router.replace(`/project/${ref}/integrations/${id}/overview`)
  }

  // Get the corresponding component dynamically
  const Component = integration.navigate(id, pageId, childId)

  if (!Component) return <div>Component not found</div>

  return <Component />
}

IntegrationPage.getLayout = (page) => <IntegrationsLayout>{page}</IntegrationsLayout>

export default IntegrationPage
