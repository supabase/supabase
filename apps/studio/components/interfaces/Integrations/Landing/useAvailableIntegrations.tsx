import { FeatureFlagContext, IS_PLATFORM, useFlag } from 'common'
import { fullImageUrl } from 'common/marketplace-client'
import { Boxes } from 'lucide-react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { useContext, useMemo } from 'react'
import { cn } from 'ui'

import { INTEGRATIONS, Loading, type IntegrationDefinition } from './Integrations.constants'
import { useIsMarketplaceEnabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import {
  useMarketplaceIntegrationsQuery,
  type MarketplaceIntegration,
} from '@/data/marketplace/integrations-query'
import { useCLIReleaseVersionQuery } from '@/data/misc/cli-release-version-query'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'

const renderMarketplaceLogo = (listingLogo?: string | null) => {
  const MarketplaceLogo = ({ className, ...props }: { className?: string } = {}) => (
    <div className="relative w-full h-full">
      {listingLogo ? (
        <Image
          fill
          src={fullImageUrl(listingLogo)}
          alt=""
          className={cn('p-2', className)}
          {...props}
        />
      ) : (
        <Boxes className={cn('inset-0 p-2 text-black w-full h-full', className)} {...props} />
      )}
    </div>
  )
  return MarketplaceLogo
}

function isForeignDataWrapper(integration: MarketplaceIntegration) {
  return integration.categories.some((c) => c?.slug === 'foreign-data-wrapper')
}

/**
 * [Joshen] Returns a combination of
 * - Marketplace integrations retrieved remotely (Only if feature flag enabled)
 * - Existing integrations that are defined within studio
 */
export const useAvailableIntegrations = () => {
  const { hasLoaded } = useContext(FeatureFlagContext)
  const isMarketplaceEnabled = useIsMarketplaceEnabled()
  const { integrationsWrappers } = useIsFeatureEnabled(['integrations:wrappers'])

  const grafanaEnabled = useFlag('grafanaDashboardIntegrationEnabled')
  const resendEnabled = useFlag('resendDashboardIntegrationEnabled')
  const aikidoEnabled = useFlag('aikidoDashboardIntegrationEnabled')
  const dopplerEnabled = useFlag('dopplerDashboardIntegrationEnabled')

  const { data: cliData } = useCLIReleaseVersionQuery()
  const isCLI = !!cliData?.current

  const { data, error } = useMarketplaceIntegrationsQuery({ enabled: isMarketplaceEnabled })
  const isPending = IS_PLATFORM && (!hasLoaded || (isMarketplaceEnabled && !data && !error))
  const isSuccess = !IS_PLATFORM || (hasLoaded && (!isMarketplaceEnabled || (!!data && !error)))
  const isError = IS_PLATFORM && isMarketplaceEnabled && !!error

  // [Joshen] Format marketplace integrations into existing ones for now
  // Likely that we might need to change, but can look into separately
  // Wrappers from marketplace are excluded here — they are merged into the
  // hardcoded studio wrappers below as content overrides.
  const marketplaceIntegrations: IntegrationDefinition[] = useMemo(
    () =>
      (data ?? [])
        ?.filter((integration) => !isForeignDataWrapper(integration))
        .map((integration) => {
          const {
            id: listingId,
            slug,
            categories,
            featured,
            title,
            description,
            documentation_url: docsUrl,
            website_url: siteUrl,
            installation_url: installUrl,
            installation_url_type: installUrlType,
            installation_identification_method: installMethod,
            secret_key_prefix: secretKeyPrefix,
            edge_function_secret_name: edgeFunctionSecretName,
            images,
            content,
            built_by: authorName,
            listing_logo: listingLogo,
            oauth_app_id: oauthAppId,
          } = integration

          const status = undefined
          const author = { name: authorName ?? '', websiteUrl: '' }

          return {
            id: slug ?? '',
            name: title ?? '',
            status,
            featured: !!featured,
            type: 'oauth' as const, // Currently marketplace only supports oauth apps
            source: 'Partner' as const,
            categories: categories.map((x) => x.slug),
            content,
            files: images?.map((image, i) => ({
              src: fullImageUrl(image),
              alt: `${title} image ${i + 1}`,
            })),
            description,
            docsUrl,
            siteUrl,
            installUrl,
            installUrlType: installUrlType ?? undefined,
            installIdentificationMethod: installMethod ?? undefined,
            secretKeyPrefix: secretKeyPrefix ?? undefined,
            edgeFunctionSecretName: edgeFunctionSecretName ?? undefined,
            oauthAppId: oauthAppId ?? undefined,
            listingId: listingId ?? undefined,
            author,
            requiredExtensions: [],
            icon: renderMarketplaceLogo(listingLogo),
            navigation: [
              {
                route: 'overview',
                label: 'Overview',
              },
            ],
            navigate: ({ pageId = 'overview' }) => {
              switch (pageId) {
                case 'overview':
                  return dynamic(
                    () =>
                      import('@/components/interfaces/Integrations/Integration/MarketplaceIntegrationOverviewTab').then(
                        (mod) => mod.MarketplaceIntegrationOverviewTab
                      ),
                    {
                      loading: Loading,
                    }
                  )
              }
              return null
            },
          }
        }),
    [data]
  )

  // Marketplace wrapper listings keyed by their studio-equivalent id
  // (marketplace uses dash-separated slugs, studio uses underscore-separated ids).
  const marketplaceWrappers = useMemo(() => {
    const map: Record<string, MarketplaceIntegration> = {}
    ;(data ?? []).forEach((integration) => {
      if (!isForeignDataWrapper(integration)) return
      map[integration.slug.replaceAll('-', '_')] = integration
    })
    return map
  }, [data])

  // [Joshen] Existing integrations that are defined within studio
  // Available integrations are all integrations that can be installed. If an integration can't be installed (needed
  // extensions are not available on this DB image), the UI will provide a tooltip explaining why.
  const allIntegrations = useMemo(() => {
    return INTEGRATIONS.filter((integration) => {
      if (!integrationsWrappers && integration.type === 'wrapper') {
        return false
      }

      if (integration.id === 'stripe_sync_engine' && isCLI) {
        return false
      }

      return true
    }).map((integration) => {
      const isWrapper = integration.type === 'wrapper'
      if (!isWrapper) return integration

      const marketplaceWrapper = marketplaceWrappers[integration.id]
      if (!marketplaceWrapper) return integration

      const {
        title,
        description,
        content,
        documentation_url: docsUrl,
        website_url: siteUrl,
        images,
        built_by: authorName,
        listing_logo: listingLogo,
      } = marketplaceWrapper

      const overrides = {
        name: title,
        description,
        content,
        docsUrl,
        siteUrl,
        author: authorName ? { name: authorName, websiteUrl: '' } : undefined,
        files: images?.map((image, i) => ({
          src: fullImageUrl(image),
          alt: `${title} screenshot ${i + 1}`,
        })),
        icon: listingLogo ? renderMarketplaceLogo(listingLogo) : undefined,
      }

      return {
        ...integration,
        ...Object.fromEntries(Object.entries(overrides).filter(([, v]) => v != null)),
      }
    })
  }, [integrationsWrappers, isCLI, marketplaceWrappers])

  const dataWithMarketplace = useMemo(() => {
    const flagGatedIds: Record<string, boolean> = {
      grafana: grafanaEnabled,
      resend: resendEnabled,
      aikido: aikidoEnabled,
      doppler: dopplerEnabled,
    }

    return [...marketplaceIntegrations, ...allIntegrations]
      .filter((integration) => flagGatedIds[integration.id] !== false)
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [
    marketplaceIntegrations,
    allIntegrations,
    grafanaEnabled,
    resendEnabled,
    aikidoEnabled,
    dopplerEnabled,
  ])

  return {
    data: dataWithMarketplace,
    error,
    isPending,
    isSuccess,
    isError,
  }
}
