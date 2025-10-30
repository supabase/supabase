import { Search } from 'lucide-react'
import { parseAsString, useQueryState } from 'nuqs'
import { useMemo } from 'react'

import {
  IntegrationCard,
  IntegrationLoadingCard,
} from 'components/interfaces/Integrations/Landing/IntegrationCard'
import { useInstalledIntegrations } from 'components/interfaces/Integrations/Landing/useInstalledIntegrations'
import DefaultLayout from 'components/layouts/DefaultLayout'
import IntegrationsLayout from 'components/layouts/Integrations/layout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import { DocsButton } from 'components/ui/DocsButton'
import NoSearchResults from 'components/ui/NoSearchResults'
import { DOCS_URL } from 'lib/constants'
import type { NextPageWithLayout } from 'types'
import { Input } from 'ui-patterns/DataInputs/Input'

const FEATURED_INTEGRATIONS = ['cron', 'queues', 'stripe_wrapper']

// Featured integration images
const FEATURED_INTEGRATION_IMAGES: Record<string, string> = {
  cron: 'img/integrations/covers/cron-cover.webp',
  queues: 'img/integrations/covers/queues-cover.png',
  stripe_wrapper: 'img/integrations/covers/stripe-cover.png',
}

const IntegrationsPage: NextPageWithLayout = () => {
  const [selectedCategory] = useQueryState(
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
          secondaryActions: (
            <DocsButton href={`${DOCS_URL}/guides/database/extensions/wrappers/overview`} />
          ),
        }
      case 'postgres_extension':
        return {
          title: 'Postgres Modules',
          subtitle: 'Extend your database with powerful Postgres extensions.',
        }
      default:
        return {
          title: 'Extend your database',
          subtitle:
            'Extensions and wrappers that add functionality to your database and connect to external services.',
        }
    }
  }, [selectedCategory])

  const filteredAndSortedIntegrations = useMemo(() => {
    let filtered = availableIntegrations

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((i) => i.type === selectedCategory)
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

  const groupedIntegrations = useMemo(() => {
    if (selectedCategory !== 'all' || search.length > 0) {
      return null
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
      className="grid grid-cols-2 @4xl:grid-cols-3 gap-4 mb-4 items-stretch pb-6 mb-6 border-b"
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
    <div className="grid @xl:grid-cols-3 @6xl:grid-cols-4 gap-4">
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
    <PageLayout {...pageContent} size="large">
      <ScaffoldContainer size="large" className="container">
        <ScaffoldSection isFullWidth>
          <div className="flex-1 max-w-md mb-6">
            <Input
              value={search}
              size="tiny"
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search integrations..."
              icon={<Search size={14} />}
              className="w-52"
            />
          </div>

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
