import { useQuery } from '@tanstack/react-query'
import { useParams } from 'common'
import dayjs from 'dayjs'
import { RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { Button, cn } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { WorkerCommandLine } from '../WorkerCommandLine'
import { AlertError } from '@/components/ui/AlertError'
import {
  WORKER_LOG_STREAM_LABEL,
  workerLogsQueryOptions,
  type WorkerLogStream,
} from '@/data/workers/worker-logs-query'
import { CLI_NAME } from '@/lib/constants/workers'

interface WorkerLogsTabProps {
  workerName: string
}

const STREAMS: WorkerLogStream[] = ['requests', 'output', 'builds']

const severityClassName = (severity: string) => {
  const level = severity.toLowerCase()
  if (level === 'error' || level === 'fatal') return 'text-destructive-600'
  if (level === 'warning' || level === 'warn') return 'text-warning-600'
  return 'text-foreground-lighter'
}

export const WorkerLogsTab = ({ workerName }: WorkerLogsTabProps) => {
  const { ref: projectRef } = useParams()
  const [stream, setStream] = useState<WorkerLogStream>('requests')

  const {
    data: logs,
    error,
    isPending,
    isError,
    isSuccess,
    isFetching,
    refetch,
  } = useQuery(workerLogsQueryOptions({ projectRef, name: workerName, stream }))

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-x-4 border-b border-default">
          {STREAMS.map((option) => (
            <button
              key={option}
              type="button"
              tabIndex={0}
              onClick={() => setStream(option)}
              className={cn(
                '-mb-px border-b px-0.5 py-1.5 text-sm transition-colors',
                option === stream
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-foreground-lighter hover:text-foreground-light'
              )}
            >
              {WORKER_LOG_STREAM_LABEL[option]}
            </button>
          ))}
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

      {isPending && <GenericSkeletonLoader />}
      {isError && <AlertError error={error} subject="Failed to retrieve worker logs" />}
      {isSuccess && logs.length === 0 && (
        <div className="rounded-md border border-default bg-surface-100 px-6 py-10">
          <div className="mx-auto max-w-md space-y-3 text-center">
            <p className="text-sm text-foreground">
              No {WORKER_LOG_STREAM_LABEL[stream].toLowerCase()} in the last 24 hours
            </p>
            <p className="text-sm text-foreground-lighter">
              Follow them from the Supabase CLI while you wait for traffic.
            </p>
            <div className="pt-1 text-left">
              <WorkerCommandLine command={`supabase ${CLI_NAME} logs ${workerName} --follow`} />
            </div>
          </div>
        </div>
      )}
      {isSuccess && logs.length > 0 && (
        <ul className="divide-y divide-default rounded-md border border-default bg-surface-100 font-mono text-xs">
          {logs.map((log) => (
            <li key={log.id} className="flex gap-4 px-3 py-2">
              <span className="shrink-0 text-foreground-lighter">
                {dayjs(log.timestamp).format('DD MMM HH:mm:ss')}
              </span>
              {log.severity && (
                <span className={cn('shrink-0 uppercase', severityClassName(log.severity))}>
                  {log.severity}
                </span>
              )}
              <span className="whitespace-pre-wrap break-all text-foreground-light">
                {log.message}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
