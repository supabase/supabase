import { useFlag, useParams } from 'common'
import { INTEGRATIONS } from 'components/interfaces/Integrations/Landing/Integrations.constants'
import { useInstalledIntegrations } from 'components/interfaces/Integrations/Landing/useInstalledIntegrations'
import { DefaultLayout } from 'components/layouts/DefaultLayout'
import IntegrationsLayout from 'components/layouts/Integrations/layout'
import { UnknownInterface } from 'components/ui/UnknownInterface'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useMemo } from 'react'
import type { NextPageWithLayout } from 'types'
import {
  BreadcrumbItem_Shadcn_ as BreadcrumbItem,
  BreadcrumbLink_Shadcn_ as BreadcrumbLink,
  BreadcrumbList_Shadcn_ as BreadcrumbList,
  BreadcrumbPage_Shadcn_ as BreadcrumbPage,
  BreadcrumbSeparator_Shadcn_ as BreadcrumbSeparator,
  NavMenu,
  NavMenuItem,
} from 'ui'
import {
  Admonition,
  PageContainer,
  PageHeader,
  PageHeaderBreadcrumb,
  PageHeaderDescription,
  PageHeaderIcon,
  PageHeaderMeta,
  PageHeaderNavigationTabs,
  PageHeaderSummary,
  PageHeaderTitle,
  PageSection,
  PageSectionContent,
} from 'ui-patterns'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

type NavigationItem = { label: string; href: string; active?: boolean }

const IntegrationPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref, id, pageId, childId } = useParams()
  const { integrationsWrappers } = useIsFeatureEnabled(['integrations:wrappers'])
  const stripeSyncEnabled = useFlag('enableStripeSyncEngineIntegration')

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
  }, [installation, isIntegrationsLoading, pageId, router, ref, id])

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
        <PageContainer size="full">
          <PageSection>
            <PageSectionContent>
              <GenericSkeletonLoader />
            </PageSectionContent>
          </PageSection>
        </PageContainer>
      )
    } else if (!Component || !id || !integration) {
      return (
        <PageSection>
          <PageSectionContent>
            <Admonition type="warning" title="This integration is not currently available">
              Please try again later or contact support if the problem persists.
            </Admonition>
          </PageSectionContent>
        </PageSection>
      )
    } else {
      return <Component />
    }
  }, [router?.isReady, isIntegrationsLoading, id, integration, Component])

  if (!router?.isReady) {
    return null
  }

  if (id === 'stripe_sync_engine' && !stripeSyncEnabled) {
    return <UnknownInterface urlBack={`/project/${ref}/integrations`} />
  }

  if (!integrationsWrappers && id?.endsWith('_wrapper')) {
    return <UnknownInterface urlBack={`/project/${ref}/integrations`} />
  }

  return (
    <>
      <PageHeader size="full">
        <PageHeaderBreadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={`/project/${ref}/integrations`}>Integrations</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{integration?.name || 'Integration not found'}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </PageHeaderBreadcrumb>
        <PageHeaderMeta>
          {pageIcon && <PageHeaderIcon>{pageIcon}</PageHeaderIcon>}
          <PageHeaderSummary>
            <PageHeaderTitle>{pageTitle}</PageHeaderTitle>
            <PageHeaderDescription>{pageSubTitle}</PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
        {navigationItems.length > 0 && (
          <PageHeaderNavigationTabs>
            <NavMenu>
              {navigationItems.map((nav) => (
                <NavMenuItem key={nav.href} active={nav.active ?? false}>
                  <Link href={nav.href}>{nav.label}</Link>
                </NavMenuItem>
              ))}
            </NavMenu>
          </PageHeaderNavigationTabs>
        )}
      </PageHeader>

      {content}
    </>
  )
}

IntegrationPage.getLayout = (page) => (
  <DefaultLayout>
    <IntegrationsLayout>{page}</IntegrationsLayout>
  </DefaultLayout>
)

export default IntegrationPage
