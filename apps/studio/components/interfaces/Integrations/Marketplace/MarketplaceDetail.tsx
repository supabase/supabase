import { useParams } from 'common'
import { ArrowUpRight, BookOpen, Settings } from 'lucide-react'
import { useRouter } from 'next/router'
import { useEffect, useMemo } from 'react'
import { Button, cn } from 'ui'
import { GenericSkeletonLoader, ShimmeringLoader } from 'ui-patterns'
import { Admonition } from 'ui-patterns/admonition'

import { formatCategoryLabel } from './Marketplace.constants'
import { MarketplaceDetailHero } from './MarketplaceDetailHero'
import { MarketplaceDetailTopBar } from './MarketplaceDetailTopBar'
import { OverviewTab } from './OverviewTab'
import { InstallIntegrationSheet } from '@/components/interfaces/Integrations/Integration/IntegrationOverviewTabV2/InstallIntegrationSheet/InstallIntegrationSheet'
import { InstallOAuthIntegrationButton } from '@/components/interfaces/Integrations/Integration/IntegrationOverviewTabV2/InstallIntegrationSheet/InstallOAuthIntegrationButton'
import { useAvailableIntegrations } from '@/components/interfaces/Integrations/Landing/useAvailableIntegrations'
import { useInstalledIntegrations } from '@/components/interfaces/Integrations/Landing/useInstalledIntegrations'
import { UnknownInterface } from '@/components/ui/UnknownInterface'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'

export const centeredContentClass = 'mx-auto w-full max-w-6xl px-6 xl:px-10'

export const MarketplaceDetail = () => {
  const router = useRouter()
  const { ref, id, pageId } = useParams()

  const { integrationsWrappers } = useIsFeatureEnabled(['integrations:wrappers'])

  const { data: allIntegrations, isPending: isAvailableLoading } = useAvailableIntegrations()
  const { installedIntegrations, isLoading: isInstalledLoading } = useInstalledIntegrations()

  const integration = useMemo(() => allIntegrations.find((i) => i.id === id), [allIntegrations, id])
  const installation = useMemo(
    () => installedIntegrations.find((i) => i.id === id),
    [installedIntegrations, id]
  )

  const isInstalled = !!integration && !!installation

  // Tabs come from each integration's own navigation definition (e.g. Cron → Jobs,
  // Vault → Secrets). Before install we only expose Overview; the custom subviews
  // unlock once the integration is installed.
  const navigationItems = useMemo(() => {
    if (!integration?.navigation) return []
    return isInstalled
      ? integration.navigation
      : integration.navigation.filter((nav) => nav.route === 'overview')
  }, [integration, isInstalled])

  const activeRoute = pageId ?? 'overview'
  const activeNav = useMemo(
    () => navigationItems.find((nav) => nav.route === activeRoute),
    [navigationItems, activeRoute]
  )
  const isKnownRoute = !!activeNav
  const layout = activeNav?.layout ?? 'full'

  const CustomPageComponent = useMemo(
    () =>
      activeRoute !== 'overview' && isKnownRoute
        ? integration?.navigate({ id, pageId, childId: undefined })
        : null,
    [integration, activeRoute, isKnownRoute, id, pageId]
  )

  useEffect(() => {
    if (
      router?.isReady &&
      !isAvailableLoading &&
      !isInstalledLoading &&
      !!integration &&
      pageId &&
      !isKnownRoute
    ) {
      router.replace(`/project/${ref}/integrations/${id}/overview`)
    }
  }, [router, pageId, ref, id, integration, isKnownRoute, isAvailableLoading, isInstalledLoading])

  if (!router?.isReady) return null
  if (!integrationsWrappers && id?.endsWith('_wrapper')) {
    return <UnknownInterface urlBack={`/project/${ref}/integrations`} />
  }

  if (isAvailableLoading || isInstalledLoading) {
    return (
      <>
        <MarketplaceDetailTopBar title="" />
        <div className={cn(centeredContentClass, 'border-b bg-surface-75 pt-10')}>
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 pb-6">
            <ShimmeringLoader className="h-9 w-64" />
            <ShimmeringLoader className="h-4 w-96" />
          </div>
        </div>
        <div className={cn(centeredContentClass, 'py-8')}>
          <GenericSkeletonLoader />
        </div>
      </>
    )
  }

  if (!integration) {
    return (
      <>
        <MarketplaceDetailTopBar title="Integration not found" />
        <div className={cn(centeredContentClass, 'py-8')}>
          <Admonition type="warning" title="This integration is not currently available">
            Please try again later or contact support if the problem persists.
          </Admonition>
        </div>
      </>
    )
  }

  const categoryLabel = formatCategoryLabel(integration.categories?.[0])
  const subtitle = (
    <>
      {integration.author?.name && <>By {integration.author.name}</>}
      {integration.author?.name && categoryLabel && (
        <span className="text-foreground-muted"> · </span>
      )}
      {categoryLabel}
    </>
  )

  const renderInstallAction = () => {
    if (integration.type === 'oauth') {
      return <InstallOAuthIntegrationButton integration={integration} />
    }
    if (isInstalled) {
      return (
        <Button type="outline" disabled icon={<Settings size={13} />}>
          Installed
        </Button>
      )
    }
    return <InstallIntegrationSheet integration={integration} />
  }

  const tabs = navigationItems.map((nav) => ({
    label: nav.label,
    href: `/project/${ref}/integrations/${id}/${nav.route}`,
    active: nav.route === activeRoute,
  }))

  return (
    <>
      <MarketplaceDetailTopBar
        title={integration.name}
        isInstalled={isInstalled}
        actions={
          <>
            {integration.docsUrl && (
              <Button
                type="text"
                size="tiny"
                icon={<BookOpen size={13} />}
                iconRight={<ArrowUpRight size={13} />}
                asChild
              >
                <a href={integration.docsUrl} target="_blank" rel="noreferrer">
                  Docs
                </a>
              </Button>
            )}
            {renderInstallAction()}
          </>
        }
      />

      <MarketplaceDetailHero
        integration={integration}
        subtitle={subtitle}
        description={integration.description}
        tabs={tabs}
      />

      {activeRoute === 'overview' ? (
        <div className={centeredContentClass}>
          <OverviewTab integration={integration} isInstalled={isInstalled} />
        </div>
      ) : CustomPageComponent ? (
        layout === 'constrained' ? (
          <div className={centeredContentClass}>
            <CustomPageComponent />
          </div>
        ) : (
          <CustomPageComponent />
        )
      ) : null}
    </>
  )
}
