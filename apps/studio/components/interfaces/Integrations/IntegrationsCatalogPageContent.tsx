'use client'

import {
  IntegrationCard,
  IntegrationLoadingCard,
} from 'components/interfaces/Integrations/Landing/IntegrationCard'
import { useInstalledIntegrations } from 'components/interfaces/Integrations/Landing/useInstalledIntegrations'
import { AlertError } from 'components/ui/AlertError'
import { DocsButton } from 'components/ui/DocsButton'
import { NoSearchResults } from 'components/ui/NoSearchResults'
import { DOCS_URL } from 'lib/constants'
import { Search } from 'lucide-react'
import { parseAsString, useQueryState } from 'nuqs'
import { useMemo } from 'react'
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

import { useAvailableIntegrations } from '@/components/interfaces/Integrations/Landing/useAvailableIntegrations'

const FEATURED_INTEGRATIONS = ['cron', 'queues', 'stripe_sync_engine']

const FEATURED_INTEGRATION_IMAGES: Record<string, string> = {
  cron: 'img/integrations/covers/cron-cover.webp',
  queues: 'img/integrations/covers/queues-cover.png',
  stripe_wrapper: 'img/integrations/covers/stripe-cover.png',
  stripe_sync_engine: 'img/integrations/covers/stripe-cover.png',
}

export function IntegrationsCatalogPageContent({
  hrefForIntegration,
  prioritizeAvailability = false,
}: {
  hrefForIntegration: (integrationId: string) => string
  /**
   * Avoid blocking the whole catalog on installed-integrations resolution.
   * Useful on v2 add page where one of the installed probes can be slow/hanging.
   */
  prioritizeAvailability?: boolean
}) {
  const [selectedCategory] = useQueryState(
    'category',
    parseAsString.withDefault('all').withOptions({ clearOnDefault: true })
  )
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
  const hasAvailableIntegrations = (availableIntegrations?.length ?? 0) > 0
  const effectiveIsLoadingAvailableIntegrations =
    isLoadingAvailableIntegrations && !hasAvailableIntegrations
  const effectiveIsSuccessAvailableIntegrations =
    isSuccessAvailableIntegrations || hasAvailableIntegrations

  const {
    installedIntegrations,
    isLoading: isLoadingInstalledIntegrations,
    isSuccess: isSuccessInstalledIntegrations,
  } = useInstalledIntegrations()
  const installedIds = isSuccessInstalledIntegrations ? installedIntegrations.map((i) => i.id) : []
  const isLoading = prioritizeAvailability
    ? effectiveIsLoadingAvailableIntegrations
    : effectiveIsLoadingAvailableIntegrations || isLoadingInstalledIntegrations
  const isSuccess = prioritizeAvailability
    ? effectiveIsSuccessAvailableIntegrations
    : effectiveIsSuccessAvailableIntegrations && isSuccessInstalledIntegrations

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
    let filtered = availableIntegrations ?? []

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(
        (i) => i.type === selectedCategory || i.categories?.includes(selectedCategory)
      )
    }

    if (search.length > 0) {
      filtered = filtered.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
    }

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
    const allIntegrations = filteredAndSortedIntegrations

    return { featured, allIntegrations }
  }, [filteredAndSortedIntegrations, selectedCategory, search])

  return (
    <>
      <PageHeader size="large">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>{pageContent.title}</PageHeaderTitle>
            <PageHeaderDescription>{pageContent.subtitle}</PageHeaderDescription>
          </PageHeaderSummary>
          {pageContent.secondaryActions && <PageHeaderAside>{pageContent.secondaryActions}</PageHeaderAside>}
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
                {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((key) => (
                  <IntegrationLoadingCard key={`integration-loading-${key}`} />
                ))}
              </div>
            )}

            {isError && <AlertError subject="Failed to retrieve available integrations" error={error} />}

            {isSuccess && (
              <>
                {search.length > 0 && filteredAndSortedIntegrations.length === 0 && (
                  <NoSearchResults searchString={search} onResetFilter={() => setSearch('')} />
                )}

                {groupedIntegrations && (
                  <>
                    {groupedIntegrations.featured.length > 0 && (
                      <div
                        className="grid grid-cols-2 @4xl:grid-cols-3 gap-4 items-stretch pb-6 mb-6 border-b"
                        style={{ gridAutoRows: 'minmax(110px, auto)' }}
                      >
                        {groupedIntegrations.featured.map((integration) => (
                          <IntegrationCard
                            key={integration.id}
                            {...integration}
                            href={hrefForIntegration(integration.id)}
                            isInstalled={installedIds.includes(integration.id)}
                            featured
                            image={FEATURED_INTEGRATION_IMAGES[integration.id]}
                          />
                        ))}
                      </div>
                    )}

                    {groupedIntegrations.allIntegrations.length > 0 && (
                      <div className="grid @xl:grid-cols-3 @6xl:grid-cols-4 gap-4">
                        {groupedIntegrations.allIntegrations.map((integration) => (
                          <IntegrationCard
                            key={integration.id}
                            {...integration}
                            href={hrefForIntegration(integration.id)}
                            isInstalled={installedIds.includes(integration.id)}
                            featured={false}
                            image={FEATURED_INTEGRATION_IMAGES[integration.id]}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}

                {!groupedIntegrations && filteredAndSortedIntegrations.length > 0 && (
                  <div className="grid @xl:grid-cols-3 @6xl:grid-cols-4 gap-4">
                    {filteredAndSortedIntegrations.map((integration) => (
                      <IntegrationCard
                        key={integration.id}
                        {...integration}
                        href={hrefForIntegration(integration.id)}
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
