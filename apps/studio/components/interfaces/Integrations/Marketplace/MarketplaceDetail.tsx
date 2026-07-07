import { ArrowUpRight, BookOpen, Gauge, Settings } from 'lucide-react'
import { useRouter } from 'next/router'
import { Button, cn } from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { GenericSkeletonLoader, ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { MarketplaceDetailBreadrumbs } from './MarketplaceDetailBreadcrumbs'
import { MarketplaceDetailHero } from './MarketplaceDetailHero'
import { OverviewTab } from './OverviewTab'
import { IntegrationDetailTabShortcuts } from '@/components/interfaces/Integrations/Integration/IntegrationDetailTabShortcuts'
import { InstallIntegrationSheet } from '@/components/interfaces/Integrations/Integration/IntegrationOverviewTabV2/InstallIntegrationSheet/InstallIntegrationSheet'
import { InstallOAuthIntegrationButton } from '@/components/interfaces/Integrations/Integration/IntegrationOverviewTabV2/InstallIntegrationSheet/InstallOAuthIntegrationButton'
import { useIntegrationDetail } from '@/components/interfaces/Integrations/Landing/useIntegrationDetail'
import { AddWrapperButton } from '@/components/interfaces/Integrations/Wrappers/AddWrapperButton'
import { UnknownInterface } from '@/components/ui/UnknownInterface'

export const centeredContentClass = 'mx-auto w-full max-w-6xl px-6 xl:px-10'

export const MarketplaceDetail = () => {
  const router = useRouter()
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
    integrationStatus,
    isInstalled,
    installActionType,
    wrappersTabHref,
    isAvailableLoading,
    isInstalledLoading,
    isIntegrationStatusLoading,
    oauthIntegrationData,
    Component,
  } = useIntegrationDetail()

  if (!isReady) return null
  if (isWrapperBlocked) return <UnknownInterface urlBack={`/project/${ref}/integrations`} />

  if (isAvailableLoading || isInstalledLoading || isIntegrationStatusLoading) {
    return (
      <>
        <MarketplaceDetailBreadrumbs isLoading />
        <div className={cn(centeredContentClass, 'max-w-none border-b bg-surface-75 pt-10')}>
          <div className="mx-auto flex w-full flex-col gap-3 pb-6">
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
        <MarketplaceDetailBreadrumbs title="Integration not found" />
        <div className={cn(centeredContentClass, 'py-8')}>
          <Admonition type="warning" title="This integration is not currently available">
            Please try again later or contact support if the problem persists.
          </Admonition>
        </div>
      </>
    )
  }

  const renderInstallAction = () => {
    switch (installActionType) {
      case 'oauth':
        return (
          <InstallOAuthIntegrationButton
            integration={integration}
            data={oauthIntegrationData}
            isLoading={isIntegrationStatusLoading}
          />
        )
      case 'add-wrapper':
        return (
          <AddWrapperButton
            variant="primary"
            onClick={() => {
              if (wrappersTabHref) router.push(`${wrappersTabHref}?new=true`)
            }}
          />
        )
      case 'installed':
        return (
          <Button variant="outline" disabled>
            Installed
          </Button>
        )
      default:
        return <InstallIntegrationSheet integration={integration} />
    }
  }

  // For overview route, get the integration-specific overview component if available
  const OverviewComponent = activeRoute === 'overview' ? Component : null
  const CustomPageComponent = activeRoute !== 'overview' && isKnownRoute ? Component : null

  return (
    <>
      <IntegrationDetailTabShortcuts tabs={tabs} />
      <MarketplaceDetailBreadrumbs
        title={integration.name}
        isInstalled={isInstalled}
        actions={
          <>
            {isInstalled && integrationStatus?.partner_links?.dashboard && (
              <Button
                variant="text"
                size="tiny"
                icon={<Gauge size={13} />}
                iconRight={<ArrowUpRight size={13} />}
                asChild
              >
                <a
                  href={integrationStatus.partner_links.dashboard}
                  target="_blank"
                  rel="noreferrer"
                >
                  Dashboard
                </a>
              </Button>
            )}
            {isInstalled && integrationStatus?.partner_links?.manage && (
              <Button
                variant="text"
                size="tiny"
                icon={<Settings size={13} />}
                iconRight={<ArrowUpRight size={13} />}
                asChild
              >
                <a href={integrationStatus.partner_links.manage} target="_blank" rel="noreferrer">
                  Manage
                </a>
              </Button>
            )}
            {integration.docsUrl && (
              <Button
                variant="text"
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
          <div className="flex-1 min-h-0">
            <CustomPageComponent />
          </div>
        )
      ) : null}
    </>
  )
}
