import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import dayjs from 'dayjs'
import { Check, ChevronDown, Database, Plus, ScrollText } from 'lucide-react'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import {
  Button,
  cn,
  Dialog,
  DialogContent,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from 'ui'

import { RoleImpersonationSelector } from '@/components/interfaces/RoleImpersonationSelector'
import { EXPLORER_DATEPICKER_HELPERS } from '@/components/interfaces/Settings/Logs/Logs.constants'
import {
  LogsDatePicker,
  type DatePickerValue,
} from '@/components/interfaces/Settings/Logs/Logs.DatePickers'
import {
  DatabaseSelectorMenu,
  useDatabaseSelectorLabel,
} from '@/components/ui/DatabaseSelectorMenu'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { IS_PLATFORM } from '@/lib/constants'
import {
  useQueryExecutionSourceSnapshot,
  type QueryExecutionSource,
} from '@/state/query-execution-source'
import { useRoleImpersonationStateSnapshot } from '@/state/role-impersonation-state'
import { useSqlEditorV2StateSnapshot } from '@/state/sql-editor-v2'

interface QuerySourceSelectorProps {
  selectedDatabaseId?: string
  selectedSource?: QueryExecutionSource
  selectedLogsDatePickerValue?: DatePickerValue
  onSelectDatabase?: (id: string) => void
  onSourceChange?: (source: QueryExecutionSource) => void
  onLogsDatePickerValueChange?: (value: DatePickerValue) => void
  className?: string
}

export const QuerySourceSelector = ({
  selectedDatabaseId,
  selectedSource,
  selectedLogsDatePickerValue,
  onSelectDatabase,
  onSourceChange,
  onLogsDatePickerValueChange,
  className,
}: QuerySourceSelectorProps) => {
  const router = useRouter()
  const { ref: projectRef, id: snippetId } = useParams()
  const querySourceState = useQueryExecutionSourceSnapshot()
  const roleState = useRoleImpersonationStateSnapshot()
  const snapV2 = useSqlEditorV2StateSnapshot()
  const [menuOpen, setMenuOpen] = useState(false)
  const [customRangeDialogOpen, setCustomRangeDialogOpen] = useState(false)

  const [lastExecutionSource, setLastExecutionSource] = useLocalStorageQuery<QueryExecutionSource>(
    LOCAL_STORAGE_KEYS.SQL_EDITOR_LAST_EXECUTION_SOURCE(projectRef as string),
    'database'
  )

  const [useOtelEndpoint] = useLocalStorageQuery<boolean>(
    LOCAL_STORAGE_KEYS.SQL_EDITOR_LOGS_USE_OTEL(projectRef as string),
    false
  )

  useEffect(() => {
    if (selectedSource === undefined && snippetId === 'new' && lastExecutionSource) {
      querySourceState.setExecutionSource(lastExecutionSource)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastExecutionSource, selectedSource, snippetId])

  useEffect(() => {
    querySourceState.setUseOtelEndpoint(useOtelEndpoint)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useOtelEndpoint])

  const handleSourceChange = (source: QueryExecutionSource) => {
    if (selectedSource === undefined) {
      querySourceState.setExecutionSource(source)
      setLastExecutionSource(source)
    }
    onSourceChange?.(source)

    if (
      selectedSource === undefined &&
      snippetId &&
      snippetId !== 'new' &&
      snapV2.snippets[snippetId]
    ) {
      snapV2.updateSnippet({
        id: snippetId,
        snippet: { type: source === 'logs' ? 'log_sql' : 'sql' },
      })
    }
  }

  const handleDateChange = (value: DatePickerValue) => {
    if (selectedLogsDatePickerValue === undefined) {
      querySourceState.setLogsDatePickerValue(value)
    }
    onLogsDatePickerValueChange?.(value)
    setCustomRangeDialogOpen(false)
    setMenuOpen(false)
  }

  const executionSource = selectedSource ?? querySourceState.executionSource
  const logsDatePickerValue = selectedLogsDatePickerValue ?? querySourceState.logsDatePickerValue
  const primaryDatabaseLabel = useDatabaseSelectorLabel(selectedDatabaseId)
  const currentRole = roleState.role?.role ?? 'postgres'

  const logsTimeRangeLabel = logsDatePickerValue.isHelper
    ? logsDatePickerValue.text
    : `${dayjs(logsDatePickerValue.from).format('DD MMM, HH:mm')} - ${dayjs(logsDatePickerValue.to || new Date()).format('DD MMM, HH:mm')}`

  const TriggerIcon = executionSource === 'database' ? Database : ScrollText
  const triggerLabel = executionSource === 'database' ? 'Database' : 'Logs'

  if (!IS_PLATFORM) {
    return null
  }

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            type="default"
            icon={<TriggerIcon size={12} />}
            iconRight={<ChevronDown strokeWidth={1.5} size={12} />}
            className={cn('justify-start rounded-r-none border-r-0', className)}
          >
            {triggerLabel}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem
            className="justify-between"
            onClick={() => handleSourceChange('database')}
          >
            <span className="flex items-center gap-x-2">
              <Database size={14} />
              Database
            </span>
            {executionSource === 'database' && <Check size={14} />}
          </DropdownMenuItem>
          <DropdownMenuItem className="justify-between" onClick={() => handleSourceChange('logs')}>
            <span className="flex items-center gap-x-2">
              <ScrollText size={14} />
              Logs
            </span>
            {executionSource === 'logs' && <Check size={14} />}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {executionSource === 'database' ? (
            <>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <div className="flex min-w-0 flex-1 flex-col items-start">
                    <span>Primary</span>
                    <span className="truncate text-xs text-foreground-lighter">
                      {primaryDatabaseLabel}
                    </span>
                  </div>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className="max-h-[280px] overflow-y-auto">
                    <DatabaseSelectorMenu
                      selectedDatabaseId={selectedDatabaseId}
                      asDropdownItems
                      onSelectId={onSelectDatabase}
                      onAfterSelect={() => setMenuOpen(false)}
                    />
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>

              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <div className="flex min-w-0 flex-1 flex-col items-start">
                    <span>Run as</span>
                    <span className="truncate text-xs text-foreground-lighter capitalize">
                      {currentRole}
                    </span>
                  </div>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className="w-80 p-0">
                    <RoleImpersonationSelector
                      header="Run SQL query as a role"
                      serviceRoleLabel="postgres"
                      orientation="vertical"
                    />
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            </>
          ) : (
            <>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <div className="flex min-w-0 flex-1 flex-col items-start">
                    <span>Time range</span>
                    <span className="truncate text-xs text-foreground-lighter">
                      {logsTimeRangeLabel}
                    </span>
                  </div>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className="w-56">
                    {EXPLORER_DATEPICKER_HELPERS.map((helper) => (
                      <DropdownMenuItem
                        key={helper.text}
                        className="justify-between"
                        disabled={helper.disabled}
                        onClick={() =>
                          handleDateChange({
                            to: helper.calcTo(),
                            from: helper.calcFrom(),
                            isHelper: true,
                            text: helper.text,
                          })
                        }
                      >
                        <span>{helper.text}</span>
                        {logsDatePickerValue.isHelper &&
                          logsDatePickerValue.text === helper.text && <Check size={14} />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>

              <DropdownMenuItem
                onClick={() => {
                  setMenuOpen(false)
                  setCustomRangeDialogOpen(true)
                }}
              >
                Custom range...
              </DropdownMenuItem>
            </>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="items-start gap-x-2 py-2"
            onClick={() => {
              setMenuOpen(false)
              router.push(`/project/${projectRef}/storage/analytics`)
            }}
          >
            <Plus size={14} strokeWidth={1.5} className="mt-0.5 shrink-0" />
            <span className="flex flex-col gap-y-0.5">
              <span>Create an analytics bucket</span>
              <span className="text-xs text-foreground-lighter">
                Store large datasets for analytical queries, reporting, and notebook exploration.
              </span>
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={customRangeDialogOpen} onOpenChange={setCustomRangeDialogOpen}>
        <DialogContent className="w-auto max-w-none p-0">
          {customRangeDialogOpen ? (
            <LogsDatePicker
              value={logsDatePickerValue}
              helpers={EXPLORER_DATEPICKER_HELPERS}
              onSubmit={handleDateChange}
              open
              onOpenChange={(open) => {
                if (!open) setCustomRangeDialogOpen(false)
              }}
              buttonTriggerProps={{ className: 'sr-only' }}
              popoverContentProps={{ className: 'border-0 shadow-none' }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
