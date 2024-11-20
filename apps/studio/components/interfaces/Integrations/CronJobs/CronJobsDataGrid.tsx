import { ChevronRight, Pencil, Trash } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import DataGrid, { Column, DataGridHandle, Row } from 'react-data-grid'

import { SimpleCodeBlock } from '@ui/components/SimpleCodeBlock'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { CronJob, useCronJobsQuery } from 'data/database-cron-jobs/database-cron-jobs-query'
import { useDatabaseCronJobToggleMutation } from 'data/database-cron-jobs/database-cron-jobs-toggle-mutation'
import {
  Badge,
  Button,
  cn,
  ResizablePanel,
  ResizablePanelGroup,
  Sheet,
  SheetContent,
  Tooltip_Shadcn_,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import { CreateCronJobSheet } from './CreateCronJobSheet'
import { computeNextRunFromCurrentTime } from './CronJobs.utils'
import CronJobsEmptyState from './CronJobsEmptyState'
import DeleteCronJob from './DeleteCronJob'

interface CronJobsDataGridProps {
  jobState: { jobId: string; selectedJob: CronJob | null }
  updateJobState: (jobId: string, job: CronJob | null) => void
}

const CronJobsDataGrid = ({ jobState, updateJobState }: CronJobsDataGridProps) => {
  const { project } = useProjectContext()

  const { data: cronJobs, isLoading } = useCronJobsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const gridRef = useRef<DataGridHandle>(null)

  const { project: selectedProject } = useProjectContext()

  const [toggleConfirmationModalShown, showToggleConfirmationModal] = useState(false)

  const [createCronJobSheetShown, setCreateCronJobSheetShown] = useState<
    Pick<CronJob, 'jobname' | 'schedule' | 'active' | 'command'> | undefined
  >()

  // used for confirmation prompt in the Create Cron Job Sheet
  const [isClosingCreateCronJobSheet, setIsClosingCreateCronJobSheet] = useState(false)
  const [cronJobForDeletion, setCronJobForDeletion] = useState<CronJob | undefined>()

  const { mutate: toggleDatabaseCronJob, isLoading: isTogglingCronJob } =
    useDatabaseCronJobToggleMutation()

  const [currentTime, setCurrentTime] = useState(new Date())

  // Update the current run time every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const cronJobColumns = [
    {
      id: 'name',
      name: 'Name',
      minWidth: 200,
      value: (row: CronJob) => (
        <div className="flex items-center gap-1.5">
          <h3 className="text-xs">{row.jobname}</h3>
        </div>
      ),
    },
    {
      id: 'schedule',
      name: 'Schedule',
      minWidth: 120,
      value: (row: CronJob) => <div className="text-xs">{row.schedule}</div>,
    },
    {
      id: 'next_run',
      name: 'Next Run',
      minWidth: 150,
      value: (row: CronJob) => (
        <div className="text-xs">{computeNextRunFromCurrentTime(row.schedule, currentTime)}</div>
      ),
    },

    {
      id: 'command',
      name: 'Command',
      minWidth: 150,
      value: (row: CronJob) => (
        <div className="flex items-center gap-1.5">
          <Tooltip_Shadcn_>
            <TooltipTrigger_Shadcn_ asChild>
              <span className="text-xs cursor-pointer truncate max-w-[300px]">{row.command}</span>
            </TooltipTrigger_Shadcn_>
            <TooltipContent_Shadcn_
              side="bottom"
              align="center"
              className="max-w-[300px] text-wrap"
            >
              <SimpleCodeBlock
                showCopy={false}
                className="sql"
                parentClassName="!p-0 [&>div>span]:text-xs"
              >
                {row.command}
              </SimpleCodeBlock>
            </TooltipContent_Shadcn_>
          </Tooltip_Shadcn_>
        </div>
      ),
    },
    {
      id: 'status',
      name: 'Status',
      minWidth: 100,
      value: (row: CronJob) => (
        <Badge variant={row.active ? 'default' : 'secondary'}>
          {row.active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      id: 'edit',
      name: '',
      minWidth: 150,
      value: (row: CronJob) => (
        <div>
          <Button
            type="text"
            icon={<Pencil size={16} />}
            onClick={(event) => {
              event.stopPropagation()
              setCreateCronJobSheetShown(row)
            }}
          />

          <Button
            type="text"
            icon={<Trash size={16} />}
            onClick={(event) => {
              event.stopPropagation()
              setCronJobForDeletion(row)
            }}
          />
        </div>
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
    <>
      <ResizablePanelGroup
        direction="horizontal"
        className="relative flex flex-grow bg-alternative min-h-0"
        autoSaveId="cron-jobs-layout"
      >
        <div className="h-full flex flex-col w-full bg-200 pt-8">
          <div className="flex items-center gap-2 px-6">
            Jobs
            {jobState.jobId && (
              <>
                <ChevronRight />
                {jobState.selectedJob?.jobname}
              </>
            )}
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
                  const isSelected = job.jobid === Number(jobState.jobId)
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
                        onClick={() => {
                          if (typeof idx === 'number' && idx >= 0) {
                            gridRef.current?.scrollToCell({ idx: 0, rowIdx: idx })
                            //router.push({ ...router, query: { ...router.query, id: props.row.id } })
                            updateJobState(props.row.jobid?.toString() || '', props.row)
                          }
                        }}
                      />
                    )
                  },
                  noRowsFallback: isLoading ? (
                    <div className="absolute top-14 px-6 w-full">
                      <GenericSkeletonLoader />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-full col-span-5">
                      <CronJobsEmptyState context="jobs" />
                    </div>
                  ),
                }}
              />
            </div>
          </ResizablePanel>
        </div>
      </ResizablePanelGroup>

      <Sheet
        open={!!createCronJobSheetShown}
        onOpenChange={() => setIsClosingCreateCronJobSheet(true)}
      >
        <SheetContent size="default" tabIndex={undefined}>
          <CreateCronJobSheet
            selectedCronJob={createCronJobSheetShown}
            onClose={() => {
              setIsClosingCreateCronJobSheet(false)
              setCreateCronJobSheetShown(undefined)
            }}
            isClosing={isClosingCreateCronJobSheet}
            setIsClosing={setIsClosingCreateCronJobSheet}
          />
        </SheetContent>
      </Sheet>

      <DeleteCronJob
        visible={!!cronJobForDeletion}
        onClose={() => setCronJobForDeletion(undefined)}
        cronJob={cronJobForDeletion!}
      />

      <ConfirmationModal
        visible={toggleConfirmationModalShown}
        title={jobState.selectedJob?.active ? 'Disable cron job' : 'Enable cron job'}
        loading={isTogglingCronJob}
        confirmLabel={jobState.selectedJob?.active ? 'Disable' : 'Enable'}
        onCancel={() => showToggleConfirmationModal(false)}
        variant={jobState.selectedJob?.active ? 'destructive' : undefined}
        onConfirm={() => {
          toggleDatabaseCronJob({
            projectRef: selectedProject?.ref!,
            connectionString: selectedProject?.connectionString,
            jobId: jobState.selectedJob?.jobid!,
            active: !jobState.selectedJob?.active,
          })
          showToggleConfirmationModal(false)
        }}
      >
        <p className="text-sm text-foreground-light">
          <span>{`Are you sure you want to ${jobState.selectedJob?.active ? 'disable' : 'enable'} the`}</span>{' '}
          <span className="font-bold">{`${jobState.selectedJob?.jobname}`}</span>
          <span> cron job?</span>
        </p>
      </ConfirmationModal>
    </>
  )
}

export default CronJobsDataGrid
