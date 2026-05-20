import { useMemo } from 'react'

import type { IntegrationDefinition } from './Integrations.constants'

interface UseIntegrationFilteringAndSortOptions {
  featuredIds: readonly string[]
  hasActiveFilter: boolean
  // For legacy: include integrations with integration.featured flag in featured list
  includeFeaturedFlag?: boolean
}

/**
 * Common filtering and sorting logic for integrations.
 *
 * Handles:
 * - Sorting by installation status (installed first) then alphabetically
 * - Featured integrations logic (only shown when no filters active)
 *
 * The caller is responsible for the initial filtering (category, type, source, search).
 * This hook applies common post-filtering operations.
 */
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

    // Get featured from hardcoded IDs
    const result = options.featuredIds
      .map((id) => byId.get(id))
      .filter((i): i is IntegrationDefinition => !!i)

    // For legacy: also include integrations with featured flag
    if (options.includeFeaturedFlag) {
      const flaggedFeatured = availableIntegrations.filter(
        (i) => i.featured && !options.featuredIds.includes(i.id)
      )
      result.push(...flaggedFeatured)
    }

    return sortByInstalledThenName(result, installedIds)
  }, [
    availableIntegrations,
    installedIds,
    options.hasActiveFilter,
    options.featuredIds,
    options.includeFeaturedFlag,
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
