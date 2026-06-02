import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { Check, ChevronDown, Database, Plus, ScrollText } from 'lucide-react'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import {
  Button,
  cn,
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from 'ui'

import { EXPLORER_DATEPICKER_HELPERS } from '@/components/interfaces/Settings/Logs/Logs.constants'
import {
  LogsDatePicker,
  type DatePickerValue,
} from '@/components/interfaces/Settings/Logs/Logs.DatePickers'
import { DatabaseSelector } from '@/components/ui/DatabaseSelector'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { IS_PLATFORM } from '@/lib/constants'
import {
  useQueryExecutionSourceSnapshot,
  type QueryExecutionSource,
} from '@/state/query-execution-source'
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
  const snapV2 = useSqlEditorV2StateSnapshot()

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
  }

  if (!IS_PLATFORM) {
    return null
  }

  const executionSource = selectedSource ?? querySourceState.executionSource

  return (
    <div className={cn('flex items-center', className)}>
      <Popover modal={false}>
        <PopoverTrigger asChild>
          <div className="flex cursor-pointer">
            <span className="flex items-center text-foreground-lighter px-3 rounded-lg rounded-r-none text-xs border border-button border-r-0">
              Source
            </span>
            <Button
              type="default"
              iconRight={<ChevronDown strokeWidth={1.5} size={12} />}
              className="justify-start rounded-l-none rounded-r-none border-r-0"
            >
              {executionSource === 'database' ? (
                <span className="flex items-center gap-x-1.5">
                  <Database size={12} />
                  Database
                </span>
              ) : (
                <span className="flex items-center gap-x-1.5">
                  <ScrollText size={12} />
                  Logs
                </span>
              )}
            </Button>
          </div>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-72" side="bottom" align="end">
          <Command>
            <CommandList>
              <CommandGroup>
                <CommandItem
                  className="cursor-pointer"
                  onSelect={() => handleSourceChange('database')}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="flex items-center gap-x-2">
                      <Database size={14} />
                      Database
                    </span>
                    {executionSource === 'database' && <Check size={14} />}
                  </div>
                </CommandItem>
                <CommandItem className="cursor-pointer" onSelect={() => handleSourceChange('logs')}>
                  <div className="flex items-center justify-between w-full">
                    <span className="flex items-center gap-x-2">
                      <ScrollText size={14} />
                      Logs
                    </span>
                    {executionSource === 'logs' && <Check size={14} />}
                  </div>
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  className="cursor-pointer items-start gap-x-2 py-2"
                  onSelect={() => router.push(`/project/${projectRef}/storage/analytics`)}
                >
                  <Plus size={14} strokeWidth={1.5} className="mt-0.5 shrink-0" />
                  <span className="flex flex-col gap-y-0.5">
                    <span>Create an analytics bucket</span>
                    <span className="text-xs text-foreground-lighter">
                      Store large datasets for analytical queries, reporting, and notebook
                      exploration.
                    </span>
                  </span>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {executionSource === 'database' ? (
        <DatabaseSelector
          selectedDatabaseId={selectedDatabaseId}
          variant="connected-on-left"
          hideSourceLabel
          onSelectId={onSelectDatabase}
        />
      ) : (
        <LogsDatePicker
          value={selectedLogsDatePickerValue ?? querySourceState.logsDatePickerValue}
          helpers={EXPLORER_DATEPICKER_HELPERS}
          onSubmit={handleDateChange}
          buttonTriggerProps={{
            type: 'default',
            className: 'rounded-l-none border-l-0 h-[26px]',
          }}
        />
      )}
    </div>
  )
}
