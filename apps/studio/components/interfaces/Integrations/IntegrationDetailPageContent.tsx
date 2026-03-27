'use client'

import { useParams } from 'common'
import { INTEGRATIONS } from 'components/interfaces/Integrations/Landing/Integrations.constants'
import { useInstalledIntegrations } from 'components/interfaces/Integrations/Landing/useInstalledIntegrations'
import { UnknownInterface } from 'components/ui/UnknownInterface'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useRouter as useCompatRouter } from 'next/compat/router'
import Link from 'next/link'
import { useRouter as useAppRouter } from 'next/navigation'
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

import { useAvailableIntegrations } from '@/components/interfaces/Integrations/Landing/useAvailableIntegrations'

type NavigationItem = { label: string; href: string; active?: boolean }

interface IntegrationDetailPageContentProps {
  routePrefix: string
  listHref: string
  showHeader?: boolean
  allowWrapperGuard?: boolean
}

export function IntegrationDetailPageContent({
  routePrefix,
  listHref,
  showHeader = true,
  allowWrapperGuard = true,
}: IntegrationDetailPageContentProps) {
  const compatRouter = useCompatRouter()
  const appRouter = useAppRouter()
  const { id, pageId, childId } = useParams()
  const { integrationsWrappers } = useIsFeatureEnabled(['integrations:wrappers'])

  const { data: allIntegrations, isPending: isAvailableIntegrationsLoading } =
    useAvailableIntegrations()
  const hasAvailableIntegrations = (allIntegrations?.length ?? 0) > 0
  const effectiveIsAvailableIntegrationsLoading =
    isAvailableIntegrationsLoading && !hasAvailableIntegrations
  const { installedIntegrations, isLoading: isInstalledIntegrationsLoading } =
    useInstalledIntegrations()

  const isReady = compatRouter ? Boolean(compatRouter.isReady) : true

  const integration = useMemo(() => allIntegrations.find((i) => i.id === id), [allIntegrations, id])
  const installation = useMemo(
    () => installedIntegrations.find((inst) => inst.id === id),
    [installedIntegrations, id]
  )

  const Component = useMemo(() => {
    if (!id) return null
    return integration?.navigate(id, pageId, childId) ?? null
  }, [integration, id, pageId, childId])

  const navigationItems: NavigationItem[] = useMemo(() => {
    if (!showHeader || !integration?.navigation) return []

    const showNavigation = installation || pageId === 'overview'
    if (!showNavigation) return []

    const availableTabs = installation
      ? integration.navigation
      : integration.navigation.filter((tab) => tab.route === 'overview')

    return availableTabs.map((nav) => ({
      label: nav.label,
      href: `${routePrefix}/${id}/${nav.route}`,
      active: pageId === nav.route,
    }))
  }, [showHeader, integration, installation, pageId, routePrefix, id])

  useEffect(() => {
    if (!isReady || isInstalledIntegrationsLoading || installation || pageId === 'overview') return
    const overviewHref = `${routePrefix}/${id}/overview`
    if (compatRouter) void compatRouter.replace(overviewHref)
    else void appRouter.replace(overviewHref)
  }, [
    isReady,
    isInstalledIntegrationsLoading,
    installation,
    pageId,
    routePrefix,
    id,
    compatRouter,
    appRouter,
  ])

  const content = useMemo(() => {
    if (!isReady || isInstalledIntegrationsLoading || effectiveIsAvailableIntegrationsLoading) {
      return (
        <PageContainer size="full">
          <PageSection>
            <PageSectionContent>
              <GenericSkeletonLoader />
            </PageSectionContent>
          </PageSection>
        </PageContainer>
      )
    }

    if (!Component || !id || !integration) {
      return (
        <PageContainer size="full">
          {showHeader && (
            <PageHeader size="full">
              <PageHeaderMeta>
                <PageHeaderSummary>
                  <PageHeaderTitle>Integration not found</PageHeaderTitle>
                  <PageHeaderDescription>
                    If you think this is an error, please contact support.
                  </PageHeaderDescription>
                </PageHeaderSummary>
              </PageHeaderMeta>
            </PageHeader>
          )}
          <PageSection>
            <PageSectionContent>
              <Admonition type="warning" title="This integration is not currently available">
                Please try again later or contact support if the problem persists.
              </Admonition>
            </PageSectionContent>
          </PageSection>
        </PageContainer>
      )
    }

    return <Component />
  }, [
    isReady,
    isInstalledIntegrationsLoading,
    effectiveIsAvailableIntegrationsLoading,
    Component,
    id,
    integration,
    showHeader,
  ])

  if (!isReady) return null

  if (allowWrapperGuard && !integrationsWrappers && id?.endsWith('_wrapper')) {
    return <UnknownInterface urlBack={listHref} />
  }

  if (!showHeader) return content

  const pageTitle = integration?.name || 'Integration not found'
  const pageSubTitle =
    integration?.description || 'If you think this is an error, please contact support'

  const pageIcon = integration ? (
    <div className="shrink-0 w-14 h-14 relative bg-white border rounded-md flex items-center justify-center">
      {integration.icon()}
    </div>
  ) : null

  return (
    <>
      <PageHeader size="full">
        <PageHeaderBreadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={listHref}>Integrations</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{integration?.name || 'Integration not found'}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </PageHeaderBreadcrumb>

        {effectiveIsAvailableIntegrationsLoading ? (
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

            {integration?.type === 'oauth' && (
              <Button asChild type="primary" className="shrink-0">
                <a target="_blank" rel="noreferrer" href={integration.siteUrl ?? '/'}>
                  Install integration
                </a>
              </Button>
            )}
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

export const INTEGRATIONS_BY_ID = Object.fromEntries(INTEGRATIONS.map((i) => [i.id, i] as const))
