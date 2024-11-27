import { List } from 'lucide-react'
import { useRef } from 'react'

import { SimpleCodeBlock } from '@ui/components/SimpleCodeBlock'
import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { toString as CronToString } from 'cronstrue'
import { useCronJobsQuery } from 'data/database-cron-jobs/database-cron-jobs-query'
import { useCronJobRunsQuery } from 'data/database-cron-jobs/database-cron-jobs-runs-query'

import Link from 'next/link'
import DataGrid, { Column, DataGridHandle, Row } from 'react-data-grid'
import {
  Badge,
  Button,
  cn,
  Tooltip_Shadcn_,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
} from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import { calculateDuration, formatDate, isSecondsFormat } from './CronJobs.utils'
import CronJobsEmptyState from './CronJobsEmptyState'

type CronJobRun = {
  jobid: number
  runid: number
  job_pid: number
  database: string
  username: string
  command: string
  status: string
  return_message: string
  start_time: string
  end_time: string
}

export const CronJobTab = () => {
  // [Terry] this means that the childId is the jobid whereas in queues it's the queue name
  // not sure how we can use the name here
  // we could query by jobname, but they're not guaranteed to be unique afaik
  const { childId: jobid } = useParams()
  const { project } = useProjectContext()

  const gridRef = useRef<DataGridHandle>(null)

  const { data: cronJobRuns, isLoading: isLoadingCronJobRuns } = useCronJobRunsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    jobId: Number(jobid),
  })

  const { data: cronJobs, isLoading: isLoadingCronJobs } = useCronJobsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const currentJobState = cronJobs?.find((job) => job.jobid === Number(jobid))

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
          <Tooltip_Shadcn_>
            <TooltipTrigger_Shadcn_ asChild>
              <span className="text-xs cursor-pointer truncate max-w-[300px]">
                {row.return_message}
              </span>
            </TooltipTrigger_Shadcn_>
            <TooltipContent_Shadcn_
              side="bottom"
              align="center"
              className="max-w-[300px] text-wrap"
            >
              <SimpleCodeBlock
                showCopy={true}
                className="sql"
                parentClassName="!p-0 [&>div>span]:text-xs"
              >
                {row.return_message}
              </SimpleCodeBlock>
            </TooltipContent_Shadcn_>
          </Tooltip_Shadcn_>
        </div>
      ),
    },

    {
      id: 'status',
      name: 'Status',
      minWidth: 75,
      value: (row: CronJobRun) => (
        <Badge variant={row.status === 'success' ? 'success' : 'warning'}>{row.status}</Badge>
      ),
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
      value: (row: CronJobRun) => <div className="text-xs">{formatDate(row.end_time)}</div>,
    },

    {
      id: 'duration',
      name: 'Duration',
      minWidth: 100,
      value: (row: CronJobRun) => (
        <div className="text-xs">{calculateDuration(row.start_time, row.end_time)}</div>
      ),
    },
  ]

  const columns = cronJobColumns.map((col) => {
    const result: Column<any> = {
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

  return (
    <div className="h-full flex flex-col w-full bg-200">
      {/* turn this into some kind of proper tabs?  */}
      <div className="flex items-center px-6 justify-between h-7"></div>

      <div className="flex flex-col w-full h-full mt-4">
        <DataGrid
          ref={gridRef}
          style={{ height: '100%' }}
          className={cn('flex-1 flex-grow h-full')}
          rowHeight={44}
          headerRowHeight={36}
          columns={columns}
          rows={cronJobRuns ?? []}
          rowClass={(job) => {
            const isSelected = false
            return [
              `${isSelected ? 'bg-surface-300 dark:bg-surface-300' : 'bg-200'}  `,
              `${isSelected ? '[&>div:first-child]:border-l-4 border-l-secondary [&>div]:border-l-foreground' : ''}`,
              '[&>.rdg-cell]:border-box [&>.rdg-cell]:outline-none [&>.rdg-cell]:shadow-none',
              '[&>.rdg-cell:first-child>div]:ml-4',
            ].join(' ')
          }}
          renderers={{
            renderRow(idx, props) {
              return <Row key={props.row.id} {...props} />
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

      <div className="px-6 py-6 flex gap-12 border-t">
        {isLoadingCronJobs ? (
          <GenericSkeletonLoader />
        ) : (
          <>
            <div className="grid gap-2 w-56">
              <h3 className="text-sm">Schedule</h3>
              <p className="text-xs text-foreground-light">
                {currentJobState?.schedule ? (
                  <>
                    <span className="font-mono text-lg">{currentJobState.schedule}</span>
                    <p>
                      {isSecondsFormat(currentJobState.schedule)
                        ? ''
                        : CronToString(currentJobState.schedule.toLowerCase())}
                    </p>
                  </>
                ) : (
                  <span>Loading schedule...</span>
                )}
              </p>
            </div>

            <div className="grid gap-2">
              <h3 className="text-sm">Command</h3>
              <Tooltip_Shadcn_>
                <TooltipTrigger_Shadcn_ className=" text-left p-0! cursor-pointer truncate max-w-[300px] h-12 relative">
                  <SimpleCodeBlock
                    showCopy={false}
                    className="sql"
                    parentClassName=" [&>div>span]:text-xs bg-alternative-200 !p-2 rounded-md"
                  >
                    {currentJobState?.command}
                  </SimpleCodeBlock>
                  <div className="bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background-200 to-transparent absolute " />
                </TooltipTrigger_Shadcn_>
                <TooltipContent_Shadcn_
                  side="bottom"
                  align="center"
                  className="max-w-[400px] text-wrap"
                >
                  <SimpleCodeBlock
                    showCopy={false}
                    className="sql"
                    parentClassName=" [&>div>span]:text-xs bg-alternative-200 !p-2 rounded-md"
                  >
                    {currentJobState?.command}
                  </SimpleCodeBlock>
                </TooltipContent_Shadcn_>
              </Tooltip_Shadcn_>
              {/* <div className="text-xs text-foreground-light">
                <SimpleCodeBlock
                  showCopy={false}
                  className="sql"
                  parentClassName=" [&>div>span]:text-xs bg-alternative-200 !p-2 rounded-md"
                >
                  {currentJobState?.command}
                </SimpleCodeBlock>
              </div> */}
            </div>

            <div className="grid gap-2">
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
