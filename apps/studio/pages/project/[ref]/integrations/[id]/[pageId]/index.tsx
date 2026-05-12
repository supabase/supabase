import { useFlag, useParams } from 'common'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useMemo } from 'react'
import {
  BreadcrumbItem_Shadcn_ as BreadcrumbItem,
  BreadcrumbLink_Shadcn_ as BreadcrumbLink,
  BreadcrumbList_Shadcn_ as BreadcrumbList,
  BreadcrumbPage_Shadcn_ as BreadcrumbPage,
  BreadcrumbSeparator_Shadcn_ as BreadcrumbSeparator,
  Button,
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
import ShimmeringLoader, { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { InstallIntegrationSheet } from '@/components/interfaces/Integrations/Integration/IntegrationOverviewTabV2/InstallIntegrationSheet/InstallIntegrationSheet'
import { InstallOAuthIntegrationButton } from '@/components/interfaces/Integrations/Integration/IntegrationOverviewTabV2/InstallIntegrationSheet/InstallOAuthIntegrationButton'
import { useAvailableIntegrations } from '@/components/interfaces/Integrations/Landing/useAvailableIntegrations'
import { useInstalledIntegrations } from '@/components/interfaces/Integrations/Landing/useInstalledIntegrations'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { ProjectIntegrationsLayout } from '@/components/layouts/ProjectIntegrationsLayout'
import { UnknownInterface } from '@/components/ui/UnknownInterface'
import { useDatabaseExtensionsQuery } from '@/data/database-extensions/database-extensions-query'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import type { NextPageWithLayout } from '@/types'

type NavigationItem = { label: string; href: string; active?: boolean }

const IntegrationPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { data: project } = useSelectedProjectQuery()
  const { ref, id, pageId, childId } = useParams()

  const { integrationsWrappers } = useIsFeatureEnabled(['integrations:wrappers'])
  const isMarketplaceEnabled = useFlag('marketplaceIntegrations')

  const { data: extensions } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const { data: allIntegrations, isPending: isAvailableIntegrationsLoading } =
    useAvailableIntegrations()
  const { installedIntegrations, isLoading: isInstalledIntegrationsLoading } =
    useInstalledIntegrations()

  // everything is wrapped in useMemo to avoid UI resets when installing additional extensions like pg_net
  const integration = useMemo(() => allIntegrations.find((i) => i.id === id), [allIntegrations, id])

  const installation = useMemo(
    () => installedIntegrations.find((inst) => inst.id === id),
    [installedIntegrations, id]
  )

  const installableExtensions = (extensions ?? []).filter((ext) =>
    (integration?.requiredExtensions ?? []).includes(ext.name)
  )
  const extensionsInstalled = installableExtensions.every((x) => x.installed_version)

  // [Joshen] installedIntegrations doesn't return wrappers unless there's a wrapper created
  const isInstalled =
    !!integration && (!!installation || (integration.type === 'wrapper' && extensionsInstalled))

  // Get the corresponding component dynamically
  const Component = useMemo(
    () => integration?.navigate({ id, pageId, childId }),
    [integration, id, pageId, childId]
  )

  // Create navigation items from integration navigation
  const navigationItems: NavigationItem[] = useMemo(() => {
    if (!integration?.navigation) return []

    // Only show navigation if the integration is installed, or if we're on the overview page
    const showNavigation = isInstalled || pageId === 'overview'
    if (!showNavigation) return []

    const availableTabs = isInstalled
      ? integration.navigation
      : integration.navigation.filter((tab) => tab.route === 'overview')

    return availableTabs.map((nav) => ({
      label: nav.label,
      href: `/project/${ref}/integrations/${id}/${nav.route}`,
      active: pageId === nav.route,
    }))
  }, [integration, pageId, isInstalled, ref, id])

  useEffect(() => {
    // if the integration is not installed, redirect to the overview page
    if (
      router &&
      router?.isReady &&
      !isInstalledIntegrationsLoading &&
      !isInstalled &&
      pageId !== 'overview'
    ) {
      router.replace(`/project/${ref}/integrations/${id}/overview`)
    }
  }, [isInstalled, isInstalledIntegrationsLoading, pageId, router, ref, id])

  // Determine page title, icon, and subtitle based on state
  const pageTitle = integration?.name || 'Integration not found'

  const pageSubTitle =
    integration?.description || 'If you think this is an error, please contact support'

  // Get integration icon and subtitle
  const pageIcon = integration ? (
    <div className="shrink-0 w-14 h-14 relative bg-white border rounded-md flex items-center justify-center">
      {integration.icon()}
    </div>
  ) : null

  // Determine content based on state
  const content = useMemo(() => {
    if (!router?.isReady || isInstalledIntegrationsLoading || isAvailableIntegrationsLoading) {
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
        <PageContainer size="full">
          <PageSection>
            <PageSectionContent>
              <Admonition type="warning" title="This integration is not currently available">
                Please try again later or contact support if the problem persists.
              </Admonition>
            </PageSectionContent>
          </PageSection>
        </PageContainer>
      )
    } else {
      return <Component />
    }
  }, [
    router?.isReady,
    isInstalledIntegrationsLoading,
    isAvailableIntegrationsLoading,
    id,
    integration,
    Component,
  ])

  if (!router?.isReady) {
    return null
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

        {isAvailableIntegrationsLoading ? (
          <PageHeaderMeta>
            <PageHeaderSummary>
              <PageHeaderTitle>
                <ShimmeringLoader className="w-64 py-4" />
              </PageHeaderTitle>
              <PageHeaderDescription>
                <ShimmeringLoader />
              </PageHeaderDescription>
            </PageHeaderSummary>
          </PageHeaderMeta>
        ) : (
          <PageHeaderMeta>
            {pageIcon && <PageHeaderIcon>{pageIcon}</PageHeaderIcon>}
            <PageHeaderSummary className="truncate gap-y-0.5">
              <PageHeaderTitle>{pageTitle}</PageHeaderTitle>
              <PageHeaderDescription className="truncate">{pageSubTitle}</PageHeaderDescription>
            </PageHeaderSummary>

            {integration?.type === 'oauth' ? (
              <InstallOAuthIntegrationButton integration={integration} />
            ) : isMarketplaceEnabled && !!integration && !isInstalled ? (
              <InstallIntegrationSheet integration={integration} />
            ) : isMarketplaceEnabled && isInstalled ? (
              <Button disabled type="outline">
                Installed
              </Button>
            ) : null}
          </PageHeaderMeta>
        )}

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
    <ProjectIntegrationsLayout>{page}</ProjectIntegrationsLayout>
  </DefaultLayout>
)

export default IntegrationPage
