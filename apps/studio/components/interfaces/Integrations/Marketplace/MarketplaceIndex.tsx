import { useQuery } from '@tanstack/react-query'
import { parseAsString, parseAsStringEnum, useQueryState } from 'nuqs'
import { useMemo } from 'react'
import {
  PageContainer,
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns'

import {
  FEATURED_INTEGRATION_IDS,
  getMarketplaceTier,
  getMarketplaceType,
  type MarketplaceIntegrationType,
} from './Marketplace.constants'
import { MarketplaceCard } from './MarketplaceCard'
import { MarketplaceCategoryGrid } from './MarketplaceCategoryGrid'
import { MarketplaceFeaturedRail } from './MarketplaceFeaturedRail'
import { MarketplaceFilterBar, type ViewMode } from './MarketplaceFilterBar'
import { MarketplaceListHeader, MarketplaceListRow } from './MarketplaceListRow'
import { IntegrationLoadingCard } from '@/components/interfaces/Integrations/Landing/IntegrationCard'
import { useAvailableIntegrations } from '@/components/interfaces/Integrations/Landing/useAvailableIntegrations'
import { useInstalledIntegrations } from '@/components/interfaces/Integrations/Landing/useInstalledIntegrations'
import { AlertError } from '@/components/ui/AlertError'
import { DocsButton } from '@/components/ui/DocsButton'
import { NoSearchResults } from '@/components/ui/NoSearchResults'
import { marketplaceCategoriesQueryOptions } from '@/data/marketplace/integration-categories-query'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { DOCS_URL } from '@/lib/constants'

const MARKETPLACE_VIEW_MODE_STORAGE_KEY = 'supabase.marketplace.viewMode'

export const MarketplaceIndex = () => {
  const [search, setSearch] = useQueryState(
    'search',
    parseAsString.withDefault('').withOptions({ clearOnDefault: true })
  )
  const [category, setCategory] = useQueryState(
    'category',
    parseAsString.withOptions({ clearOnDefault: true })
  )
  const [type, setType] = useQueryState(
    'type',
    parseAsStringEnum<MarketplaceIntegrationType>([
      'oauth',
      'postgres_extension',
      'template',
      'wrapper',
    ]).withOptions({ clearOnDefault: true })
  )
  const [tier, setTier] = useQueryState(
    'tier',
    parseAsStringEnum<'Partner' | 'Official'>(['Partner', 'Official']).withOptions({
      clearOnDefault: true,
    })
  )
  // View mode lives in localStorage rather than the URL so it survives sidebar
  // navigation (which replaces the URL with `?category=…`/`?type=…`). Grid is
  // the default per design.
  const [viewMode, setViewMode] = useLocalStorageQuery<ViewMode>(
    MARKETPLACE_VIEW_MODE_STORAGE_KEY,
    'grid'
  )

  const {
    data: availableIntegrations,
    error,
    isPending: isLoadingAvailable,
    isError,
    isSuccess: isSuccessAvailable,
  } = useAvailableIntegrations()

  const {
    installedIntegrations,
    isLoading: isLoadingInstalled,
    isSuccess: isSuccessInstalled,
  } = useInstalledIntegrations()

  const installedIds = installedIntegrations.map((i) => i.id)
  const isLoading = isLoadingAvailable || isLoadingInstalled
  const isSuccess = isSuccessAvailable && isSuccessInstalled

  const { data: marketplaceCategories = [] } = useQuery(marketplaceCategoriesQueryOptions())

  const categoryOptions = useMemo(
    () =>
      marketplaceCategories
        .filter((c): c is { slug: string; name: string } & typeof c => !!c.slug && !!c.name)
        .map((c) => ({ slug: c.slug, name: c.name })),
    [marketplaceCategories]
  )

  const hasActiveFilter = !!(category || type || tier)
  const hasSearchOrFilter = hasActiveFilter || search.length > 0

  const filtered = useMemo(() => {
    let result = availableIntegrations ?? []

    if (category) {
      result = result.filter((i) => i.categories?.includes(category))
    }
    if (type) {
      result = result.filter((i) => getMarketplaceType(i) === type)
    }
    if (tier) {
      result = result.filter((i) => getMarketplaceTier(i) === tier)
    }
    if (search.length > 0) {
      const needle = search.toLowerCase()
      result = result.filter((i) => i.name.toLowerCase().includes(needle))
    }

    return [...result].sort((a, b) => {
      const aInstalled = installedIds.includes(a.id)
      const bInstalled = installedIds.includes(b.id)
      if (aInstalled && !bInstalled) return -1
      if (!aInstalled && bInstalled) return 1
      return a.name.localeCompare(b.name)
    })
  }, [availableIntegrations, category, type, tier, search, installedIds])

  const featured = useMemo(() => {
    if (hasSearchOrFilter) return []
    const byId = new Map((availableIntegrations ?? []).map((i) => [i.id, i]))
    return FEATURED_INTEGRATION_IDS.map((id) => byId.get(id)).filter(
      (i): i is NonNullable<typeof i> => !!i
    )
  }, [availableIntegrations, hasSearchOrFilter])

  const clearAll = () => {
    setCategory(null)
    setType(null)
    setTier(null)
  }

  return (
    <>
      <PageHeader size="large" className="!pt-6">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Integrations</PageHeaderTitle>
            <PageHeaderDescription>
              Explore native and third-party integrations to add functionality, sync your data, and
              monitor your project.
            </PageHeaderDescription>
          </PageHeaderSummary>
          <div className="flex shrink-0 items-center gap-2">
            <DocsButton
              href={`${DOCS_URL}/guides/integrations/build-a-supabase-oauth-integration`}
            />
          </div>
        </PageHeaderMeta>
      </PageHeader>

      <PageContainer size="large" className="flex flex-col gap-7 py-6">
        {isLoading && (
          <div className="grid gap-4 xl:grid-cols-3 2xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, idx) => (
              <IntegrationLoadingCard key={`marketplace-loading-${idx}`} />
            ))}
          </div>
        )}

        {isError && (
          <AlertError subject="Failed to retrieve available integrations" error={error} />
        )}

        {isSuccess && (
          <>
            {!hasSearchOrFilter && featured.length > 0 && (
              <MarketplaceFeaturedRail integrations={featured} installedIds={installedIds} />
            )}

            {!hasSearchOrFilter && (
              <MarketplaceCategoryGrid
                categories={marketplaceCategories}
                integrations={availableIntegrations}
              />
            )}

            <MarketplaceFilterBar
              resultCount={filtered.length}
              search={search}
              onSearchChange={(v) => setSearch(v)}
              category={category}
              onCategoryChange={(v) => setCategory(v)}
              categoryOptions={categoryOptions}
              type={type}
              onTypeChange={(v) => setType(v)}
              tier={tier}
              onTierChange={(v) => setTier(v)}
              viewMode={viewMode}
              onViewModeChange={(v) => setViewMode(v)}
              hasActiveFilter={hasActiveFilter}
              onClearFilters={clearAll}
            />

            {search.length > 0 && filtered.length === 0 && (
              <NoSearchResults searchString={search} onResetFilter={() => setSearch('')} />
            )}

            {filtered.length > 0 &&
              (viewMode === 'grid' ? (
                <div className="grid grid-cols-2 gap-3 @4xl:grid-cols-3">
                  {filtered.map((integration) => (
                    <MarketplaceCard
                      key={integration.id}
                      integration={integration}
                      isInstalled={installedIds.includes(integration.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="overflow-hidden rounded-md border bg-surface-75">
                  <MarketplaceListHeader />
                  {filtered.map((integration) => (
                    <MarketplaceListRow
                      key={integration.id}
                      integration={integration}
                      isInstalled={installedIds.includes(integration.id)}
                    />
                  ))}
                </div>
              ))}
          </>
        )}
      </PageContainer>
    </>
  )
}
