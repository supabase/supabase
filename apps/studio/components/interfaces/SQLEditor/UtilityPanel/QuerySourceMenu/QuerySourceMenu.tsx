import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { Check, ChevronDown } from 'lucide-react'
import { useRouter } from 'next/router'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'ui'

import { type SqlSnippetSource } from '../../querySource'
import { resolveSourceSwitch } from './QuerySourceMenu.utils'
import { RowLimitSubMenu } from './RowLimitSubMenu'
import { RunAsSubMenu } from './RunAsSubMenu'
import { DatabaseParametersSubMenu } from '@/components/interfaces/QuerySources/DatabaseParametersSubMenu'
import { LogsCustomRangeDialog } from '@/components/interfaces/QuerySources/LogsCustomRangeDialog'
import { LogsTimeRangeSubMenu } from '@/components/interfaces/QuerySources/LogsTimeRangeSubMenu'
import { QuerySourceIcon } from '@/components/interfaces/QuerySources/QuerySourceIcon'
import { useLogsCustomRange } from '@/components/interfaces/QuerySources/useLogsCustomRange'
import UpgradePrompt from '@/components/interfaces/Settings/Logs/UpgradePrompt'
import {
  QUERY_SOURCE_LABELS,
  QUERY_SOURCES,
  type QuerySourceBinding,
} from '@/data/query-sources/query-source-registry'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { IS_PLATFORM } from '@/lib/constants'
import { useDatabaseSelectorStateSnapshot } from '@/state/database-selector'
import { useSqlEditorSessionSnapshot } from '@/state/sql-editor/sql-editor-session-state'
import { useSqlEditorV2StateSnapshot } from '@/state/sql-editor/sql-editor-state'

type QuerySourceMenuProps = {
  id: string
  runSource: QuerySourceBinding
  /** Whether creating a logs snippet is available (feature-flagged). */
  canCreateLogsSnippet: boolean
}

/**
 * The consolidated SQL-editor source control: a single toolbar dropdown that
 * both labels the snippet's source (Database / Logs) and hosts every
 * source-specific control as a flyout submenu — database selector + role
 * impersonation + row limit for a database snippet, time range for a logs
 * snippet. The logs "Custom range…" calendar and the retention upgrade prompt are
 * rendered as siblings of the dropdown (not inside it) so they survive the menu
 * closing.
 *
 * A snippet's source is immutable, so the source rows aren't a plain toggle.
 * Once a snippet exists — a saved query, or a new one the user has already typed
 * into — switching backends opens a *fresh* tab with a new snippet of that
 * source, leaving the existing query untouched (there's no sense running a query
 * against the wrong backend). Only a brand-new, not-yet-materialized blank tab
 * re-flavors in place, so we don't spawn a redundant snippet before the user has
 * written anything.
 */
export const QuerySourceMenu = ({ id, runSource, canCreateLogsSnippet }: QuerySourceMenuProps) => {
  const { ref } = useParams()
  const router = useRouter()
  const snapV2 = useSqlEditorV2StateSnapshot()
  const sessionSnap = useSqlEditorSessionSnapshot()
  const databaseSelector = useDatabaseSelectorStateSnapshot()
  const [lastSelectedDatabase, setLastSelectedDatabase] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.SQL_EDITOR_LAST_SELECTED_DB(ref ?? ''),
    ''
  )

  const {
    isCustomRangeOpen,
    setIsCustomRangeOpen,
    showUpgradePrompt,
    setShowUpgradePrompt,
    handleApplyCustomRange,
  } = useLogsCustomRange({ onRangeChange: (range) => sessionSnap.setLogRange(id, range) })

  const currentSource = runSource._tag
  const isLogs = currentSource === 'logs'
  // A snippet materializes in the store on its first keystroke; until then a
  // `/sql/new` tab is a blank scaffold with nothing to preserve.
  const isBlankNewTab = snapV2.snippets[id] === undefined
  const databaseIdentifier =
    lastSelectedDatabase.length > 0
      ? lastSelectedDatabase
      : (databaseSelector.selectedDatabaseId ?? ref)

  const selectableSources = QUERY_SOURCES.filter(
    (source) => source._tag !== 'logs' || canCreateLogsSnippet || isLogs
  )

  const switchSource = (target: SqlSnippetSource) => {
    const next = resolveSourceSwitch({ ref, target, currentSource, isBlankNewTab })
    if (next === null) return
    router[next.method](next.url)
  }

  const updateDatabaseIdentifier = (identifier: string) => {
    databaseSelector.setSelectedDatabaseId(identifier)
    setLastSelectedDatabase(identifier)
    sessionSnap.resetResult(id)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="default"
            aria-label={`Query source: ${QUERY_SOURCE_LABELS[currentSource]}`}
            icon={<QuerySourceIcon source={currentSource} className="text-foreground-light" />}
            iconRight={<ChevronDown size={14} className="text-foreground-light" />}
          >
            {QUERY_SOURCE_LABELS[currentSource]}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          {selectableSources.map((source) => (
            <DropdownMenuItem
              key={source._tag}
              className="justify-between"
              onSelect={(e) => {
                e.preventDefault()
                switchSource(source._tag)
              }}
            >
              <span className="flex items-center gap-x-2">
                <QuerySourceIcon source={source._tag} className="text-foreground-light" />
                {QUERY_SOURCE_LABELS[source._tag]}
              </span>
              {currentSource === source._tag && <Check size={14} />}
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />

          {runSource._tag === 'logs' ? (
            <LogsTimeRangeSubMenu
              range={runSource.time_range}
              onRangeChange={(range) => sessionSnap.setLogRange(id, range)}
              onOpenCustomRange={() => setIsCustomRangeOpen(true)}
              onShowUpgrade={() => setShowUpgradePrompt(true)}
            />
          ) : (
            <>
              {IS_PLATFORM && (
                <DatabaseParametersSubMenu
                  identifier={databaseIdentifier}
                  onIdentifierChange={updateDatabaseIdentifier}
                />
              )}
              <RunAsSubMenu />
              <RowLimitSubMenu
                value={sessionSnap.limit}
                onValueChange={(val) => sessionSnap.setLimit(Number(val))}
              />
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {isLogs && (
        <>
          <LogsCustomRangeDialog
            open={isCustomRangeOpen}
            onOpenChange={setIsCustomRangeOpen}
            onApply={handleApplyCustomRange}
          />
          <UpgradePrompt show={showUpgradePrompt} setShowUpgradePrompt={setShowUpgradePrompt} />
        </>
      )}
    </>
  )
}
