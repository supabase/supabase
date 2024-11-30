import { useParams } from 'common'
import { INTEGRATIONS } from 'components/interfaces/Integrations/Landing/Integrations.constants'
import { useInstalledIntegrations } from 'components/interfaces/Integrations/Landing/useInstalledIntegrations'
import IntegrationsLayout from 'components/layouts/Integrations/layout'
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
  const Component = useMemo(
    () => integration?.navigate(id!, pageId, childId),
    [integration, id, pageId, childId]
  )

  useEffect(() => {
    // if the integration is not installed, redirect to the overview page
    if (
      router &&
      router?.isReady &&
      !isIntegrationsLoading &&
      !installation &&
      pageId !== 'overview'
    ) {
      router.replace(`/project/${ref}/integrations/${id}/overview`)
    }
  }, [installation, isIntegrationsLoading, pageId, router])

  if (!router?.isReady || isIntegrationsLoading) {
    return (
      <div className="px-10 py-6">
        <GenericSkeletonLoader />
      </div>
    )
  }

  if (!id || !integration) {
    return <div>Integration not found</div>
  }

  if (!Component) return <div className="p-10 text-sm">Component not found</div>

  return <Component />
}

IntegrationPage.getLayout = (page) => <IntegrationsLayout>{page}</IntegrationsLayout>

export default IntegrationPage
