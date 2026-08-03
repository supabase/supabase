import { useParams } from 'common'
import dayjs from 'dayjs'
import { Check, ChevronDown, Database, ScrollText } from 'lucide-react'
import { useRouter } from 'next/router'
import { useState } from 'react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'ui'

import {
  datePickerValueToLogDateRange,
  type QuerySource,
  type SqlSnippetSource,
} from '../../querySource'
import { DatabaseSubMenu } from './DatabaseSubMenu'
import { LogsCustomRangeDialog } from './LogsCustomRangeDialog'
import { resolveSourceSwitch } from './QuerySourceMenu.utils'
import { RowLimitSubMenu } from './RowLimitSubMenu'
import { RunAsSubMenu } from './RunAsSubMenu'
import { TimeRangeSubMenu } from './TimeRangeSubMenu'
import { maybeShowUpgradePromptIfNotEntitled } from '@/components/interfaces/Settings/Logs/Logs.utils'
import UpgradePrompt from '@/components/interfaces/Settings/Logs/UpgradePrompt'
import { useCheckEntitlements } from '@/hooks/misc/useCheckEntitlements'
import { IS_PLATFORM } from '@/lib/constants'
import { useSqlEditorSessionSnapshot } from '@/state/sql-editor/sql-editor-session-state'
import { useSqlEditorV2StateSnapshot } from '@/state/sql-editor/sql-editor-state'

const SOURCE_LABEL: Record<SqlSnippetSource, string> = {
  database: 'Database',
  logs: 'Logs',
}

const SourceIcon = ({ source, ...props }: { source: SqlSnippetSource; className?: string }) =>
  source === 'logs' ? <ScrollText {...props} /> : <Database {...props} />

type QuerySourceMenuProps = {
  id: string
  runSource: QuerySource
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

  const [isCustomRangeOpen, setIsCustomRangeOpen] = useState(false)
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)

  const { getEntitlementNumericValue } = useCheckEntitlements('log.retention_days')
  const entitledToLogDays = getEntitlementNumericValue()

  const currentSource = runSource.type
  const isLogs = currentSource === 'logs'
  // A snippet materializes in the store on its first keystroke; until then a
  // `/sql/new` tab is a blank scaffold with nothing to preserve.
  const isBlankNewTab = snapV2.snippets[id] === undefined

  const switchSource = (target: SqlSnippetSource) => {
    const next = resolveSourceSwitch({ ref, target, currentSource, isBlankNewTab })
    if (next === null) return
    router[next.method](next.url)
  }

  const applyCustomRange = ({ from, to }: { from: Date; to: Date }) => {
    const fromIso = dayjs(from).startOf('day').toISOString()
    if (maybeShowUpgradePromptIfNotEntitled(fromIso, entitledToLogDays)) {
      setShowUpgradePrompt(true)
      return
    }
    sessionSnap.setLogRange(
      id,
      datePickerValueToLogDateRange({
        from: fromIso,
        to: dayjs(to).endOf('day').toISOString(),
        isHelper: false,
      })
    )
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="default"
            aria-label={`Query source: ${SOURCE_LABEL[currentSource]}`}
            icon={<SourceIcon source={currentSource} className="text-foreground-light" />}
            iconRight={<ChevronDown size={14} className="text-foreground-light" />}
          >
            {SOURCE_LABEL[currentSource]}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuItem className="justify-between" onClick={() => switchSource('database')}>
            <span className="flex items-center gap-x-2">
              <Database size={14} className="text-foreground-light" />
              Database
            </span>
            {!isLogs && <Check size={14} />}
          </DropdownMenuItem>
          {(canCreateLogsSnippet || isLogs) && (
            <DropdownMenuItem className="justify-between" onClick={() => switchSource('logs')}>
              <span className="flex items-center gap-x-2">
                <ScrollText size={14} className="text-foreground-light" />
                Logs
              </span>
              {isLogs && <Check size={14} />}
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {runSource.type === 'logs' ? (
            <TimeRangeSubMenu
              id={id}
              range={runSource.dateRange}
              onOpenCustomRange={() => setIsCustomRangeOpen(true)}
              onShowUpgrade={() => setShowUpgradePrompt(true)}
            />
          ) : (
            <>
              {IS_PLATFORM && <DatabaseSubMenu id={id} />}
              <RunAsSubMenu />
              <RowLimitSubMenu />
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {isLogs && (
        <>
          <LogsCustomRangeDialog
            open={isCustomRangeOpen}
            onOpenChange={setIsCustomRangeOpen}
            onApply={applyCustomRange}
          />
          <UpgradePrompt show={showUpgradePrompt} setShowUpgradePrompt={setShowUpgradePrompt} />
        </>
      )}
    </>
  )
}
