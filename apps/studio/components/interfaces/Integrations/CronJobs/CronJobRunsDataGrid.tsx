import { ChevronRight, Eye, Timer } from 'lucide-react'
import { useRef, useState } from 'react'
import DataGrid, { Column, DataGridHandle, Row } from 'react-data-grid'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { CronJob } from 'data/database-cron-jobs/database-cron-jobs-query'
import { useCronJobRunsQuery } from 'data/database-cron-jobs/database-cron-jobs-runs-query'
import { useRouter } from 'next/router'
import {
  Badge,
  Button,
  ResizablePanel,
  ResizablePanelGroup,
  cn,
  HoverCard_Shadcn_,
  HoverCardTrigger_Shadcn_,
  HoverCardContent_Shadcn_,
  Separator,
} from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import { calculateDuration } from './CronJobs.utils'
import { formatDate } from './CronJobs.utils'
import { DocsButton } from 'components/ui/DocsButton'
import { CronJobsFormHeader } from './CronJobsFormHeader'

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

interface CronJobsDataGridProps {
  jobId: number
  jobState: { jobId: string; selectedJob: CronJob | null }
  updateJobState: (jobId: string, job: CronJob | null) => void
}

const CronJobRunsDataGrid = ({ jobId, jobState, updateJobState }: CronJobsDataGridProps) => {
  const { project } = useProjectContext()
  const router = useRouter()

  const gridRef = useRef<DataGridHandle>(null)

  const { data: cronJobs, isLoading } = useCronJobRunsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    jobId,
  })

  const [createCronJobSheetShown, setCreateCronJobSheetShown] = useState<
    Pick<CronJob, 'jobname' | 'schedule' | 'active' | 'command'> | undefined
  >()

  const cronJobColumns = [
    {
      id: 'runid',
      name: 'RunID',
      minWidth: 200,
      value: (row: CronJobRun) => (
        <div className="flex items-center gap-1.5">
          <h3 className="text-xs">{row.runid}</h3>
        </div>
      ),
    },
    {
      id: 'name',
      name: 'Name',
      minWidth: 200,
      value: (row: CronJobRun) => (
        <div className="flex items-center gap-1.5">
          <h3 className="text-xs">{row.username}</h3>
        </div>
      ),
    },

    {
      id: 'status',
      name: 'Status',
      minWidth: 100,
      value: (row: CronJobRun) => (
        <Badge variant={row.status === 'success' ? 'success' : 'warning'}>{row.status}</Badge>
      ),
    },
    {
      id: 'start_time',
      name: 'Start Time',
      minWidth: 100,
      value: (row: CronJobRun) => <div className="text-xs">{formatDate(row.start_time)}</div>,
    },
    {
      id: 'end_time',
      name: 'End Time',
      minWidth: 100,
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

  function handleSidepanelClose() {
    //setSelectedJob(null)
    const { id, ...otherParams } = router.query
    router.push({ query: otherParams })
  }

  return (
    <>
      <ResizablePanelGroup
        direction="horizontal"
        className="relative flex flex-grow bg-alternative min-h-0"
        autoSaveId="cron-jobs-layout"
      >
        <div className="h-full flex flex-col w-full">
          <CronJobsFormHeader />
          {/* turn this into some kind of proper tabs?  */}
          <div className="flex items-center px-6">
            <div className="flex items-center gap-2">
              <button onClick={() => updateJobState('', null)}>Jobs</button>
              {jobState.selectedJob && (
                <>
                  <ChevronRight size={12} className="text-muted-foreground" />
                  <span className="flex items-center gap-1">
                    <Timer size={14} className="text-muted-foreground" />
                    {jobState.selectedJob?.jobname}
                  </span>
                </>
              )}
            </div>
            <Separator orientation="vertical" className="ml-6 h-6" />
            <div className="flex items-center gap-6 ml-6">
              <div className="flex items-center gap-1">
                <span className="text-foreground-light text-sm">
                  {jobState.selectedJob?.schedule}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <HoverCard_Shadcn_ openDelay={200}>
                  <HoverCardTrigger_Shadcn_ asChild className="cursor-pointer">
                    <span className="font-mono p-1 bg-200 rounded-md text-sm flex items-center gap-2">
                      <Eye size={12} className="text-foreground-lighter" />
                      <span className="text-foreground-light text-sm truncate max-w-36">
                        {jobState.selectedJob?.command}
                      </span>
                    </span>
                  </HoverCardTrigger_Shadcn_>
                  <HoverCardContent_Shadcn_>
                    <span className="text-sm font-mono text-foreground-light">
                      {jobState.selectedJob?.command}
                    </span>
                  </HoverCardContent_Shadcn_>
                </HoverCard_Shadcn_>
              </div>
            </div>
          </div>
          <ResizablePanel defaultSize={1}>
            <div className="flex flex-col w-full h-full mt-4">
              <DataGrid
                ref={gridRef}
                style={{ height: '100%' }}
                className={cn('flex-1 flex-grow h-full')}
                rowHeight={44}
                headerRowHeight={36}
                columns={columns}
                rows={cronJobs ?? []}
                rowClass={(job) => {
                  ///const isSelected = job.jobid === selectedJob?.jobid
                  const isSelected = false
                  return [
                    `${isSelected ? 'bg-surface-300 dark:bg-surface-300' : 'bg-200'} cursor-pointer`,
                    `${isSelected ? '[&>div:first-child]:border-l-4 border-l-secondary [&>div]:border-l-foreground' : ''}`,
                    '[&>.rdg-cell]:border-box [&>.rdg-cell]:outline-none [&>.rdg-cell]:shadow-none',
                    '[&>.rdg-cell:first-child>div]:ml-4',
                  ].join(' ')
                }}
                renderers={{
                  renderRow(idx, props) {
                    return (
                      <Row
                        key={props.row.id}
                        {...props}
                        // onClick={() => {
                        //   if (typeof idx === 'number' && idx >= 0) {
                        //     //setSelectedJob(props.row)
                        //     gridRef.current?.scrollToCell({ idx: 0, rowIdx: idx })
                        //     //router.push({ ...router, query: { ...router.query, id: props.row.id } })
                        //   }
                        // }}
                      />
                    )
                  },
                  noRowsFallback: isLoading ? (
                    <div className="absolute top-14 px-6 w-full">
                      <GenericSkeletonLoader />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      No cron job runs found
                    </div>
                  ),
                }}
              />
            </div>
          </ResizablePanel>
        </div>
      </ResizablePanelGroup>
    </>
  )
}

export default CronJobRunsDataGrid
