import { useQuery } from '@tanstack/react-query'
import { useParams } from 'common'
import { RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { WorkerCommandLine } from '../WorkerCommandLine'
import { WorkersLogsColumnRender } from '@/components/interfaces/Settings/Logs/LogColumnRenderers/WorkersLogsColumnRender'
import { EXPLORER_DATEPICKER_HELPERS } from '@/components/interfaces/Settings/Logs/Logs.constants'
import {
  LogsDatePicker,
  type DatePickerValue,
} from '@/components/interfaces/Settings/Logs/Logs.DatePickers'
import type { LogData } from '@/components/interfaces/Settings/Logs/Logs.types'
import { LogTable } from '@/components/interfaces/Settings/Logs/LogTable'
import { AlertError } from '@/components/ui/AlertError'
import {
  WORKER_LOG_STREAM_LABEL,
  workerLogsQueryOptions,
  type WorkerLogStream,
} from '@/data/workers/worker-logs-query'
import { useDebouncedValue } from '@/hooks/misc/useDebouncedValue'
import { CLI_NAME } from '@/lib/constants/workers'

interface WorkerLogsTabProps {
  workerName: string
  stream: WorkerLogStream
}

const defaultDateRange = (): DatePickerValue => {
  const helper = EXPLORER_DATEPICKER_HELPERS.find((helper) => helper.text === 'Last 24 hours')!

  return {
    from: helper.calcFrom(),
    to: helper.calcTo(),
    isHelper: true,
    text: helper.text,
  }
}

export const WorkerLogsTab = ({ workerName, stream }: WorkerLogsTabProps) => {
  const { ref: projectRef } = useParams()
  const [selectedLog, setSelectedLog] = useState<LogData | null>(null)
  const [dateRange, setDateRange] = useState<DatePickerValue>(defaultDateRange)
  const [message, setMessage] = useState('')
  const [method, setMethod] = useState<string>()
  const debouncedMessage = useDebouncedValue(message, 300)

  const {
    data: logs,
    error,
    isPending,
    isError,
    isFetching,
    refetch,
  } = useQuery(
    workerLogsQueryOptions({
      projectRef,
      name: workerName,
      stream,
      iso_timestamp_start: dateRange.from,
      iso_timestamp_end: dateRange.to,
      message: debouncedMessage,
      method,
    })
  )

  const label = WORKER_LOG_STREAM_LABEL[stream].toLowerCase()

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-default px-4 py-2">
        <div className="flex flex-wrap items-center gap-2">
          <LogsDatePicker
            hideWarnings
            value={dateRange}
            onSubmit={setDateRange}
            helpers={EXPLORER_DATEPICKER_HELPERS}
          />
          {stream === 'requests' && (
            <Select
              value={method}
              onValueChange={(value) => setMethod(value === 'all' ? undefined : value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="All methods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All methods</SelectItem>
                {['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Input
            className="w-56"
            placeholder="Filter by event message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
        </div>
        <Button
          variant="default"
          icon={<RefreshCw />}
          loading={isFetching}
          onClick={() => refetch()}
        >
          Refresh
        </Button>
      </div>

      {isError && (
        <div className="p-4">
          <AlertError error={error} subject="Failed to retrieve worker logs" />
        </div>
      )}

      {!isError && isPending && (
        <div className="p-4">
          <GenericSkeletonLoader />
        </div>
      )}

      {!isError && !isPending && (
        <div className="relative flex flex-1 flex-col grow overflow-auto">
          <LogTable
            projectRef={projectRef ?? ''}
            columnRenderers={WorkersLogsColumnRender}
            data={logs ?? []}
            isLoading={isPending}
            showHeader={false}
            showHistogramToggle={false}
            selectedLog={selectedLog ?? undefined}
            onSelectedLogChange={(log) => setSelectedLog(log)}
            EmptyState={
              <div className="mx-auto max-w-md space-y-3 py-16 text-center">
                <p className="text-sm text-foreground">No {label} in the selected time range</p>
                <p className="text-sm text-foreground-lighter">
                  Follow them from the Supabase CLI while you wait for traffic.
                </p>
                <div className="pt-1 text-left">
                  <WorkerCommandLine command={`supabase ${CLI_NAME} logs ${workerName} --follow`} />
                </div>
              </div>
            }
          />
        </div>
      )}
    </div>
  )
}
