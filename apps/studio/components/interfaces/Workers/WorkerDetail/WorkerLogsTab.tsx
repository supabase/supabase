import { useQuery } from '@tanstack/react-query'
import { useParams } from 'common'
import { RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { Button } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { WorkerCommandLine } from '../WorkerCommandLine'
import { WorkersLogsColumnRender } from '@/components/interfaces/Settings/Logs/LogColumnRenderers/WorkersLogsColumnRender'
import type { LogData } from '@/components/interfaces/Settings/Logs/Logs.types'
import { LogTable } from '@/components/interfaces/Settings/Logs/LogTable'
import { AlertError } from '@/components/ui/AlertError'
import {
  WORKER_LOG_STREAM_LABEL,
  workerLogsQueryOptions,
  type WorkerLogStream,
} from '@/data/workers/worker-logs-query'
import { CLI_NAME } from '@/lib/constants/workers'

interface WorkerLogsTabProps {
  workerName: string
  stream: WorkerLogStream
}

export const WorkerLogsTab = ({ workerName, stream }: WorkerLogsTabProps) => {
  const { ref: projectRef } = useParams()
  const [selectedLog, setSelectedLog] = useState<LogData | null>(null)

  const {
    data: logs,
    error,
    isPending,
    isError,
    isFetching,
    refetch,
  } = useQuery(workerLogsQueryOptions({ projectRef, name: workerName, stream }))

  const label = WORKER_LOG_STREAM_LABEL[stream].toLowerCase()

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <div className="flex items-center justify-end border-b border-default px-4 py-2">
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
                <p className="text-sm text-foreground">No {label} in the last 24 hours</p>
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
