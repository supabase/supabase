'use client'

import { useDebounce } from '@uidotdev/usehooks'
import { useParams } from 'common'
import { Auth } from 'icons'
import { escapeRegExp } from 'lodash'
import { Database, FunctionSquare, Zap } from 'lucide-react'
import { useMemo, type ReactNode } from 'react'
import type { ICommand } from 'ui-patterns/CommandMenu'
import { useQuery, useRegisterCommands } from 'ui-patterns/CommandMenu'

import { COMMAND_MENU_SECTIONS } from './CommandMenu.utils'
import { useActiveSectionId } from './CommandMenuFilterBar.state'
import { useDatabaseFunctionsQuery } from '@/data/database-functions/database-functions-query'
import { useDatabasePoliciesQuery } from '@/data/database-policies/database-policies-query'
import { useDatabaseTriggersQuery } from '@/data/database-triggers/database-triggers-query'
import { useTablesQuery } from '@/data/tables/tables-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

// POC: min characters before we fetch/match against DB objects, and caps on
// how many results to register per section so the palette doesn't get
// swamped on a project with many objects. The cap lifts once the user has
// drilled into a single section via the filter bar (see CommandMenuFilterBar).
const MIN_QUERY_LENGTH = 2
const DEFAULT_LIMIT = 5
const FOCUSED_LIMIT = 25

// Section ids are derived by ui-patterns from COMMAND_MENU_SECTIONS labels
// (lowercased, spaces -> hyphens). Ours are single words, so these are fixed.
const SECTION_IDS = {
  tables: 'tables',
  policies: 'policies',
  functions: 'functions',
  triggers: 'triggers',
} as const

function matchText(...values: Array<string | null | undefined>) {
  return values.filter(Boolean).join('|').toLowerCase()
}

// Heuristic only: looks for mentions of known table names in a function's
// source text. Not a real dependency scan (no AST/catalog dependency walk).
function getReferencedTables(
  definition: string,
  tables: Array<{ schema: string; name: string }>
) {
  const found: string[] = []
  for (const t of tables) {
    if (t.name.length < 3) continue
    const pattern = new RegExp(`\\b${escapeRegExp(t.name)}\\b`, 'i')
    if (pattern.test(definition)) found.push(`${t.schema}.${t.name}`)
    if (found.length >= 3) break
  }
  return found
}

function MetaBadge({ children }: { children: ReactNode }) {
  return (
    <span className="text-xs text-foreground-lighter truncate max-w-[16rem] pl-4">
      {children}
    </span>
  )
}

/**
 * Makes the Cmd+K palette resource-aware: as the user types, live-matches
 * against the project's actual tables/policies/functions/triggers (not just
 * static nav entries) and shows them grouped by type. CommandMenuFilterBar
 * (generic, reads all registered sections) lets the user narrow down to one
 * of these sections specifically.
 */
