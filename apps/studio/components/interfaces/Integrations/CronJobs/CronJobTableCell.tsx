import dayjs from 'dayjs'
import { Clipboard, Edit, Trash } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { CronJob } from 'data/database-cron-jobs/database-cron-jobs-query'
import { useDatabaseCronJobToggleMutation } from 'data/database-cron-jobs/database-cron-jobs-toggle-mutation'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import {
  Badge,
  Button,
  cn,
  ContextMenu_Shadcn_,
  ContextMenuContent_Shadcn_,
  ContextMenuItem_Shadcn_,
  ContextMenuSeparator_Shadcn_,
  ContextMenuTrigger_Shadcn_,
  copyToClipboard,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  DialogTrigger,
  Switch,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { TimestampInfo } from 'ui-patterns'
import { getNextRun } from './CronJobs.utils'

interface CronJobTableCellProps {
  col: any
  row: any
  onSelectEdit: (job: CronJob) => void
  onSelectDelete: (job: CronJob) => void
}

export const CronJobTableCell = ({
  col,
  row,
  onSelectEdit,
  onSelectDelete,
}: CronJobTableCellProps) => {
  const { data: project } = useSelectedProjectQuery()

  const [showToggleModal, setShowToggleModal] = useState(false)

  const value = row?.[col.id]
  const { jobid, schedule, latest_run, status, active, jobname } = row

  const formattedValue =
    col.id === 'jobname' && !jobname
      ? 'No name provided'
      : col.id === 'lastest_run'
        ? !!value
          ? dayjs(value).valueOf()
          : undefined
        : col.id === 'next_run'
          ? getNextRun(schedule, latest_run)
          : value

  const { mutate: toggleDatabaseCronJob, isLoading: isToggling } = useDatabaseCronJobToggleMutation(
    {
      onSuccess: () => {
        toast.success('Successfully asdasd')
        setShowToggleModal(false)
      },
    }
  )

  const onConfirmToggle = () => {
    toggleDatabaseCronJob({
      projectRef: project?.ref!,
      connectionString: project?.connectionString,
      jobId: jobid,
      active: !active,
    })
  }

  if (col.id === 'active') {
    return (
      <Dialog open={showToggleModal} onOpenChange={setShowToggleModal}>
        <DialogTrigger className="flex items-center" onClick={(e) => e.stopPropagation()}>
          <Switch
            id={`cron-job-active-${jobid}`}
            size="medium"
            disabled={isToggling}
            checked={active}
          />
        </DialogTrigger>
        <DialogContent
          onClick={(e) => e.stopPropagation()}
          dialogOverlayProps={{ onClick: (e) => e.stopPropagation() }}
        >
          <DialogHeader>
            <DialogTitle>{active ? 'Disable' : 'Enable'} cron job</DialogTitle>
          </DialogHeader>
          <DialogSectionSeparator />
          <DialogSection>
            <p className="text-sm">
              Are you sure you want to {active ? 'disable' : 'enable'} the cron job "{jobname}"?{' '}
            </p>
          </DialogSection>
          <DialogFooter>
            <Button type="default" onClick={() => setShowToggleModal(false)}>
              Cancel
            </Button>
            <Button
              type={active ? 'warning' : 'primary'}
              loading={isToggling}
              onClick={onConfirmToggle}
            >
              {active ? 'Disable' : 'Enable'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <ContextMenu_Shadcn_>
      <ContextMenuTrigger_Shadcn_ asChild>
        <div className={cn('w-full flex items-center text-xs')}>
          {['latest_run', 'next_run'].includes(col.id) ? (
            col.id === 'latest_run' && formattedValue === null ? (
              <p className="text-foreground-lighter">Job has not been run yet</p>
            ) : col.id === 'next_run' && !formattedValue ? (
              <p className="text-foreground-lighter">Unable to parse next run for job</p>
            ) : (
              <TimestampInfo
                utcTimestamp={formattedValue}
                labelFormat="DD MMM YYYY HH:mm:ss (ZZ)"
                className="font-sans text-xs"
              />
            )
          ) : (
            <p
              className={cn(
                col.id === 'jobname' && !jobname && 'text-foreground-lighter',
                col.id === 'command' && 'font-mono'
              )}
            >
              {formattedValue}
            </p>
          )}
          {col.id === 'latest_run' && !!status && (
            <Badge
              variant={status === 'failed' ? 'destructive' : 'success'}
              className="capitalize ml-2"
            >
              {status}
            </Badge>
          )}
        </div>
      </ContextMenuTrigger_Shadcn_>
      <ContextMenuContent_Shadcn_ onClick={(e) => e.stopPropagation()}>
        <ContextMenuItem_Shadcn_
          className="gap-x-2"
          onFocusCapture={(e) => e.stopPropagation()}
          onSelect={() => copyToClipboard(formattedValue)}
        >
          <Clipboard size={12} />
          <span>Copy {col.name.toLowerCase()}</span>
        </ContextMenuItem_Shadcn_>

        <ContextMenuItem_Shadcn_
          disabled={!jobname}
          onFocusCapture={(e) => e.stopPropagation()}
          onSelect={() => onSelectEdit(row)}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-x-2 w-full">
                <Edit size={12} />
                <span>Edit job</span>
              </div>
            </TooltipTrigger>
            {!jobname && (
              <TooltipContent side="right" className="w-56">
                This cron job doesn’t have a name and can’t be edited. Create a new one and delete
                this job.
              </TooltipContent>
            )}
          </Tooltip>
        </ContextMenuItem_Shadcn_>

        <ContextMenuSeparator_Shadcn_ />

        <ContextMenuItem_Shadcn_
          className="gap-x-2"
          onFocusCapture={(e) => e.stopPropagation()}
          onSelect={() => onSelectDelete(row)}
        >
          <Trash size={12} />
          <span>Delete job</span>
        </ContextMenuItem_Shadcn_>
      </ContextMenuContent_Shadcn_>
    </ContextMenu_Shadcn_>
  )
}
