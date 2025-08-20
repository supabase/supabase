import { Search } from 'lucide-react'
import { parseAsString, useQueryState } from 'nuqs'
import { useMemo } from 'react'

import DefaultLayout from 'components/layouts/DefaultLayout'
import IntegrationsLayout from 'components/layouts/Integrations/layout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import {
  ScaffoldContainer,
  ScaffoldSection,
  ScaffoldTitle,
  ScaffoldDescription,
} from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import NoSearchResults from 'components/ui/NoSearchResults'
import { Input, cn } from 'ui'
import {
  IntegrationCard,
  IntegrationLoadingCard,
} from 'components/interfaces/Integrations/Landing/IntegrationCard'
import { useInstalledIntegrations } from 'components/interfaces/Integrations/Landing/useInstalledIntegrations'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import type { NextPageWithLayout } from 'types'

type IntegrationCategory = 'all' | 'wrapper' | 'postgres_extension'

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'wrapper', label: 'Wrappers' },
  { key: 'postgres_extension', label: 'Postgres Modules' },
] as const

const FEATURED_INTEGRATIONS = ['cron', 'queues', 'stripe_wrapper']

// Featured integration images
const FEATURED_INTEGRATION_IMAGES: Record<string, string> = {
  cron: '/img/integrations/covers/cron-cover.webp',
  queues: '/img/integrations/covers/queues-cover.png',
  stripe_wrapper: '/img/integrations/covers/stripe-cover.png',
}

const IntegrationsPage: NextPageWithLayout = () => {
  const { data: project } = useSelectedProjectQuery()
  const [selectedCategory, setSelectedCategory] = useQueryState(
    'category',
    parseAsString.withDefault('all').withOptions({ clearOnDefault: true })
  )
  const [search, setSearch] = useQueryState(
    'search',
    parseAsString.withDefault('').withOptions({ clearOnDefault: true })
  )

  const { availableIntegrations, installedIntegrations, error, isError, isLoading, isSuccess } =
    useInstalledIntegrations()

  const installedIds = installedIntegrations.map((i) => i.id)

  // Dynamic page content based on selected category
  const pageContent = useMemo(() => {
    switch (selectedCategory) {
      case 'wrapper':
        return {
          title: 'Wrappers',
          subtitle:
            'Connect to external data sources and services by querying APIs, databases, and files as if they were Postgres tables.',
        }
      case 'postgres_extension':
        return {
          title: 'Postgres Modules',
          subtitle: 'Extend your database with powerful Postgres extensions.',
        }
      default:
        return {
          title: 'Extend Your Database',
          subtitle: 'Add powerful new capabilities to your database with a single click',
        }
    }
  }, [selectedCategory])

  const filteredAndSortedIntegrations = useMemo(() => {
    let filtered = availableIntegrations

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((i) => i.type === selectedCategory)
    }

    // Filter by search
    if (search.length > 0) {
      filtered = filtered.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
    }

    // Sort by installation status, then alphabetically
    return filtered.sort((a, b) => {
      const aIsInstalled = installedIds.includes(a.id)
      const bIsInstalled = installedIds.includes(b.id)

      // Installed first
      if (aIsInstalled && !bIsInstalled) return -1
      if (!aIsInstalled && bIsInstalled) return 1

      // Alphabetical order
      return a.name.localeCompare(b.name)
    })
  }, [availableIntegrations, selectedCategory, search, installedIds])

  // Group integrations by type when viewing all and not searching
  const groupedIntegrations = useMemo(() => {
    if (selectedCategory !== 'all' || search.length > 0) {
      return null // Don't group when filtering or searching
    }

    const featured = filteredAndSortedIntegrations.filter((i) =>
      FEATURED_INTEGRATIONS.includes(i.id)
    )
    const allIntegrations = filteredAndSortedIntegrations // Include all integrations, including featured

    return {
      featured,
      allIntegrations,
    }
  }, [filteredAndSortedIntegrations, selectedCategory, search])

  // Helper component to render featured integrations grid
  const FeaturedIntegrationsGrid = ({
    integrations,
  }: {
    integrations: typeof filteredAndSortedIntegrations
  }) => (
    <div
      className="grid grid-cols-2 @4xl:grid-cols-3 gap-4 mb-4 items-stretch"
      style={{ gridAutoRows: 'minmax(110px, auto)' }}
    >
      {integrations.map((integration) => (
        <IntegrationCard
          key={integration.id}
          {...integration}
          isInstalled={installedIds.includes(integration.id)}
          featured={true}
          image={FEATURED_INTEGRATION_IMAGES[integration.id]}
        />
      ))}
    </div>
  )

  // Helper component to render all integrations grid
  const AllIntegrationsGrid = ({
    integrations,
  }: {
    integrations: typeof filteredAndSortedIntegrations
  }) => (
    <div
      className="grid @xl:grid-cols-3 @6xl:grid-cols-4 gap-4"
      style={{ gridAutoRows: 'minmax(110px, auto)' }}
    >
      {integrations.map((integration) => (
        <IntegrationCard
          key={integration.id}
          {...integration}
          isInstalled={installedIds.includes(integration.id)}
          featured={false}
          image={FEATURED_INTEGRATION_IMAGES[integration.id]}
        />
      ))}
    </div>
  )

  return (
    <PageLayout title={pageContent.title} subtitle={pageContent.subtitle} size="large">
      <ScaffoldContainer size="large" className="container">
        <ScaffoldSection isFullWidth>
          {/* Search Controls */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center mb-6">
            <div className="flex-1 max-w-md">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search integrations..."
                icon={<Search size={14} />}
                className="w-full"
              />
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div
              className="grid xl:grid-cols-3 2xl:grid-cols-4 gap-x-4 gap-y-3"
              style={{ gridAutoRows: 'minmax(110px, auto)' }}
            >
              {new Array(8).fill(0).map((_, idx) => (
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

              {/* Grouped View (All integrations, no search) */}
              {groupedIntegrations && (
                <>
                  {/* Featured Integrations */}
                  {groupedIntegrations.featured.length > 0 && (
                    <FeaturedIntegrationsGrid integrations={groupedIntegrations.featured} />
                  )}

                  {/* All Integrations */}
                  {groupedIntegrations.allIntegrations.length > 0 && (
                    <AllIntegrationsGrid integrations={groupedIntegrations.allIntegrations} />
                  )}
                </>
              )}

              {/* Single List View (Category filtered or searching) */}
              {!groupedIntegrations && filteredAndSortedIntegrations.length > 0 && (
                <AllIntegrationsGrid integrations={filteredAndSortedIntegrations} />
              )}
            </>
          )}
        </ScaffoldSection>
      </ScaffoldContainer>
    </PageLayout>
  )
}

IntegrationsPage.getLayout = (page) => (
  <DefaultLayout>
    <IntegrationsLayout>{page}</IntegrationsLayout>
  </DefaultLayout>
)

export default IntegrationsPage
