import { useParams } from 'common'
import { useRouter } from 'next/router'
import { useEffect, useMemo } from 'react'

import { useProjectOAuthIntegrationData } from './Landing.utils'
import { useAvailableIntegrations } from './useAvailableIntegrations'
import { useInstalledIntegrations } from './useInstalledIntegrations'
import {
  areRequiredExtensionsInstalledFor,
  getFilteredNavItems,
  getInstallActionType,
  type InstallActionType,
} from './useIntegrationDetail.utils'
import { useIsMarketplaceEnabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { useDatabaseExtensionsQuery } from '@/data/database-extensions/database-extensions-query'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

export type IntegrationTab = {
  label: string
  href: string
  active: boolean
}

export const useIntegrationDetail = () => {
  const router = useRouter()
  const { ref, id, pageId, childId } = useParams()

  const { integrationsWrappers } = useIsFeatureEnabled(['integrations:wrappers'])
  const isMarketplaceEnabled = useIsMarketplaceEnabled()

  const { data: project } = useSelectedProjectQuery()
  const { data: extensions } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const { data: allIntegrations, isPending: isAvailableLoading } = useAvailableIntegrations()
  const { installedIntegrations, isLoading: isInstalledLoading } = useInstalledIntegrations()

  // wrapped in useMemo to avoid UI resets when installing additional extensions like pg_net
  const integration = useMemo(() => allIntegrations.find((i) => i.id === id), [allIntegrations, id])
  const installation = useMemo(
    () => installedIntegrations.find((i) => i.id === id),
    [installedIntegrations, id]
  )

  // There does exist a mgmt-api endpoint to get a single status by integration-id, but the bulk results are likely already cached so go ahead and use them.
  const { data: projectData, isLoading: isIntegrationStatusLoading } =
    useProjectOAuthIntegrationData(project?.ref, { enabled: integration?.type === 'oauth' })
  const integrationStatus = useMemo(
    () => projectData.partnerIntegrations.find((i) => i.listing_slug === id),
    [projectData, id]
  )

  const isInstalled = !!integration && !!installation

  const areRequiredExtensionsInstalled = useMemo(
    () => areRequiredExtensionsInstalledFor(integration, extensions),
    [integration, extensions]
  )

  const navItems = useMemo(
    () =>
      getFilteredNavItems({
        integration,
        isInstalled,
        isMarketplaceEnabled,
        areRequiredExtensionsInstalled,
      }),
    [integration, isInstalled, isMarketplaceEnabled, areRequiredExtensionsInstalled]
  )

  const activeRoute = pageId ?? 'overview'

  const activeNav = useMemo(
    () => navItems.find((nav) => nav.route === activeRoute),
    [navItems, activeRoute]
  )

  const isKnownRoute = !!activeNav
  const layout = (activeNav?.layout ?? 'full') as 'full' | 'constrained'

  const tabs: IntegrationTab[] = useMemo(
    () =>
      navItems.map((nav) => ({
        label: nav.label,
        href: `/project/${ref}/integrations/${id}/${nav.route}`,
        active: nav.route === activeRoute,
      })),
    [navItems, ref, id, activeRoute]
  )

  const Component = useMemo(
    () => integration?.navigate({ id, pageId, childId }),
    [integration, id, pageId, childId]
  )

  const wrappersTabHref = useMemo(
    () => tabs.find((tab) => tab.href.endsWith('/wrappers'))?.href,
    [tabs]
  )

  const installActionType: InstallActionType = useMemo(
    () =>
      getInstallActionType({
        integration,
        isMarketplaceEnabled,
        areRequiredExtensionsInstalled,
        isInstalled,
      }),
    [integration, isMarketplaceEnabled, areRequiredExtensionsInstalled, isInstalled]
  )

  const isReady = !!router?.isReady
  const isWrapperBlocked = !integrationsWrappers && !!id?.endsWith('_wrapper')

  const pageTitle = integration?.name ?? 'Integration not found'
  const pageSubTitle =
    integration?.description ?? 'If you think this is an error, please contact support'

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

  return {
    ref,
    id,
    pageId,
    childId,
    activeRoute,
    activeNav,
    isKnownRoute,
    layout,
    tabs,
    isReady,
    isWrapperBlocked,
    pageTitle,
    pageSubTitle,
    integrationsWrappers,
    integration,
    installation,
    integrationStatus,
    isInstalled,
    areRequiredExtensionsInstalled,
    installActionType,
    wrappersTabHref,
    isAvailableLoading,
    isInstalledLoading,
    isIntegrationStatusLoading,
    oauthIntegrationData: projectData,
    Component,
  }
}
