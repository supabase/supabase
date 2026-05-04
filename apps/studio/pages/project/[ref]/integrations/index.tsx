import { useQuery } from '@tanstack/react-query'
import { IS_PLATFORM, useFeatureFlags, useFlag } from 'common'
import { Database } from 'common/marketplace.types'
import { Search } from 'lucide-react'
import { useRouter } from 'next/router'
import { parseAsString, useQueryState } from 'nuqs'
import { useMemo, type ReactNode } from 'react'
import { ShimmeringLoader } from 'ui-patterns'
import { Input } from 'ui-patterns/DataInputs/Input'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderAside,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { PageSection, PageSectionContent, PageSectionMeta } from 'ui-patterns/PageSection'

import {
  IntegrationCard,
  IntegrationLoadingCard,
} from '@/components/interfaces/Integrations/Landing/IntegrationCard'
import { IntegrationDefinition } from '@/components/interfaces/Integrations/Landing/Integrations.constants'
import { useAvailableIntegrations } from '@/components/interfaces/Integrations/Landing/useAvailableIntegrations'
import { useInstalledIntegrations } from '@/components/interfaces/Integrations/Landing/useInstalledIntegrations'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { ProjectIntegrationsLayout } from '@/components/layouts/ProjectIntegrationsLayout'
import { AlertError } from '@/components/ui/AlertError'
import { DocsButton } from '@/components/ui/DocsButton'
import { NoSearchResults } from '@/components/ui/NoSearchResults'
import { marketplaceCategoriesQueryOptions } from '@/data/marketplace/integration-categories-query'
import { BASE_PATH, DOCS_URL } from '@/lib/constants'
import type { NextPageWithLayout } from '@/types'

const FEATURED_INTEGRATIONS = ['cron', 'queues', 'stripe_sync_engine']

// Featured integration images
const FEATURED_INTEGRATION_IMAGES: Record<string, string> = {
  cron: `${BASE_PATH}/img/integrations/covers/cron-cover.webp`,
  queues: `${BASE_PATH}/img/integrations/covers/queues-cover.png`,
  stripe_wrapper: `${BASE_PATH}/img/integrations/covers/stripe-cover.png`,
  stripe_sync_engine: `${BASE_PATH}/img/integrations/covers/stripe-cover.png`,
}

function getIntegrationImage(integration: IntegrationDefinition) {
  let featured_image = FEATURED_INTEGRATION_IMAGES[integration.id]
  if (featured_image) {
    return featured_image
  }

  if (integration.files?.length) {
    const heroImage = integration?.files?.[0]
    return heroImage
  }
}

type PageContent = {
  title: string
  subtitle: string
  secondaryActions?: ReactNode
}

const DEFAULT_PAGE_CONTENT: PageContent = {
  title: 'Extend your database',
  subtitle:
    'Extensions and wrappers that add functionality to your database and connect to external services.',
}

const CATEGORY_PAGE_CONTENT = {
  wrapper: {
    title: 'Wrappers',
    subtitle:
      'Connect to external data sources and services by querying APIs, databases, and files as if they were Postgres tables.',
    secondaryActions: (
      <DocsButton href={`${DOCS_URL}/guides/database/extensions/wrappers/overview`} />
    ),
  },
  postgres_extension: {
    title: 'Postgres Modules',
    subtitle: 'Extend your database with powerful Postgres extensions.',
  },
} satisfies Record<string, PageContent>

