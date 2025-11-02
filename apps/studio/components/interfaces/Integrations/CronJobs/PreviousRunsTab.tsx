import dayjs from 'dayjs'
import { CircleCheck, CircleX, Loader } from 'lucide-react'
import { UIEvent, useCallback, useMemo } from 'react'
import DataGrid, { Column, Row } from 'react-data-grid'

import { useParams } from 'common'
import {
  CronJobRun,
  useCronJobRunsInfiniteQuery,
} from 'data/database-cron-jobs/database-cron-jobs-runs-infinite-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { cn, CodeBlock, LoadingLine, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { TimestampInfo } from 'ui-patterns'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import { calculateDuration, formatDate } from './CronJobs.utils'
import CronJobsEmptyState from './CronJobsEmptyState'

const cronJobColumns = [
  {
    id: 'runid',
    name: 'RunID',
    minWidth: 30,
    width: 30,
    value: (row: CronJobRun) => (
      <div className="flex items-center gap-1.5">
        <h3 className="text-xs">{row.runid}</h3>
      </div>
    ),
  },
  {
    id: 'message',
    name: 'Message',
    minWidth: 200,
    value: (row: CronJobRun) => (
      <div className="flex items-center gap-1.5">
        {row.return_message ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-xs cursor-pointer truncate max-w-[300px]">
                {row.return_message}
              </span>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              align="start"
              className="min-w-[200px] max-w-[300px] text-wrap p-0"
            >
              <p className="text-xs font-mono px-2 py-1 border-b bg-surface-100">Message</p>
              <CodeBlock
                hideLineNumbers
                language="sql"
                value={row.return_message.trim()}
                className={cn(
                  'py-0 px-3.5 max-w-full prose dark:prose-dark border-0 rounded-t-none',
                  '[&>code]:m-0 [&>code>span]:flex [&>code>span]:flex-wrap min-h-11',
                  '[&>code]:text-xs'
                )}
              />
            </TooltipContent>
          </Tooltip>
        ) : (
          <span>-</span>
        )}
      </div>
    ),
  },

  {
    id: 'status',
    name: 'Status',
    minWidth: 75,
    value: (row: CronJobRun) => <StatusBadge status={row.status} />,
  },
  {
    id: 'start_time',
    name: 'Start Time',
    minWidth: 120,
    value: (row: CronJobRun) => <div className="text-xs">{formatDate(row.start_time)}</div>,
  },
  {
    id: 'end_time',
    name: 'End Time',
    minWidth: 120,
    value: (row: CronJobRun) => (
      <div className="flex items-center text-xs">
        {row.end_time ? formatDate(row.end_time) : '-'}
      </div>
    ),
  },

  {
    id: 'duration',
    name: 'Duration',
    minWidth: 100,
    value: (row: CronJobRun) => (
      <div className="flex items-center">
        <span className="text-xs">
          {row.start_time && row.end_time ? calculateDuration(row.start_time, row.end_time) : ''}
        </span>
      </div>
    ),
  },
]

const columns = cronJobColumns.map((col) => {
  const result: Column<CronJobRun> = {
    key: col.id,
    name: col.name,
    resizable: true,
    minWidth: col.minWidth ?? 120,
    headerCellClass: undefined,
    renderHeaderCell: () => {
      return (
        <div
          className={cn(
            'flex items-center justify-between font-normal text-xs w-full',
            col.id === 'runid' && 'ml-8'
          )}
        >
          <p className="!text-foreground">{col.name}</p>
        </div>
      )
    },
    renderCell: (props) => {
      const value = col.value(props.row)

      if (['start_time', 'end_time'].includes(col.id)) {
        const rawValue = (props.row as any)[(col as any).id]
        if (rawValue) {
          const formattedValue = dayjs(rawValue).valueOf()
          return (
            <div className="flex items-center">
              <TimestampInfo
                utcTimestamp={formattedValue}
                labelFormat="DD MMM YYYY HH:mm:ss (ZZ)"
                className="text-xs"
              />
            </div>
          )
        }
      }

      return value
    },
  }
  return result
})

function isAtBottom({ currentTarget }: UIEvent<HTMLDivElement>): boolean {
  return currentTarget.scrollTop + 10 >= currentTarget.scrollHeight - currentTarget.clientHeight
}

export const PreviousRunsTab = () => {
  const { childId } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const jobId = Number(childId)

  const {
    data,
    isLoading: isLoadingCronJobRuns,
    isFetching,
    fetchNextPage,
  } = useCronJobRunsInfiniteQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      jobId: jobId,
    },
    { enabled: !!jobId, staleTime: 30000 }
  )

  const cronJobRuns = useMemo(() => data?.pages.flatMap((p) => p) || [], [data?.pages])

  const handleScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      if (isLoadingCronJobRuns || !isAtBottom(event)) return
      // the cancelRefetch is to prevent the query from being refetched when the user scrolls back up and down again,
      // resulting in multiple fetchNextPage calls
      fetchNextPage({ cancelRefetch: false })
    },
    [fetchNextPage, isLoadingCronJobRuns]
  )

  return (
    <div className="h-full flex flex-col">
      <LoadingLine loading={isFetching} />
      <DataGrid
        className="flex-grow border-t-0"
        rowHeight={44}
        headerRowHeight={36}
        onScroll={handleScroll}
        columns={columns}
        rows={cronJobRuns ?? []}
        rowClass={() => {
          return cn(
            'cursor-pointer',
            '[&>.rdg-cell]:border-box [&>.rdg-cell]:outline-none [&>.rdg-cell]:shadow-none',
            '[&>.rdg-cell:first-child>div]:ml-8'
          )
        }}
        renderers={{
          renderRow(_idx, props) {
            return <Row key={props.row.job_pid} {...props} />
          },
          noRowsFallback: isLoadingCronJobRuns ? (
            <div className="absolute top-14 px-6 w-full">
              <GenericSkeletonLoader />
            </div>
          ) : (
            <div className="flex items-center justify-center w-full col-span-6">
              <CronJobsEmptyState page="runs" />
            </div>
          ),
        }}
      />
    </div>
  )
}

interface StatusBadgeProps {
  status: string
}

function StatusBadge({ status }: StatusBadgeProps) {
  if (status === 'succeeded') {
    return (
      <span className="text-brand-600 flex items-center gap-1 text-xs">
        <CircleCheck size={14} /> Succeeded
      </span>
    )
  }

  if (status === 'failed') {
    return (
      <span className="text-destructive flex items-center gap-1 text-xs">
        <CircleX size={14} /> Failed
      </span>
    )
  }

  if (['running', 'starting', 'sending', 'connecting'].includes(status)) {
    return (
      <span className="text-_secondary flex items-center gap-1 text-xs">
        <Loader size={14} className="animate-spin" /> Running
      </span>
    )
  }

  return null
}
