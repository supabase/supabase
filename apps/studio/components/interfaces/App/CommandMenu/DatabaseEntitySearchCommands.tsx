import { useQuery } from '@tanstack/react-query'
import { useDebounce } from '@uidotdev/usehooks'
import { DatabaseIcon, FunctionSquareIcon, ShieldIcon, ZapIcon } from 'lucide-react'
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
  formatTriggerSearchDetails,
  getEntitySearchQuery,
  getFunctionEditorRoute,
  getPolicyEditorRoute,
  getTableEditorRoute,
  getTriggerEditorRoute,
  matchesEntitySearch,
  matchesTableRelatedSearch,
  matchesTriggerSearch,
} from './DatabaseEntitySearch.utils'
import { orderCommandSectionsByPriority } from './ordering'
import { entitySearchQueryOptions } from '@/data/database/entity-search-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

// Tables, policies, triggers and functions are ranked as one unit by the command
// menu's relevance sort, so a better-matching policy, trigger or function doesn't
// jump above the tables
const ENTITY_SEARCH_RELEVANCE_GROUP = 'database-entity-search'

/**
 * Searches the project's database entities by name as the user types in the
 * command menu, and registers matches as their own sections (tables,
 * policies, triggers, functions). Filtering happens in the database (see getSearchEntitiesSql), so
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
  const policies = getVisibleResults(data?.policies ?? [], matchesTableRelatedSearch)
  const triggers = getVisibleResults(data?.triggers ?? [], matchesTriggerSearch)
  // Triggers that are only here because of the function they run are a weaker match
  // than that function itself, so they list after the Functions section
  const hasDirectTriggerMatch = triggers.some((trigger) => trigger.matched_function === null)
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

  const triggerCommands: ICommand[] = triggers.map((trigger) => ({
    id: `entity-search-trigger-${trigger.id}`,
    name: trigger.name,
    value: `entity-search-trigger-${trigger.id} ${trigger.name} ${trigger.schema}.${trigger.table}`,
    forceMount: true,
    icon: () => <ZapIcon />,
    badge: () => (
      <span className="text-xs text-foreground-lighter truncate pl-4">
        {formatTriggerSearchDetails(trigger)}
      </span>
    ),
    route: getTriggerEditorRoute(projectRef, trigger),
  }))

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

  useRegisterCommands(COMMAND_MENU_SECTIONS.DATABASE_TRIGGERS, triggerCommands, {
    deps: [triggers, projectRef],
    enabled: triggerCommands.length > 0,
    forceMountSection: true,
    orderSection: orderCommandSectionsByPriority,
    // Ranked together with the others, and listed after Tables and Policies
    sectionMeta: {
      priority: hasDirectTriggerMatch ? 4 : 6,
      relevanceGroup: ENTITY_SEARCH_RELEVANCE_GROUP,
    },
  })

  useRegisterCommands(COMMAND_MENU_SECTIONS.DATABASE_FUNCTIONS, functionCommands, {
    deps: [functions, projectRef],
    enabled: functionCommands.length > 0,
    forceMountSection: true,
    orderSection: orderCommandSectionsByPriority,
    // Ranked together with the others, and listed last
    sectionMeta: { priority: 5, relevanceGroup: ENTITY_SEARCH_RELEVANCE_GROUP },
  })
}
