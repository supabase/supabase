import { useMemo } from 'react'

import type { IntegrationDefinition } from './Integrations.constants'

interface UseIntegrationFilteringAndSortOptions {
  featuredIds: readonly string[]
  hasActiveFilter: boolean
  includeFeaturedFlag?: boolean
}

// Filters all available integrations first by category,
// then by the search term and sorts them first by
// installation status and then alphabetically
export const useIntegrationFilteringAndSort = (
  filteredIntegrations: readonly IntegrationDefinition[],
  availableIntegrations: readonly IntegrationDefinition[],
  installedIds: readonly string[],
  options: UseIntegrationFilteringAndSortOptions
) => {
  const sorted = useMemo(() => {
    return sortByInstalledThenName(filteredIntegrations, installedIds)
  }, [filteredIntegrations, installedIds])

  const featured = useMemo(() => {
    if (options.hasActiveFilter) return []

    const byId = new Map(availableIntegrations.map((i) => [i.id, i]))

    // Pinned IDs preserve their explicit order
    const pinnedResult = options.featuredIds
      .map((id) => byId.get(id))
      .filter((i): i is IntegrationDefinition => !!i)

    // For legacy: also include integrations with featured flag, sorted among themselves
    if (options.includeFeaturedFlag) {
      const flaggedFeatured = availableIntegrations.filter(
        (i) => i.featured && !options.featuredIds.includes(i.id)
      )
      pinnedResult.push(...sortByInstalledThenName(flaggedFeatured, installedIds))
    }

    return pinnedResult
  }, [
    availableIntegrations,
    options.hasActiveFilter,
    options.featuredIds,
    options.includeFeaturedFlag,
    installedIds,
  ])

  return { sorted, featured }
}

/**
 * Sort integrations by installation status (installed first) then alphabetically by name.
 */
export function sortByInstalledThenName(
  integrations: readonly IntegrationDefinition[],
  installedIds: readonly string[]
): IntegrationDefinition[] {
  return [...integrations].sort((a, b) => {
    const aIsInstalled = installedIds.includes(a.id)
    const bIsInstalled = installedIds.includes(b.id)

    if (aIsInstalled && !bIsInstalled) return -1
    if (!aIsInstalled && bIsInstalled) return 1

    return a.name.localeCompare(b.name)
  })
}
