'use client'

import { Check, ChevronsUpDown, Logs, Terminal } from 'lucide-react'
import { useMemo, useState } from 'react'

import { genDefaultQuery, LogsTableName } from '../../lib/logs'
import { cn } from '@/lib/utils'
import { Alert, AlertDescription, AlertTitle } from '@/registry/default/components/ui/alert'
import { Button } from '@/registry/default/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/registry/default/components/ui/command'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/registry/default/components/ui/hover-card'
import { Popover, PopoverContent, PopoverTrigger } from '@/registry/default/components/ui/popover'
import { Skeleton } from '@/registry/default/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/registry/default/components/ui/table'
import { useGetLogs } from '@/registry/default/platform/platform-kit-nextjs/hooks/use-logs'

// Define log types with names and descriptions
const logTypes = [
  {
    value: LogsTableName.FN_EDGE,
    label: 'Function Edge Logs',
    description: 'Edge function execution logs with request and response metadata',
  },
  {
    value: LogsTableName.AUTH,
    label: 'Authentication Logs',
    description: 'User authentication events and security logs',
  },
  {
    value: LogsTableName.POSTGRES,
    label: 'PostgreSQL Logs',
    description: 'Database queries, errors, and performance metrics',
  },
  {
    value: LogsTableName.REALTIME,
    label: 'Realtime Logs',
    description: 'WebSocket connections and realtime subscriptions',
  },
  {
    value: LogsTableName.STORAGE,
    label: 'Storage Logs',
    description: 'File uploads, downloads, and storage operations',
  },
  {
    value: LogsTableName.PG_CRON,
    label: 'Cron Job Logs',
    description: 'Scheduled job executions and cron task logs',
  },
  {
    value: LogsTableName.EDGE,
    label: 'Edge Logs',
    description: 'HTTP requests and responses from the data API',
  },

  {
    value: LogsTableName.FUNCTIONS,
    label: 'Function Logs',
    description: 'Serverless function execution logs and events',
  },
  {
    value: LogsTableName.POSTGREST,
    label: 'PostgREST Logs',
    description: 'API requests to your database through PostgREST',
  },
  {
    value: LogsTableName.SUPAVISOR,
    label: 'Supavisor Logs',
    description: 'Connection pooling and database proxy logs',
  },
  {
    value: LogsTableName.PGBOUNCER,
    label: 'PgBouncer Logs',
    description: 'Legacy connection pooling logs',
  },
  {
    value: LogsTableName.PG_UPGRADE,
    label: 'PostgreSQL Upgrade Logs',
    description: 'Database upgrade processes and migration logs',
  },
]

export function LogsManager({ projectRef }: { projectRef: string }) {
  const [activeTab, setActiveTab] = useState<LogsTableName>(LogsTableName.FN_EDGE)
  const [open, setOpen] = useState(false)

  const sql = useMemo(() => genDefaultQuery(activeTab), [activeTab])

  const { data: logs, isLoading, error } = useGetLogs(projectRef, { sql })

  const selectedLogType = logTypes.find((type) => type.value === activeTab)

  return (
    <>
      <div className="p-6 pt-4 lg:p-8 lg:pt-8 border-b bg-background z-10 sticky top-0 flex items-center justify-between mb-6">
        <div className="flex-1">
          <h1 className="text-base lg:text-xl font-semibold">Logs</h1>
          <p className="hidden lg:block text-sm lg:text-base text-muted-foreground mt-1">
            Debug errors and track activity in your app
          </p>
        </div>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-64 justify-between"
            >
              {selectedLogType ? selectedLogType.label : 'Select log type...'}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <Command>
              <CommandInput placeholder="Search log types..." className="h-9" />
              <CommandList
                className="max-h-60 overflow-y-auto"
                onWheel={(e) => {
                  e.stopPropagation()
                }}
                style={{ overscrollBehavior: 'contain' }}
              >
                <CommandEmpty>No log type found.</CommandEmpty>
                <CommandGroup>
                  {logTypes.map((logType) => (
                    <CommandItem
                      key={logType.value}
                      value={logType.value}
                      onSelect={(currentValue) => {
                        setActiveTab(currentValue as LogsTableName)
                        setOpen(false)
                      }}
                      className="flex items-center gap-2 p-3"
                    >
                      <div className="flex-1">
                        <div className="text-xs mb-1 font-medium leading-none">{logType.label}</div>
                        <div className="text-xs text-muted-foreground leading-snug">
                          {logType.description}
                        </div>
                      </div>
                      <Check
                        className={cn(
                          'h-4 w-4 mt-0.5',
                          activeTab === logType.value ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {isLoading && (
        <div className="space-y-2 mx-8 mt-8">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
        </div>
      )}
      {(error || (logs && logs.error)) && (
        <div className="mx-6 lg:mx-8 mt-8">
          <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Error fetching logs</AlertTitle>
            <AlertDescription>
              {(error as any)?.message ||
                (typeof logs?.error === 'object' && logs.error?.message) ||
                'An unexpected error occurred. Please try again.'}
            </AlertDescription>
          </Alert>
        </div>
      )}
      {logs && logs.result && logs.result.length > 0 && (
        <div className="mt-4 overflow-auto w-full">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {Object.keys(logs.result[0] as object).map((key, idx, arr) => (
                  <TableHead
                    key={key}
                    className={
                      (idx === 0 ? 'first:pl-6 lg:first:pl-8 ' : '') +
                      (idx === arr.length - 1 ? 'last:pr-6 lg:last:pr-8 ' : '')
                    }
                  >
                    {key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {(logs.result as any[]).map((log, index) => (
                <TableRow key={log.id || index} className="group hover:bg-muted/50 relative">
                  {Object.keys(logs.result?.[0] ?? []).map((key, idx, arr) => {
                    const value = log[key]
                    const formattedValue = (() => {
                      if (key === 'timestamp' && typeof value === 'number') {
                        return new Date(value / 1000).toLocaleString()
                      }
                      if (value === null) {
                        return 'NULL'
                      }
                      return typeof value === 'object'
                        ? JSON.stringify(value, null, 2)
                        : String(value)
                    })()

                    return (
                      <TableCell
                        key={key}
                        className="first:pl-6 lg:first:pl-8 last:pr-6 lg:last:pr-8 text-xs text-muted-foreground group-hover:text-foreground min-w-[8rem]"
                      >
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <div className="text-xs font-mono w-fit max-w-96 truncate cursor-default">
                              {formattedValue}
                            </div>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-96 max-h-96 overflow-auto p-3">
                            <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                              {formattedValue}
                            </pre>
                          </HoverCardContent>
                        </HoverCard>
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {logs && logs.result && logs.result.length === 0 && (
        <div className="mt-8 mx-8">
          <Alert>
            <Logs className="h-4 w-4" />
            <AlertTitle>No logs found</AlertTitle>
            <AlertDescription>
              Logs will appear here when your application generates activity.
            </AlertDescription>
          </Alert>
        </div>
      )}
    </>
  )
}
