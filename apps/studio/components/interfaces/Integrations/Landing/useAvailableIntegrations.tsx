import { FeatureFlagContext, IS_PLATFORM } from 'common'
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

/**
 * [Joshen] Returns a combination of
 * - Marketplace integrations retrieved remotely (Only if feature flag enabled)
 * - Existing integrations that are defined within studio
 */
export const useAvailableIntegrations = () => {
  const { hasLoaded } = useContext(FeatureFlagContext)
  const isMarketplaceEnabled = useIsMarketplaceEnabled()
  const { integrationsWrappers } = useIsFeatureEnabled(['integrations:wrappers'])

  const { data: cliData } = useCLIReleaseVersionQuery()
  const isCLI = !!cliData?.current

  const { data, error } = useMarketplaceIntegrationsQuery({ enabled: isMarketplaceEnabled })
  const isPending = IS_PLATFORM && (!hasLoaded || (isMarketplaceEnabled && !data && !error))
  const isSuccess = !IS_PLATFORM || (hasLoaded && (!isMarketplaceEnabled || (!!data && !error)))
  const isError = IS_PLATFORM && isMarketplaceEnabled && !!error

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
    MarketplaceLogo.displayName = 'MarketplaceLogo'
    return MarketplaceLogo
  }

  const isForeignDataWrapper = (integration: MarketplaceIntegration) =>
    integration.categories.some((c) => c?.slug === 'foreign-data-wrapper')

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
            partner_name: authorName,
            listing_logo: listingLogo,
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
            categories: Array.isArray(categories) ? categories.map((x) => x.slug) : [],
            content,
            files: images?.map((image) => fullImageUrl(image)),
            description,
            docsUrl,
            siteUrl,
            installUrl,
            installUrlType: installUrlType ?? undefined,
            installIdentificationMethod: installMethod ?? undefined,
            secretKeyPrefix: secretKeyPrefix ?? undefined,
            edgeFunctionSecretName: edgeFunctionSecretName ?? undefined,
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
      const slug = integration.slug
      if (!slug) return
      map[slug.replaceAll('-', '_')] = integration
    })
    return map
  }, [data])

  // [Joshen] Existing integrations that are defined within studio
  // Available integrations are all integrations that can be installed. If an integration can't be installed (needed
  // extensions are not available on this DB image), the UI will provide a tooltip explaining why.
  const allIntegrations = useMemo(() => {
    return INTEGRATIONS.filter((integration) => {
      if (
        !integrationsWrappers &&
        (integration.type === 'wrapper' || integration.id.endsWith('_wrapper'))
      ) {
        return false
      }

      if (integration.id === 'stripe_sync_engine' && isCLI) {
        return false
      }

      return true
    }).map((integration) => {
      const isWrapper = integration.type === 'wrapper' || integration.id.endsWith('_wrapper')
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
        partner_name: authorName,
        listing_logo: listingLogo,
      } = marketplaceWrapper

      return {
        ...integration,
        ...(title ? { name: title } : {}),
        ...(description ? { description } : {}),
        ...(content ? { content } : {}),
        ...(docsUrl ? { docsUrl } : {}),
        ...(siteUrl ? { siteUrl } : {}),
        ...(authorName ? { author: { name: authorName, websiteUrl: '' } } : {}),
        ...(images ? { files: images.map((image) => fullImageUrl(image)) } : {}),
        ...(listingLogo ? { icon: renderMarketplaceLogo(listingLogo) } : {}),
      }
    })
  }, [integrationsWrappers, isCLI, marketplaceWrappers])

  const dataWithMarketplace = useMemo(() => {
    return [...marketplaceIntegrations, ...allIntegrations].sort((a, b) =>
      a.name.localeCompare(b.name)
    )
  }, [marketplaceIntegrations, allIntegrations])

  return {
    data: dataWithMarketplace,
    error,
    isPending,
    isSuccess,
    isError,
  }
}
