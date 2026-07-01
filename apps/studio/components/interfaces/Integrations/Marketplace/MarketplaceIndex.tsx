import { parseAsString, parseAsStringEnum, useQueryState } from 'nuqs'
import { useMemo, useRef } from 'react'
import { Button, Card, ShadowScrollArea, Table, TableBody, TableHeader } from 'ui'
import { EmptyStatePresentational } from 'ui-patterns/EmptyStatePresentational'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'

import {
  EXCLUDED_CATEGORY_SLUGS,
  FEATURED_INTEGRATION_IDS,
  formatCategoryLabel,
  getMarketplaceSource,
  getMarketplaceType,
  INTEGRATION_TYPES,
  MARKETPLACE_SOURCES,
  type MarketplaceIntegrationType,
  type MarketplaceSource,
} from './Marketplace.constants'
import { MarketplaceCard } from './MarketplaceCard'
import { MarketplaceFeaturedHeroGrid } from './MarketplaceFeaturedHeroGrid'
import { MarketplaceFilterBar, type ViewMode } from './MarketplaceFilterBar'
import { MarketplaceListHeader, MarketplaceListRow } from './MarketplaceListRow'
import { IntegrationLoadingCard } from '@/components/interfaces/Integrations/Landing/IntegrationCard'
import { useAvailableIntegrations } from '@/components/interfaces/Integrations/Landing/useAvailableIntegrations'
import { useInstalledIntegrations } from '@/components/interfaces/Integrations/Landing/useInstalledIntegrations'
import { useIntegrationFilteringAndSort } from '@/components/interfaces/Integrations/Landing/useIntegrationFilteringAndSort'
import { AlertError } from '@/components/ui/AlertError'
import { DocsButton } from '@/components/ui/DocsButton'
import { useMarketplaceCategoriesQuery } from '@/data/marketplace/integration-categories-query'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { DOCS_URL } from '@/lib/constants'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'

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

  const { data: marketplaceCategories = [] } = useMarketplaceCategoriesQuery()

  const categoryOptions = useMemo(() => {
    // Start with marketplace DB categories
    const fromDb = marketplaceCategories
      .filter(
        (c): c is { slug: string; name: string } & typeof c =>
          !!c.slug && !!c.name && !EXCLUDED_CATEGORY_SLUGS.has(c.slug)
      )
      .map((c) => ({ slug: c.slug, name: c.name }))

    // Extract unique categories from static integrations
    const staticCategories = new Set<string>()
    const all = availableIntegrations ?? []
    for (const integration of all) {
      if (integration.categories) {
        for (const cat of integration.categories) {
          staticCategories.add(cat)
        }
      }
    }

    // Create options for static categories (use slug as name if not in marketplace DB)
    const dbSlugs = new Set(fromDb.map((c) => c.slug))
    const fromStatic = Array.from(staticCategories)
      .filter((slug) => !dbSlugs.has(slug) && slug !== 'wrappers') // exclude 'wrappers' (it's a dedicated integration type)
      .map((slug) => ({
        slug,
        name: slug
          .split(/[-_]/)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' '),
      }))

    return [...fromDb, ...fromStatic]
  }, [marketplaceCategories, availableIntegrations])

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

  const filteredIntegrations = useMemo(() => {
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

    return result
  }, [availableIntegrations, category, type, source, search])

  const { sorted: filtered, featured } = useIntegrationFilteringAndSort(
    filteredIntegrations,
    availableIntegrations,
    installedIds,
    {
      featuredIds: FEATURED_INTEGRATION_IDS,
      hasActiveFilter: hasSearchOrFilter,
    }
  )

  const clearAll = () => {
    setCategory(null)
    setType(null)
    setSource(null)
    setSearch('')
  }

  const searchInputRef = useRef<HTMLInputElement>(null)

  useShortcut(
    SHORTCUT_IDS.LIST_PAGE_FOCUS_SEARCH,
    () => {
      searchInputRef.current?.focus()
      searchInputRef.current?.select()
    },
    { label: 'Search integrations' }
  )
  useShortcut(SHORTCUT_IDS.LIST_PAGE_RESET_FILTERS, clearAll)

  const activeFilters = [category, type, source].filter(Boolean)
  const pageTitle = useMemo(() => {
    if (activeFilters.length !== 1) return 'Extend your database'
    if (category) return `Integrations: ${formatCategoryLabel(category, categoryOptions)}`
    if (type)
      return `Integrations: ${INTEGRATION_TYPES.find((t) => t.key === type)?.label ?? type}s`
    if (source)
      return `Integrations: ${MARKETPLACE_SOURCES.find((s) => s.key === source)?.label ?? source}`
    return 'Integrations'
  }, [activeFilters.length, category, type, source, categoryOptions])

  return (
    <>
      <PageHeader size="large">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>{pageTitle}</PageHeaderTitle>
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
              <IntegrationLoadingCard key={`integrations-loading-${idx}`} />
            ))}
          </div>
        )}

        {isError && (
          <AlertError subject="Failed to retrieve available integrations" error={error} />
        )}

        {isSuccess && (
          <>
            {featured.length > 0 && (
              <MarketplaceFeaturedHeroGrid
                integrations={featured}
                installedIds={installedIds}
                primaryIntegrationId={featured[0].id}
                secondaryIntegrationIds={featured.slice(1, 3).map((i) => i.id)}
              />
            )}

            <MarketplaceFilterBar
              resultCount={filtered.length}
              search={search}
              searchInputRef={searchInputRef}
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
                <Button variant="default" onClick={clearAll}>
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
