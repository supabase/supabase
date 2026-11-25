import { useNavigate } from '@tanstack/react-router'
import { useParams } from 'common'
import { useEffect, useMemo } from 'react'

import { useProjectOAuthIntegrationData } from './Landing.utils'
import { useAvailableIntegrations } from './useAvailableIntegrations'
import { useInstalledIntegrations } from './useInstalledIntegrations'
import { getInstallActionType, type InstallActionType } from './useIntegrationDetail.utils'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { navigateToUrl } from '@/lib/navigation'

export type IntegrationTab = {
  label: string
  href: string
  active: boolean
}

export const useIntegrationDetail = () => {
  const navigate = useNavigate()
  const { ref, id, pageId, childId } = useParams()

  const { integrationsWrappers } = useIsFeatureEnabled(['integrations:wrappers'])

  const { data: project } = useSelectedProjectQuery()

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

  const navItems = useMemo(() => integration?.navigation ?? [], [integration])

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
    () => getInstallActionType({ integration, isInstalled }),
    [integration, isInstalled]
  )

  const isReady = true
  const isWrapperBlocked = !integrationsWrappers && !!id?.endsWith('_wrapper')

  const pageTitle = integration?.name ?? 'Integration not found'
  const pageSubTitle =
    integration?.description ?? 'If you think this is an error, please contact support'

  useEffect(() => {
    if (!isAvailableLoading && !isInstalledLoading && !!integration && pageId && !isKnownRoute) {
      navigateToUrl(navigate, `/project/${ref}/integrations/${id}/overview`, { replace: true })
    }
  }, [navigate, pageId, ref, id, integration, isKnownRoute, isAvailableLoading, isInstalledLoading])

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
    installActionType,
    wrappersTabHref,
    isAvailableLoading,
    isInstalledLoading,
    isIntegrationStatusLoading,
    oauthIntegrationData: projectData,
    Component,
  }
}
