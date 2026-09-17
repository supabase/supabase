import { useQuery } from '@tanstack/react-query'
import { useParams } from 'common'
import { RefreshCw, Search } from 'lucide-react'
import { useState } from 'react'
import { Button, InputGroup, InputGroupAddon, InputGroupInput } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { ComputeInstanceCommandLine } from '../ComputeInstanceCommandLine'
import { ComputeLogsColumnRender } from '@/components/interfaces/Settings/Logs/LogColumnRenderers/ComputeLogsColumnRender'
import { EXPLORER_DATEPICKER_HELPERS } from '@/components/interfaces/Settings/Logs/Logs.constants'
import {
  LogsDatePicker,
  type DatePickerValue,
} from '@/components/interfaces/Settings/Logs/Logs.DatePickers'
import type { LogData } from '@/components/interfaces/Settings/Logs/Logs.types'
import { LogTable } from '@/components/interfaces/Settings/Logs/LogTable'
import { AlertError } from '@/components/ui/AlertError'
import {
  COMPUTE_INSTANCE_LOG_STREAM_LABEL,
  computeInstanceLogsQueryOptions,
  type ComputeInstanceLogStream,
} from '@/data/compute/compute-instance-logs-query'
import { useDebouncedValue } from '@/hooks/misc/useDebouncedValue'
import { CLI_NAME } from '@/lib/constants/compute'

interface ComputeInstanceLogsTabProps {
  instanceName: string
  stream: ComputeInstanceLogStream
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

export const ComputeInstanceLogsTab = ({ instanceName, stream }: ComputeInstanceLogsTabProps) => {
  const { ref: projectRef } = useParams()
  const [selectedLog, setSelectedLog] = useState<LogData | null>(null)
  const [dateRange, setDateRange] = useState<DatePickerValue>(defaultDateRange)
  const [message, setMessage] = useState('')
  const debouncedMessage = useDebouncedValue(message, 300)

  const {
    data: logs,
    error,
    isPending,
    isError,
    isFetching,
    refetch,
  } = useQuery(
    computeInstanceLogsQueryOptions({
      projectRef,
      name: instanceName,
      stream,
      iso_timestamp_start: dateRange.from,
      iso_timestamp_end: dateRange.to,
      message: debouncedMessage,
    })
  )

  const label = COMPUTE_INSTANCE_LOG_STREAM_LABEL[stream].toLowerCase()

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-default px-4 py-2">
        <div className="flex flex-wrap items-center gap-2">
          <LogsDatePicker
            hideWarnings
            value={dateRange}
            onSubmit={setDateRange}
            helpers={EXPLORER_DATEPICKER_HELPERS}
            align="start"
          />
          <InputGroup className="w-60">
            <InputGroupInput
              size="tiny"
              placeholder="Filter by event message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
          </InputGroup>
        </div>
        <Button icon={<RefreshCw />} loading={isFetching} onClick={() => refetch()}>
          Refresh
        </Button>
      </div>

      {isError && (
        <div className="p-4">
          <AlertError error={error} subject="Failed to retrieve instance logs" />
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
            columnRenderers={ComputeLogsColumnRender}
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
                  <ComputeInstanceCommandLine
                    command={`supabase ${CLI_NAME} logs ${instanceName} --follow`}
                  />
                </div>
              </div>
            }
          />
        </div>
      )}
    </div>
  )
}
