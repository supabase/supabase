import { useParams } from 'common'
import { ArrowUpRight, BookOpen, Settings } from 'lucide-react'
import { useRouter } from 'next/router'
import { useEffect, useMemo } from 'react'
import { Button } from 'ui'
import { GenericSkeletonLoader, ShimmeringLoader } from 'ui-patterns'
import { Admonition } from 'ui-patterns/admonition'

import { MarketplaceDetailHero } from './MarketplaceDetailHero'
import { MarketplaceDetailTopBar } from './MarketplaceDetailTopBar'
import { HealthTab } from './tabs/HealthTab'
import { OverviewTab } from './tabs/OverviewTab'
import { PermissionsTab } from './tabs/PermissionsTab'
import { VersionsTab } from './tabs/VersionsTab'
import { InstallIntegrationSheet } from '@/components/interfaces/Integrations/Integration/IntegrationOverviewTabV2/InstallIntegrationSheet/InstallIntegrationSheet'
import { InstallOAuthIntegrationButton } from '@/components/interfaces/Integrations/Integration/IntegrationOverviewTabV2/InstallIntegrationSheet/InstallOAuthIntegrationButton'
import { useAvailableIntegrations } from '@/components/interfaces/Integrations/Landing/useAvailableIntegrations'
import { useInstalledIntegrations } from '@/components/interfaces/Integrations/Landing/useInstalledIntegrations'
import { UnknownInterface } from '@/components/ui/UnknownInterface'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'

// The new detail page always shows the same 4 tabs regardless of installation
// state — placeholders explain the gap until data wiring lands.
const TABS = [
  { route: 'overview', label: 'Overview' },
  { route: 'permissions', label: 'Permissions' },
  { route: 'health', label: 'Health' },
  { route: 'versions', label: 'Versions' },
] as const

type TabRoute = (typeof TABS)[number]['route']

const isTabRoute = (value: string | undefined): value is TabRoute =>
  TABS.some((tab) => tab.route === value)

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
  const activeTab: TabRoute = isTabRoute(pageId) ? pageId : 'overview'

  useEffect(() => {
    // Bounce unknown subroutes back to Overview so the URL is always one of the
    // four advertised tabs.
    if (router?.isReady && pageId && !isTabRoute(pageId)) {
      router.replace(`/project/${ref}/integrations/${id}/overview`)
    }
  }, [router, pageId, ref, id])

  if (!router?.isReady) return null
  if (!integrationsWrappers && id?.endsWith('_wrapper')) {
    return <UnknownInterface urlBack={`/project/${ref}/integrations`} />
  }

  if (isAvailableLoading || isInstalledLoading) {
    return (
      <>
        <MarketplaceDetailTopBar title="" />
        <div className="border-b bg-surface-75 px-6 pt-10 xl:px-10">
          <div className="mx-auto flex w-full max-w-[1080px] flex-col gap-3 pb-6">
            <ShimmeringLoader className="h-9 w-64" />
            <ShimmeringLoader className="h-4 w-96" />
          </div>
        </div>
        <div className="mx-auto w-full max-w-[1080px] px-6 py-8 xl:px-10">
          <GenericSkeletonLoader />
        </div>
      </>
    )
  }

  if (!integration) {
    return (
      <>
        <MarketplaceDetailTopBar title="Integration not found" />
        <div className="mx-auto w-full max-w-[1080px] px-6 py-8 xl:px-10">
          <Admonition type="warning" title="This integration is not currently available">
            Please try again later or contact support if the problem persists.
          </Admonition>
        </div>
      </>
    )
  }

  const subtitle = (
    <>
      {integration.author?.name && <>By {integration.author.name}</>}
      {integration.author?.name && integration.categories?.[0] && (
        <span className="text-foreground-muted"> · </span>
      )}
      {integration.categories?.[0]}
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

  const tabs = TABS.map((tab) => ({
    label: tab.label,
    href: `/project/${ref}/integrations/${id}/${tab.route}`,
    active: tab.route === activeTab,
  }))

  return (
    <>
      <MarketplaceDetailTopBar
        title={integration.name}
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
        lede={integration.description}
        tabs={tabs}
        isInstalled={isInstalled}
      />

      {activeTab === 'overview' && (
        <OverviewTab integration={integration} isInstalled={isInstalled} />
      )}
      {activeTab === 'permissions' && <PermissionsTab />}
      {activeTab === 'health' && <HealthTab />}
      {activeTab === 'versions' && <VersionsTab />}
    </>
  )
}
