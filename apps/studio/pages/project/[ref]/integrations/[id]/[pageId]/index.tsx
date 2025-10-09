import { useParams } from 'common'
import { INTEGRATIONS } from 'components/interfaces/Integrations/Landing/Integrations.constants'
import { useInstalledIntegrations } from 'components/interfaces/Integrations/Landing/useInstalledIntegrations'
import DefaultLayout from 'components/layouts/DefaultLayout'
import IntegrationsLayout from 'components/layouts/Integrations/layout'
import { NavigationItem, PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { UnknownInterface } from 'components/ui/UnknownInterface'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useRouter } from 'next/compat/router'
import { useEffect, useMemo } from 'react'
import { NextPageWithLayout } from 'types'
import { Admonition } from 'ui-patterns'

const IntegrationPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref, id, pageId, childId } = useParams()
  const { integrationsWrappers } = useIsFeatureEnabled(['integrations:wrappers'])

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
      label: integration?.name || 'Integration not found',
    },
  ]

  // Create navigation items from integration navigation
  const navigationItems: NavigationItem[] = useMemo(() => {
    if (!integration?.navigation) return []

    // Only show navigation if the integration is installed, or if we're on the overview page
    const showNavigation = installation || pageId === 'overview'
    if (!showNavigation) return []

    const availableTabs = installation
      ? integration.navigation
      : integration.navigation.filter((tab) => tab.route === 'overview')

    return availableTabs.map((nav) => ({
      label: nav.label,
      href: `/project/${ref}/integrations/${id}/${nav.route}`,
      active: pageId === nav.route,
    }))
  }, [integration, ref, id, pageId, installation])

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

  // Determine page title, icon, and subtitle based on state
  const pageTitle = integration?.name || 'Integration not found'

  const pageSubTitle =
    integration?.description || 'If you think this is an error, please contact support'

  // Get integration icon and subtitle
  const pageIcon = integration ? (
    <div className="shrink-0 w-10 h-10 relative bg-white border rounded-md flex items-center justify-center">
      {integration.icon()}
    </div>
  ) : null

  // Determine content based on state
  const content = useMemo(() => {
    if (!router?.isReady || isIntegrationsLoading) {
      return (
        <ScaffoldContainer size="full">
          <ScaffoldSection isFullWidth>
            <GenericSkeletonLoader />
          </ScaffoldSection>
        </ScaffoldContainer>
      )
    } else if (!Component || !id || !integration) {
      return (
        <ScaffoldContainer size="full">
          <ScaffoldSection isFullWidth>
            <Admonition type="warning" title="This integration is not currently available">
              Please try again later or contact support if the problem persists.
            </Admonition>
          </ScaffoldSection>
        </ScaffoldContainer>
      )
    } else {
      return <Component />
    }
  }, [router?.isReady, isIntegrationsLoading, id, integration, Component])

  if (!router?.isReady) {
    return null
  }

  if (!integrationsWrappers && id?.endsWith('_wrapper')) {
    return <UnknownInterface urlBack={`/project/${ref}/integrations`} />
  }

  return (
    <PageLayout
      title={pageTitle}
      icon={pageIcon}
      subtitle={pageSubTitle}
      size="full"
      breadcrumbs={breadcrumbItems}
      navigationItems={navigationItems}
    >
      {content}
    </PageLayout>
  )
}

IntegrationPage.getLayout = (page) => (
  <DefaultLayout>
    <IntegrationsLayout>{page}</IntegrationsLayout>
  </DefaultLayout>
)

export default IntegrationPage
