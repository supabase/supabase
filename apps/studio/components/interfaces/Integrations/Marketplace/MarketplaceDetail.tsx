import { ArrowUpRight, BookOpen } from 'lucide-react'
import { Button, cn } from 'ui'
import { GenericSkeletonLoader, ShimmeringLoader } from 'ui-patterns'
import { Admonition } from 'ui-patterns/admonition'

import { MarketplaceDetailHero } from './MarketplaceDetailHero'
import { MarketplaceDetailTopBar } from './MarketplaceDetailTopBar'
import { OverviewTab } from './OverviewTab'
import { IntegrationDetailTabShortcuts } from '@/components/interfaces/Integrations/Integration/IntegrationDetailTabShortcuts'
import { InstallIntegrationSheet } from '@/components/interfaces/Integrations/Integration/IntegrationOverviewTabV2/InstallIntegrationSheet/InstallIntegrationSheet'
import { InstallOAuthIntegrationButton } from '@/components/interfaces/Integrations/Integration/IntegrationOverviewTabV2/InstallIntegrationSheet/InstallOAuthIntegrationButton'
import { useIntegrationDetail } from '@/components/interfaces/Integrations/Landing/useIntegrationDetail'
import { UnknownInterface } from '@/components/ui/UnknownInterface'

export const centeredContentClass = 'mx-auto w-full max-w-6xl px-6 xl:px-10'

export const MarketplaceDetail = () => {
  const {
    ref,
    activeRoute,
    isKnownRoute,
    layout,
    tabs,
    isReady,
    isWrapperBlocked,
    pageTitle,
    pageSubTitle,
    integration,
    isInstalled,
    isAvailableLoading,
    isInstalledLoading,
    Component,
  } = useIntegrationDetail()

  if (!isReady) return null
  if (isWrapperBlocked) return <UnknownInterface urlBack={`/project/${ref}/integrations`} />

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

  const renderInstallAction = () => {
    if (integration.type === 'oauth') {
      return <InstallOAuthIntegrationButton integration={integration} />
    }
    if (isInstalled) {
      return (
        <Button type="outline" disabled>
          Installed
        </Button>
      )
    }
    return <InstallIntegrationSheet integration={integration} />
  }

  // For overview route, get the integration-specific overview component if available
  const OverviewComponent = activeRoute === 'overview' ? Component : null
  const CustomPageComponent = activeRoute !== 'overview' && isKnownRoute ? Component : null

  return (
    <>
      <IntegrationDetailTabShortcuts tabs={tabs} />
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
        title={pageTitle}
        subtitle={pageSubTitle}
        tabs={tabs}
      />

      {activeRoute === 'overview' ? (
        <div className={centeredContentClass}>
          <OverviewTab integration={integration} isInstalled={isInstalled}>
            {OverviewComponent && <OverviewComponent />}
          </OverviewTab>
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
