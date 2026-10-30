import { useQuery } from '@tanstack/react-query'
import { useDebounce } from '@uidotdev/usehooks'
import { DatabaseIcon } from 'lucide-react'
import type { ICommand } from 'ui-patterns/CommandMenu'
import {
  useCommandMenuOpen,
  useQuery as useCommandMenuQuery,
  useRegisterCommands,
} from 'ui-patterns/CommandMenu'

import { COMMAND_MENU_SECTIONS } from './CommandMenu.utils'
import {
  ENTITY_SEARCH_DEBOUNCE_MS,
  formatTableSearchDetails,
  getEntitySearchQuery,
  getTableEditorRoute,
  matchesEntitySearch,
} from './DatabaseEntitySearch.utils'
import { orderCommandSectionsByPriority } from './ordering'
import { entitySearchQueryOptions } from '@/data/database/entity-search-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

/**
 * Searches the project's database entities by name as the user types in the
 * command menu, and registers matches as their own section. Filtering happens
 * in the database (see getSearchEntitiesSql), so results are force-mounted to
 * stop cmdk from filtering them a second time.
 */
export function useDatabaseEntitySearchCommands() {
  const { data: project } = useSelectedProjectQuery()
  const isOpen = useCommandMenuOpen()
  const commandMenuQuery = useCommandMenuQuery()
  const debouncedQuery = useDebounce(commandMenuQuery, ENTITY_SEARCH_DEBOUNCE_MS)
  const currentSearch = getEntitySearchQuery(commandMenuQuery)
  const debouncedSearch = getEntitySearchQuery(debouncedQuery)

  const { data, isPlaceholderData } = useQuery(
    entitySearchQueryOptions(
      {
        projectRef: project?.ref,
        connectionString: project?.connectionString,
        query: debouncedSearch.query,
      },
      { enabled: isOpen && debouncedSearch.isSearchable }
    )
  )

  // Results lag behind the input (debounce, request in flight, placeholder data
  // from the previous search). Until they catch up, only keep the ones that
  // still match what's typed, so e.g. `blog_posts` results never show for
  // `colors`, while refining `blog` to `blog_p` narrows smoothly.
  const canShowResults = isOpen && currentSearch.isSearchable
  const isStale = isPlaceholderData || debouncedSearch.query !== currentSearch.query
  const results = data?.tables ?? []
  const visibleResults = isStale
    ? results.filter((table) => matchesEntitySearch(table, currentSearch.query))
    : results
  const tables = canShowResults ? visibleResults : []
  const projectRef = project?.ref ?? '_'

  const tableCommands: ICommand[] = tables.map((table) => {
    const displayName = `${table.schema}.${table.name}`
    return {
      id: `entity-search-table-${table.id}`,
      name: displayName,
      value: `entity-search-table-${table.id} ${displayName}`,
      forceMount: true,
      icon: () => <DatabaseIcon />,
      badge: () => (
        <span className="text-xs text-foreground-lighter truncate pl-4 shrink-0">
          {formatTableSearchDetails(table)}
        </span>
      ),
      route: getTableEditorRoute(projectRef, table),
    }
  })

  useRegisterCommands(COMMAND_MENU_SECTIONS.DATABASE_TABLES, tableCommands, {
    deps: [tables, projectRef],
    enabled: tableCommands.length > 0,
    forceMountSection: true,
    orderSection: orderCommandSectionsByPriority,
    sectionMeta: { priority: 2 },
  })
}
