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
  const { query, isSearchable } = getEntitySearchQuery(debouncedQuery)

  const { data } = useQuery(
    entitySearchQueryOptions(
      { projectRef: project?.ref, connectionString: project?.connectionString, query },
      { enabled: isOpen && isSearchable }
    )
  )

  // Placeholder data from a previous search sticks around while a query is
  // disabled, so only show results while the current input is searchable.
  const tables = isOpen && isSearchable ? (data?.tables ?? []) : []
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
