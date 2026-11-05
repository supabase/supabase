import { useQuery } from '@tanstack/react-query'
import { useDebounce } from '@uidotdev/usehooks'
import { DatabaseIcon, FunctionSquareIcon, ShieldIcon } from 'lucide-react'
import type { ICommand } from 'ui-patterns/CommandMenu'
import {
  useCommandMenuOpen,
  useQuery as useCommandMenuQuery,
  useCurrentPage,
  useRegisterCommands,
} from 'ui-patterns/CommandMenu'

import { COMMAND_MENU_SECTIONS } from './CommandMenu.utils'
import {
  ENTITY_SEARCH_DEBOUNCE_MS,
  formatFunctionSearchDetails,
  formatTableSearchDetails,
  getEntitySearchQuery,
  getFunctionEditorRoute,
  getPolicyEditorRoute,
  getTableEditorRoute,
  matchesEntitySearch,
  matchesPolicySearch,
} from './DatabaseEntitySearch.utils'
import { orderCommandSectionsByPriority } from './ordering'
import { entitySearchQueryOptions } from '@/data/database/entity-search-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

// Tables, policies and functions are ranked as one unit by the command menu's
// relevance sort, so a better-matching policy or function doesn't jump above
// the tables
const ENTITY_SEARCH_RELEVANCE_GROUP = 'database-entity-search'

/**
 * Searches the project's database entities by name as the user types in the
 * command menu, and registers matches as their own sections (tables,
 * policies, functions). Filtering happens in the database (see getSearchEntitiesSql), so
 * results are force-mounted to stop cmdk from filtering them a second time.
 */
export function useDatabaseEntitySearchCommands() {
  const { data: project } = useSelectedProjectQuery()
  const isOpen = useCommandMenuOpen()

  const isRootLevel = useCurrentPage() === undefined
  const commandMenuQuery = useCommandMenuQuery()
  const debouncedQuery = useDebounce(commandMenuQuery, ENTITY_SEARCH_DEBOUNCE_MS)
  const currentSearch = getEntitySearchQuery(commandMenuQuery)
  const debouncedSearch = getEntitySearchQuery(debouncedQuery)

  // [Joshen] Skip entity search while in a sub page as its not relevant
  const { data, isPlaceholderData } = useQuery(
    entitySearchQueryOptions(
      {
        projectRef: project?.ref,
        connectionString: project?.connectionString,
        query: debouncedSearch.query,
      },
      { enabled: isOpen && isRootLevel && debouncedSearch.isSearchable }
    )
  )

  // Results lag behind the input (debounce, request in flight, placeholder data
  // from the previous search). Until they catch up, only keep the ones that
  // still match what's typed, so e.g. `blog_posts` results never show for
  // `colors`, while refining `blog` to `blog_p` narrows smoothly.
  const canShowResults = isOpen && isRootLevel && currentSearch.isSearchable
  const isStale = isPlaceholderData || debouncedSearch.query !== currentSearch.query
  const getVisibleResults = <T,>(results: T[], matches: (result: T, query: string) => boolean) => {
    if (!canShowResults) return []
    return isStale ? results.filter((result) => matches(result, currentSearch.query)) : results
  }
  const tables = getVisibleResults(data?.tables ?? [], matchesEntitySearch)
  const policies = getVisibleResults(data?.policies ?? [], matchesPolicySearch)
  const functions = getVisibleResults(data?.functions ?? [], matchesEntitySearch)
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

  const policyCommands: ICommand[] = policies.map((policy) => {
    const tableName = `${policy.schema}.${policy.table}`
    return {
      id: `entity-search-policy-${policy.id}`,
      name: policy.name,
      value: `entity-search-policy-${policy.id} ${policy.name} ${tableName}`,
      forceMount: true,
      icon: () => <ShieldIcon />,
      badge: () => (
        <span className="text-xs text-foreground-lighter truncate pl-4 shrink-0">
          {policy.command} on {tableName}
        </span>
      ),
      route: getPolicyEditorRoute(projectRef, policy),
    }
  })

  const functionCommands: ICommand[] = functions.map((fn) => {
    const displayName = `${fn.schema}.${fn.name}`
    const details = formatFunctionSearchDetails(fn)
    return {
      id: `entity-search-function-${fn.id}`,
      name: displayName,
      value: `entity-search-function-${fn.id} ${displayName}`,
      forceMount: true,
      icon: () => <FunctionSquareIcon />,
      badge: details
        ? () => <span className="text-xs text-foreground-lighter truncate pl-4">{details}</span>
        : undefined,
      route: getFunctionEditorRoute(projectRef, fn),
    }
  })

  useRegisterCommands(COMMAND_MENU_SECTIONS.DATABASE_TABLES, tableCommands, {
    deps: [tables, projectRef],
    enabled: tableCommands.length > 0,
    forceMountSection: true,
    orderSection: orderCommandSectionsByPriority,
    sectionMeta: { priority: 2, relevanceGroup: ENTITY_SEARCH_RELEVANCE_GROUP },
  })

  useRegisterCommands(COMMAND_MENU_SECTIONS.DATABASE_POLICIES, policyCommands, {
    deps: [policies, projectRef],
    enabled: policyCommands.length > 0,
    forceMountSection: true,
    orderSection: orderCommandSectionsByPriority,
    // Ranked together with Tables, and listed after it
    sectionMeta: { priority: 3, relevanceGroup: ENTITY_SEARCH_RELEVANCE_GROUP },
  })

  useRegisterCommands(COMMAND_MENU_SECTIONS.DATABASE_FUNCTIONS, functionCommands, {
    deps: [functions, projectRef],
    enabled: functionCommands.length > 0,
    forceMountSection: true,
    orderSection: orderCommandSectionsByPriority,
    // Ranked together with Tables and Policies, and listed after both
    sectionMeta: { priority: 4, relevanceGroup: ENTITY_SEARCH_RELEVANCE_GROUP },
  })
}
