import { useQuery } from '@tanstack/react-query'
import { FeatureFlagContext, IS_PLATFORM, useFlag } from 'common'
import { Boxes } from 'lucide-react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { useContext, useMemo } from 'react'
import { cn } from 'ui'

import { INTEGRATIONS, Loading, type IntegrationDefinition } from './Integrations.constants'
import { marketplaceIntegrationsQueryOptions } from '@/data/marketplace/integrations-query'
import { useCLIReleaseVersionQuery } from '@/data/misc/cli-release-version-query'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'

const fullImageUrl = (imagePath: string) => {
  const API_URL = process.env.NEXT_PUBLIC_MARKETPLACE_API_URL || ''
  return `${API_URL}${imagePath}`
}

/**
 * [Joshen] Returns a combination of
 * - Marketplace integrations retrieved remotely (Only if feature flag enabled)
 * - Existing integrations that are defined within studio
 */
export const useAvailableIntegrations = () => {
  const { hasLoaded } = useContext(FeatureFlagContext)
  const isMarketplaceEnabled = useFlag('marketplaceIntegrations')
  const { integrationsWrappers } = useIsFeatureEnabled(['integrations:wrappers'])

  const { data: cliData } = useCLIReleaseVersionQuery()
  const isCLI = !!cliData?.current

  const { data, error } = useQuery({
    ...marketplaceIntegrationsQueryOptions(),
    enabled: isMarketplaceEnabled,
  })
  const isPending = IS_PLATFORM && (!hasLoaded || (isMarketplaceEnabled && !data && !error))
  const isSuccess = !IS_PLATFORM || (hasLoaded && (!isMarketplaceEnabled || (!!data && !error)))
  const isError = IS_PLATFORM && isMarketplaceEnabled && !!error

  // [Joshen] Format marketplace integrations into existing ones for now
  // Likely that we might need to change, but can look into separately
  const marketplaceIntegrations: IntegrationDefinition[] = useMemo(
    () =>
      (data ?? [])?.map((integration) => {
        const {
          id: listingId,
          slug,
          categories,
          title,
          description,
          documentation_url: docsUrl,
          website_url: siteUrl,
          installation_url: installUrl,
          installation_url_type: installUrlType,
          installation_identification_method: installMethod,
          secret_key_prefix: secretKeyPrefix,
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
          type: 'oauth' as const, // Currently marketplace only supports oauth apps
          categories: Array.isArray(categories)
            ? (categories as Array<{ slug: string }>).map((x) => x.slug)
            : [],
          content,
          files: images?.map((image) => fullImageUrl(image)),
          description,
          docsUrl,
          siteUrl,
          installUrl,
          installUrlType: installUrlType ?? undefined,
          installIdentificationMethod: installMethod ?? undefined,
          secretKeyPrefix: secretKeyPrefix ?? undefined,
          listingId: listingId ?? undefined,
          author,
          requiredExtensions: [],
          icon: ({ className, ...props } = {}) => (
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
                <Boxes
                  className={cn('inset-0 p-2 text-black w-full h-full', className)}
                  {...props}
                />
              )}
            </div>
          ),
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
                    import('@/components/interfaces/Integrations/Integration/IntegrationOverviewTabV2/index').then(
                      (mod) => mod.IntegrationOverviewTabV2
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
    })
  }, [integrationsWrappers, isCLI])

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