export function useDatabaseResourceCommands() {
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const activeSectionId = useActiveSectionId()

  const query = useQuery()
  const debouncedQuery = useDebounce(query, 200)
  const trimmedQuery = debouncedQuery.trim().toLowerCase()
  const isSearching = trimmedQuery.length >= MIN_QUERY_LENGTH

  const queryEnabled = isSearching && !!project?.ref

  const { data: tables } = useTablesQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      includeColumns: true,
    },
    { enabled: queryEnabled }
  )
  const { data: policies } = useDatabasePoliciesQuery(
    { projectRef: project?.ref, connectionString: project?.connectionString },
    { enabled: queryEnabled }
  )
  const { data: functions } = useDatabaseFunctionsQuery(
    { projectRef: project?.ref, connectionString: project?.connectionString },
    { enabled: queryEnabled }
  )
  const { data: triggers } = useDatabaseTriggersQuery(
    { projectRef: project?.ref, connectionString: project?.connectionString },
    { enabled: queryEnabled }
  )

  const tableMatches = useMemo(() => {
    if (!isSearching || !tables) return []
    return tables.filter((t) => matchText(t.name, t.schema).includes(trimmedQuery))
  }, [isSearching, tables, trimmedQuery])

  const policyMatches = useMemo(() => {
    if (!isSearching || !policies) return []
    return policies.filter((p) =>
      matchText(p.name, p.table, p.schema, p.command).includes(trimmedQuery)
    )
  }, [isSearching, policies, trimmedQuery])

  const functionMatches = useMemo(() => {
    if (!isSearching || !functions) return []
    return functions.filter((f) => matchText(f.name, f.schema).includes(trimmedQuery))
  }, [isSearching, functions, trimmedQuery])

  const triggerMatches = useMemo(() => {
    if (!isSearching || !triggers) return []
    return triggers.filter((t) => matchText(t.name, t.table, t.schema).includes(trimmedQuery))
  }, [isSearching, triggers, trimmedQuery])

  const limit = activeSectionId === null ? DEFAULT_LIMIT : FOCUSED_LIMIT
  const showTables = activeSectionId === null || activeSectionId === SECTION_IDS.tables
  const showPolicies = activeSectionId === null || activeSectionId === SECTION_IDS.policies
  const showFunctions = activeSectionId === null || activeSectionId === SECTION_IDS.functions
  const showTriggers = activeSectionId === null || activeSectionId === SECTION_IDS.triggers

  const tableCommands = useMemo<ICommand[]>(() => {
    if (!showTables) return []
    return tableMatches.slice(0, limit).map((t) => {
      const displayName = `${t.schema}.${t.name}`
      const columnCount = t.columns?.length ?? 0
      const policyCount =
        policies?.filter((p) => p.schema === t.schema && p.table === t.name).length ?? 0

      return {
        id: `resource-table-${t.id}`,
        name: displayName,
        value: displayName,
        icon: () => <Database className="h-4 w-4" strokeWidth={1.5} />,
        badge: () => (
          <MetaBadge>
            {columnCount} column{columnCount !== 1 ? 's' : ''} • {policyCount} polic
            {policyCount !== 1 ? 'ies' : 'y'} • RLS {t.rls_enabled ? 'enabled' : 'disabled'}
          </MetaBadge>
        ),
        route: `/project/${projectRef}/editor/${t.id}?schema=${t.schema}` as `/${string}`,
      }
    })
  }, [showTables, tableMatches, limit, policies, projectRef])

  const policyCommands = useMemo<ICommand[]>(() => {
    if (!showPolicies) return []
    return policyMatches.slice(0, limit).map((p) => ({
      id: `resource-policy-${p.id}`,
      name: p.name || 'Untitled policy',
      value: `${p.name ?? ''} ${p.schema}.${p.table}`,
      icon: () => <Auth className="h-4 w-4" strokeWidth={1.5} />,
      badge: () => (
        <MetaBadge>
          {p.command} • Applies to {p.roles.length ? p.roles.join(', ') : 'public'}
        </MetaBadge>
      ),
      route: `/project/${projectRef}/database/policies?schema=${p.schema}&edit=${p.id}` as `/${string}`,
    }))
  }, [showPolicies, policyMatches, limit, projectRef])

  const functionCommands = useMemo<ICommand[]>(() => {
    if (!showFunctions) return []
    return functionMatches.slice(0, limit).map((f) => {
      const displayName = `${f.schema}.${f.name}`
      const references = getReferencedTables(f.definition, tables ?? [])

      return {
        id: `resource-function-${f.id}`,
        name: displayName,
        value: displayName,
        icon: () => <FunctionSquare className="h-4 w-4" strokeWidth={1.5} />,
        badge: references.length
          ? () => <MetaBadge>References: {references.join(', ')}</MetaBadge>
          : undefined,
        route: `/project/${projectRef}/database/functions?edit=${f.id}` as `/${string}`,
      }
    })
  }, [showFunctions, functionMatches, limit, tables, projectRef])

  const triggerCommands = useMemo<ICommand[]>(() => {
    if (!showTriggers) return []
    return triggerMatches.slice(0, limit).map((t) => ({
      id: `resource-trigger-${t.id}`,
      name: t.name,
      value: `${t.name} ${t.schema}.${t.table}`,
      icon: () => <Zap className="h-4 w-4" strokeWidth={1.5} />,
      badge: () => (
        <MetaBadge>
          {t.activation} {t.events.join('/')} • {t.schema}.{t.table}
        </MetaBadge>
      ),
      route: `/project/${projectRef}/database/triggers?edit=${t.id}` as `/${string}`,
    }))
  }, [showTriggers, triggerMatches, limit, projectRef])

  useRegisterCommands(COMMAND_MENU_SECTIONS.RESOURCE_TABLES, tableCommands, {
    deps: [tableCommands],
    enabled: tableCommands.length > 0,
  })
  useRegisterCommands(COMMAND_MENU_SECTIONS.RESOURCE_POLICIES, policyCommands, {
    deps: [policyCommands],
    enabled: policyCommands.length > 0,
  })
  useRegisterCommands(COMMAND_MENU_SECTIONS.RESOURCE_FUNCTIONS, functionCommands, {
    deps: [functionCommands],
    enabled: functionCommands.length > 0,
  })
  useRegisterCommands(COMMAND_MENU_SECTIONS.RESOURCE_TRIGGERS, triggerCommands, {
    deps: [triggerCommands],
    enabled: triggerCommands.length > 0,
  })
}
