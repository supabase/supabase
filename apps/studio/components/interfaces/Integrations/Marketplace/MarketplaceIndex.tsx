import { useQuery } from '@tanstack/react-query'
import { parseAsString, parseAsStringEnum, useQueryState } from 'nuqs'
import { useMemo } from 'react'
import { Button, Card, ShadowScrollArea, Table, TableBody, TableHeader } from 'ui'
import {
  EmptyStatePresentational,
  PageContainer,
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns'

import {
  EXCLUDED_CATEGORY_SLUGS,
  FEATURED_INTEGRATION_IDS,
  getMarketplaceSource,
  getMarketplaceType,
  INTEGRATION_TYPES,
  MARKETPLACE_SOURCES,
  type MarketplaceIntegrationType,
  type MarketplaceSource,
} from './Marketplace.constants'
import { MarketplaceCard } from './MarketplaceCard'
import { MarketplaceFeaturedHero } from './MarketplaceFeaturedHero'
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
  const [source, setSource] = useQueryState(
    'source',
    parseAsStringEnum<MarketplaceSource>(['Official', 'Partner', 'Community']).withOptions({
      clearOnDefault: true,
    })
  )

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
        .filter(
          (c): c is { slug: string; name: string } & typeof c =>
            !!c.slug && !!c.name && !EXCLUDED_CATEGORY_SLUGS.has(c.slug)
        )
        .map((c) => ({ slug: c.slug, name: c.name })),
    [marketplaceCategories]
  )

  const typeCounts = useMemo(() => {
    const all = availableIntegrations ?? []
    return Object.fromEntries(
      INTEGRATION_TYPES.map(({ key }) => [
        key,
        all.filter((i) => getMarketplaceType(i) === key).length,
      ])
    ) as Record<MarketplaceIntegrationType, number>
  }, [availableIntegrations])

  const sourceCounts = useMemo(() => {
    const all = availableIntegrations ?? []
    return Object.fromEntries(
      MARKETPLACE_SOURCES.map(({ key }) => [
        key,
        all.filter((i) => getMarketplaceSource(i) === key).length,
      ])
    ) as Record<MarketplaceSource, number>
  }, [availableIntegrations])

  const categoryCounts = useMemo(() => {
    const all = availableIntegrations ?? []
    const counts: Record<string, number> = {}
    for (const { slug } of categoryOptions) {
      counts[slug] = all.filter((i) => i.categories?.includes(slug)).length
    }
    return counts
  }, [availableIntegrations, categoryOptions])

  const hasActiveFilter = !!(category || type || source)
  const hasSearchOrFilter = hasActiveFilter || search.length > 0

  const filtered = useMemo(() => {
    let result = availableIntegrations ?? []

    if (category) {
      result = result.filter((i) => i.categories?.includes(category))
    }
    if (type) {
      result = result.filter((i) => getMarketplaceType(i) === type)
    }
    if (source) {
      result = result.filter((i) => getMarketplaceSource(i) === source)
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
  }, [availableIntegrations, category, type, source, search, installedIds])

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
    setSource(null)
    setSearch('')
  }

  return (
    <>
      <PageHeader size="large">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Integrations Marketplace</PageHeaderTitle>
            <PageHeaderDescription>
              Explore native and third-party integrations to add functionality to your Supabase
              project.
            </PageHeaderDescription>
          </PageHeaderSummary>
          <div className="flex shrink-0 items-center gap-2">
            <DocsButton href={`${DOCS_URL}/guides/integrations/supabase-marketplace`} />
          </div>
        </PageHeaderMeta>
      </PageHeader>

      <PageContainer size="large" className="flex flex-col gap-4 py-6">
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
            {featured.length > 0 && (
              <MarketplaceFeaturedHero
                integrations={featured}
                installedIds={installedIds}
                categoryOptions={categoryOptions}
              />
            )}

            <MarketplaceFilterBar
              resultCount={filtered.length}
              search={search}
              onSearchChange={(v) => setSearch(v)}
              category={category}
              onCategoryChange={(v) => setCategory(v)}
              categoryOptions={categoryOptions}
              categoryCounts={categoryCounts}
              type={type}
              onTypeChange={(v) => setType(v)}
              typeCounts={typeCounts}
              source={source}
              onSourceChange={(v) => setSource(v)}
              sourceCounts={sourceCounts}
              viewMode={viewMode}
              onViewModeChange={(v) => setViewMode(v)}
              hasActiveFilter={hasActiveFilter}
              onClearFilters={clearAll}
            />

            {filtered.length === 0 && (
              <EmptyStatePresentational title="No results found">
                <Button type="default" onClick={clearAll}>
                  Clear filters
                </Button>
              </EmptyStatePresentational>
            )}

            {filtered.length > 0 &&
              (viewMode === 'grid' ? (
                <div className="grid @lg:grid-cols-2 gap-3 @4xl:grid-cols-3">
                  {filtered.map((integration) => (
                    <MarketplaceCard
                      key={integration.id}
                      integration={integration}
                      isInstalled={installedIds.includes(integration.id)}
                    />
                  ))}
                </div>
              ) : (
                <Card>
                  <ShadowScrollArea>
                    <Table>
                      <TableHeader>
                        <MarketplaceListHeader />
                      </TableHeader>
                      <TableBody>
                        {filtered.map((integration) => (
                          <MarketplaceListRow
                            key={integration.id}
                            integration={integration}
                            isInstalled={installedIds.includes(integration.id)}
                          />
                        ))}
                      </TableBody>
                    </Table>
                  </ShadowScrollArea>
                </Card>
              ))}
          </>
        )}
      </PageContainer>
    </>
  )
}
