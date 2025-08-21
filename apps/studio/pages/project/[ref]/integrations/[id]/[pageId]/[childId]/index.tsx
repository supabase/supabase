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
  const childLabel = router?.query?.['child-label'] as string

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

  // Create breadcrumb items
  const breadcrumbItems = [
    {
      label: 'Integrations',
      href: `/project/${ref}/integrations`,
    },
    {
      label: integration?.name || id,
      href: pageId
        ? `/project/${ref}/integrations/${id}/${pageId}`
        : `/project/${ref}/integrations/${id}`,
    },
  ]

  // Create navigation items from integration navigation
  const navigationItems: NavigationItem[] = []

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
      <PageLayout title="Loading..." size="full" breadcrumbs={breadcrumbItems}>
        <ScaffoldContainer>
          <div className="px-10 py-6">
            <GenericSkeletonLoader />
          </div>
        </ScaffoldContainer>
      </PageLayout>
    )
  }

  if (!id || !integration) {
    return (
      <PageLayout title="Integration not found" size="full" breadcrumbs={breadcrumbItems}>
        <ScaffoldContainer>
          <div>Integration not found</div>
        </ScaffoldContainer>
      </PageLayout>
    )
  }

  if (!Component) {
    return (
      <PageLayout
        title={integration.name}
        size="full"
        breadcrumbs={breadcrumbItems}
        navigationItems={navigationItems}
      >
        <ScaffoldContainer>
          <div className="p-10 text-sm">Component not found</div>
        </ScaffoldContainer>
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title={childLabel || childId}
      size="full"
      breadcrumbs={breadcrumbItems}
      navigationItems={navigationItems}
    >
      <Component />
    </PageLayout>
  )
}

IntegrationPage.getLayout = (page) => (
  <DefaultLayout>
    <IntegrationsLayout>{page}</IntegrationsLayout>
  </DefaultLayout>
)

export default IntegrationPage