// Converts a category string to title
// Example: some_catory -> Some Category
function formatCategoryTitle(category: string) {
  return category
    .split(/[-_]/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const PageHeaderContentSkeleton = () => (
  <div className="flex flex-col gap-y-2">
    <ShimmeringLoader className="h-8 w-48" />
    <ShimmeringLoader className="h-4 w-full max-w-xl" />
  </div>
)

// Returns selected category to filter by
function useFilterCategory() {
  const router = useRouter()
  const [selectedCategory] = useQueryState(
    'category',
    parseAsString.withDefault('all').withOptions({ clearOnDefault: true })
  )
  const categoryFromUrl = useMemo(() => {
    const queryString = router.asPath.split('?')[1]
    if (!queryString) return null

    return new URLSearchParams(queryString).get('category')
  }, [router.asPath])
  const resolvedSelectedCategory = router.isReady
    ? (categoryFromUrl ?? selectedCategory)
    : undefined
  const filterCategory = resolvedSelectedCategory ?? 'all'
  return filterCategory
}

// Dynamic page content based on selected category
function usePageContent(
  integrationFilterCategory: string,
  categories: Database['public']['Views']['categories']['Row'][]
) {
  const pageContent = useMemo<PageContent>(() => {
    if (integrationFilterCategory === 'all') {
      return DEFAULT_PAGE_CONTENT
    }

    if (integrationFilterCategory in CATEGORY_PAGE_CONTENT) {
      return CATEGORY_PAGE_CONTENT[integrationFilterCategory as keyof typeof CATEGORY_PAGE_CONTENT]
    }

    const selectedMarketplaceCategory = categories.find(
      (category) => category.slug === integrationFilterCategory
    )

    return {
      title: selectedMarketplaceCategory?.name ?? formatCategoryTitle(integrationFilterCategory),
      subtitle: selectedMarketplaceCategory?.description ?? DEFAULT_PAGE_CONTENT.subtitle,
    }
  }, [categories, integrationFilterCategory])
  return pageContent
}

// Filters all available integrations first by category,
// then by the search term and sorts them first by
// installation status and then alphabetically
function useFilteredAndSortedIntegrations(
  availableIntegrations: IntegrationDefinition[],
  selectedCategory: string,
  search: string,
  installedIds: string[]
) {
  const filteredAndSortedIntegrations = useMemo(() => {
    let filtered = availableIntegrations ?? []

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(
        (i) => i.type === selectedCategory || i.categories?.includes(selectedCategory)
      )
    }

    if (search.length > 0) {
      filtered = filtered.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
    }

    // Sort by installation status, then alphabetically
    return filtered.sort((a, b) => {
      const aIsInstalled = installedIds.includes(a.id)
      const bIsInstalled = installedIds.includes(b.id)

      if (aIsInstalled && !bIsInstalled) return -1
      if (!aIsInstalled && bIsInstalled) return 1

      return a.name.localeCompare(b.name)
    })
  }, [availableIntegrations, selectedCategory, search, installedIds])

  return filteredAndSortedIntegrations
}

// Returns featured integrations
function useFeaturedIntegratios(
  filteredAndSortedIntegrations: IntegrationDefinition[],
  selectedCategory: string,
  search: string
) {
  const groupedIntegrations = useMemo(() => {
    if (selectedCategory !== 'all' || search.length > 0) {
      return null
    }

    const featured = filteredAndSortedIntegrations.filter(
      (integration) => FEATURED_INTEGRATIONS.includes(integration.id) || integration.featured
    )

    return featured
  }, [filteredAndSortedIntegrations, selectedCategory, search])

  return groupedIntegrations
}

const IntegrationsPage: NextPageWithLayout = () => {
  const { hasLoaded: flagsLoaded } = useFeatureFlags()
  const isMarketplaceEnabled = useFlag('marketplaceIntegrations')
  const [search, setSearch] = useQueryState(
    'search',
    parseAsString.withDefault('').withOptions({ clearOnDefault: true })
  )

  const {
    data: availableIntegrations,
    error,
    isPending: isLoadingAvailableIntegrations,
    isError,
    isSuccess: isSuccessAvailableIntegrations,
  } = useAvailableIntegrations()

  const {
    installedIntegrations,
    isLoading: isLoadingInstalledIntegrations,
    isSuccess: isSuccessInstalledIntegrations,
  } = useInstalledIntegrations()

  const installedIds = installedIntegrations.map((i) => i.id)
  const isLoading = isLoadingAvailableIntegrations || isLoadingInstalledIntegrations
  const isSuccess = isSuccessAvailableIntegrations && isSuccessInstalledIntegrations

  const selectedCategory = useFilterCategory()

  const { data: categories = [], isPending: isPendingCategories } = useQuery(
    marketplaceCategoriesQueryOptions({ enabled: isMarketplaceEnabled })
  )

  const isLoadingSelectedCategory =
    selectedCategory !== 'all' &&
    !(selectedCategory in CATEGORY_PAGE_CONTENT) &&
    (IS_PLATFORM ? !flagsLoaded || (isMarketplaceEnabled && isPendingCategories) : false)

  const pageContent = usePageContent(selectedCategory, categories)

  const filteredAndSortedIntegrations = useFilteredAndSortedIntegrations(
    availableIntegrations,
    selectedCategory,
    search,
    installedIds
  )

  const featuredIntegrations = useFeaturedIntegratios(
    filteredAndSortedIntegrations,
    selectedCategory,
    search
  )

  return (
    <>
      <PageHeader size="large">
        <PageHeaderMeta>
          <PageHeaderSummary>
            {isLoadingSelectedCategory ? (
              <PageHeaderContentSkeleton />
            ) : (
              <>
                <PageHeaderTitle>{pageContent.title}</PageHeaderTitle>
                <PageHeaderDescription>{pageContent.subtitle}</PageHeaderDescription>
              </>
            )}
          </PageHeaderSummary>
          {pageContent.secondaryActions && (
            <PageHeaderAside>{pageContent.secondaryActions}</PageHeaderAside>
          )}
        </PageHeaderMeta>
      </PageHeader>

      <PageContainer size="large">
        <PageSection>
          <PageSectionMeta>
            <Input
              value={search}
              size="tiny"
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search integrations..."
              icon={<Search size={14} />}
              className="w-52"
            />
          </PageSectionMeta>

          <PageSectionContent>
            {isLoading && (
              <div
                className="grid xl:grid-cols-3 2xl:grid-cols-4 gap-x-4 gap-y-3"
                style={{ gridAutoRows: 'minmax(110px, auto)' }}
              >
                {Array.from({ length: 8 }).map((_, idx) => (
                  <IntegrationLoadingCard key={`integration-loading-${idx}`} />
                ))}
              </div>
            )}

            {/* Error State */}
            {isError && (
              <AlertError subject="Failed to retrieve available integrations" error={error} />
            )}

            {/* Success State */}
            {isSuccess && (
              <>
                {/* No Search Results */}
                {search.length > 0 && filteredAndSortedIntegrations.length === 0 && (
                  <NoSearchResults searchString={search} onResetFilter={() => setSearch('')} />
                )}

                {/* Featured Integrations */}
                {featuredIntegrations && featuredIntegrations.length > 0 && (
                  <div
                    className="grid grid-cols-2 @4xl:grid-cols-3 gap-4 mb-4 items-stretch pb-6 border-b"
                    style={{ gridAutoRows: 'minmax(110px, auto)' }}
                  >
                    {featuredIntegrations.map((integration) => (
                      <IntegrationCard
                        key={integration.id}
                        {...integration}
                        isInstalled={installedIds.includes(integration.id)}
                        featured={true}
                        image={getIntegrationImage(integration)}
                      />
                    ))}
                  </div>
                )}

                {/* All Filtered and Sorted Integrations */}
                {filteredAndSortedIntegrations.length > 0 && (
                  <div className="grid @xl:grid-cols-3 @6xl:grid-cols-4 gap-4">
                    {filteredAndSortedIntegrations.map((integration) => (
                      <IntegrationCard
                        key={integration.id}
                        {...integration}
                        isInstalled={installedIds.includes(integration.id)}
                        featured={false}
                        image={FEATURED_INTEGRATION_IMAGES[integration.id]}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </PageSectionContent>
        </PageSection>
      </PageContainer>
    </>
  )
}

IntegrationsPage.getLayout = (page) => (
  <DefaultLayout>
    <ProjectIntegrationsLayout>{page}</ProjectIntegrationsLayout>
  </DefaultLayout>
)

export default IntegrationsPage
