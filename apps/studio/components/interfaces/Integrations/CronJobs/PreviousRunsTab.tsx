import { toString as CronToString } from 'cronstrue'
import { CircleCheck, CircleX, List, Loader } from 'lucide-react'
import Link from 'next/link'
import { UIEvent, useCallback, useEffect, useMemo } from 'react'
import DataGrid, { Column, Row } from 'react-data-grid'

import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useCronJobQuery } from 'data/database-cron-jobs/database-cron-job-query'
import {
  CronJobRun,
  useCronJobRunsInfiniteQuery,
} from 'data/database-cron-jobs/database-cron-jobs-runs-infinite-query'
import {
  Button,
  cn,
  LoadingLine,
  SimpleCodeBlock,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import { calculateDuration, formatDate, isSecondsFormat } from './CronJobs.utils'
import CronJobsEmptyState from './CronJobsEmptyState'

const cronJobColumns = [
  {
    id: 'runid',
    name: 'RunID',
    minWidth: 60,
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
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-xs cursor-pointer truncate max-w-[300px]">
              {row.return_message}
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="center" className="max-w-[300px] text-wrap">
            <SimpleCodeBlock
              showCopy={true}
              className="sql"
              parentClassName="!p-0 [&>div>span]:text-xs"
            >
              {row.return_message}
            </SimpleCodeBlock>
          </TooltipContent>
        </Tooltip>
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
      <div className="text-xs">{row.status === 'succeeded' ? formatDate(row.end_time) : '-'}</div>
    ),
  },

  {
    id: 'duration',
    name: 'Duration',
    minWidth: 100,
    value: (row: CronJobRun) => (
      <span className="text-xs">
        {row.status === 'succeeded' ? calculateDuration(row.start_time, row.end_time) : ''}
      </span>
    ),
  },
]

const columns = cronJobColumns.map((col) => {
  const result: Column<CronJobRun> = {
    key: col.id,
    name: col.name,
    resizable: true,
    minWidth: col.minWidth ?? 120,
    headerCellClass: 'first:pl-6 cursor-pointer',
    renderHeaderCell: () => {
      return (
        <div className="flex items-center justify-between font-mono font-normal text-xs w-full">
          <div className="flex items-center gap-x-2">
            <p className="!text-foreground">{col.name}</p>
          </div>
        </div>
      )
    },
    renderCell: (props) => {
      const value = col.value(props.row)

      return (
        <div
          className={cn(
            'w-full flex flex-col justify-center font-mono text-xs',
            typeof value === 'number' ? 'text-right' : ''
          )}
        >
          <span>{value}</span>
        </div>
      )
    },
  }
  return result
})

function isAtBottom({ currentTarget }: UIEvent<HTMLDivElement>): boolean {
  return currentTarget.scrollTop + 10 >= currentTarget.scrollHeight - currentTarget.clientHeight
}

export const PreviousRunsTab = () => {
  const { childId } = useParams()
  const { project } = useProjectContext()

  const jobId = Number(childId)

  const { data: job, isLoading: isLoadingCronJobs } = useCronJobQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    id: jobId,
  })

  const {
    data,
    isLoading: isLoadingCronJobRuns,
    fetchNextPage,
    refetch,
    isFetching,
  } = useCronJobRunsInfiniteQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      jobId: jobId,
    },
    { enabled: !!jobId, staleTime: 30 }
  )

  useEffect(() => {
    // Refetch only the first page
    const timerId = setInterval(() => {
      refetch({ refetchPage: (_page, index) => index === 0 })
    }, 30000)

    return () => clearInterval(timerId)
  }, [refetch])

  const handleScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      if (isLoadingCronJobRuns || !isAtBottom(event)) return
      // the cancelRefetch is to prevent the query from being refetched when the user scrolls back up and down again,
      // resulting in multiple fetchNextPage calls
      fetchNextPage({ cancelRefetch: false })
    },
    [fetchNextPage, isLoadingCronJobRuns]
  )

  const cronJobRuns = useMemo(() => data?.pages.flatMap((p) => p) || [], [data?.pages])

  return (
    <div className="h-full flex flex-col">
      <LoadingLine loading={isFetching} />
      <DataGrid
        className="flex-grow"
        rowHeight={44}
        headerRowHeight={36}
        onScroll={handleScroll}
        columns={columns}
        rows={cronJobRuns ?? []}
        rowClass={() => {
          const isSelected = false
          return cn([
            `${isSelected ? 'bg-surface-300 dark:bg-surface-300' : 'bg-200'}  `,
            `${isSelected ? '[&>div:first-child]:border-l-4 border-l-secondary [&>div]:border-l-foreground' : ''}`,
            '[&>.rdg-cell]:border-box [&>.rdg-cell]:outline-none [&>.rdg-cell]:shadow-none',
            '[&>.rdg-cell:first-child>div]:ml-4',
          ])
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

      <div className="px-6 py-6 flex gap-12 border-t bg">
        {isLoadingCronJobs ? (
          <GenericSkeletonLoader />
        ) : (
          <>
            <div className="grid gap-2 w-56">
              <h3 className="text-sm">Schedule</h3>
              <p className="text-xs text-foreground-light">
                {job?.schedule ? (
                  <>
                    <span className="font-mono text-lg">{job.schedule.toLocaleLowerCase()}</span>
                    <p>
                      {isSecondsFormat(job.schedule)
                        ? ''
                        : CronToString(job.schedule.toLowerCase())}
                    </p>
                  </>
                ) : (
                  <span>Loading schedule...</span>
                )}
              </p>
            </div>

            <div className="grid gap-y-2">
              <h3 className="text-sm">Command</h3>
              <Tooltip>
                <TooltipTrigger className=" text-left p-0! cursor-pointer truncate max-w-[300px] h-12 relative">
                  <SimpleCodeBlock
                    showCopy={false}
                    className="sql"
                    parentClassName=" [&>div>span]:text-xs bg-alternative-200 !p-2 rounded-md"
                  >
                    {job?.command}
                  </SimpleCodeBlock>
                  <div className="bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background-200 to-transparent absolute " />
                </TooltipTrigger>
                <TooltipContent side="bottom" align="center" className="max-w-[400px] text-wrap">
                  <SimpleCodeBlock
                    showCopy={false}
                    className="sql"
                    parentClassName=" [&>div>span]:text-xs bg-alternative-200 !p-2 rounded-md"
                  >
                    {job?.command}
                  </SimpleCodeBlock>
                </TooltipContent>
              </Tooltip>
            </div>

            <div className="grid gap-y-2">
              <h3 className="text-sm">Explore</h3>
              <Button asChild type="outline" icon={<List strokeWidth={1.5} size="14" />}>
                {/* [Terry] need to link to the exact jobid, but not currently supported */}
                <Link target="_blank" href={`/project/${project?.ref}/logs/pgcron-logs/`}>
                  View logs
                </Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

interface StatusBadgeProps {
  status: string
}

function StatusBadge({ status }: StatusBadgeProps) {
  if (status === 'succeeded') {
    return (
      <span className="text-brand-600 flex items-center gap-1">
        <CircleCheck size={14} /> Succeeded
      </span>
    )
  }

  if (status === 'failed') {
    return (
      <span className="text-destructive flex items-center gap-1">
        <CircleX size={14} /> Failed
      </span>
    )
  }

  if (['running', 'starting', 'sending', 'connecting'].includes(status)) {
    return (
      <span className="text-_secondary flex items-center gap-1">
        <Loader size={14} className="animate-spin" /> Running
      </span>
    )
  }

  return null
}
