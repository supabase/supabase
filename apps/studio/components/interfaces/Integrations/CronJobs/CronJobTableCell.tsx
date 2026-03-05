import parser from 'cron-parser'
import { useDatabaseCronJobRunCommandMutation } from 'data/database-cron-jobs/database-cron-job-run-mutation'
import { CronJob } from 'data/database-cron-jobs/database-cron-jobs-infinite-query'
import { useDatabaseCronJobToggleMutation } from 'data/database-cron-jobs/database-cron-jobs-toggle-mutation'
import dayjs from 'dayjs'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Copy, Edit, Minus, MoreVertical, Play, Trash } from 'lucide-react'
import { parseAsString, useQueryState } from 'nuqs'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  Badge,
  Button,
  cn,
  CodeBlock,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Switch,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { TimestampInfo } from 'ui-patterns'

const getNextRun = (schedule: string, lastRun?: string) => {
  // cron-parser can only deal with the traditional cron syntax but technically users can also
  // use strings like "30 seconds" now, For the latter case, we try our best to parse the next run
  // (can't guarantee as scope is quite big)
  if (schedule.includes('*')) {
    try {
      const interval = parser.parseExpression(schedule, { tz: 'UTC' })
      return interval.next().getTime()
    } catch (error) {
      return undefined
    }
  } else {
    // [Joshen] Only going to attempt to parse if the schedule is as simple as "n second" or "n seconds"
    // Returned undefined otherwise - we can revisit this perhaps if we get feedback about this
    const [value, unit] = schedule.toLocaleLowerCase().split(' ')
    if (
      ['second', 'seconds'].includes(unit) &&
      !Number.isNaN(Number(value)) &&
      lastRun !== undefined
    ) {
      const parsedLastRun = dayjs(lastRun).add(Number(value), unit as dayjs.ManipulateType)
      return parsedLastRun.valueOf()
    } else {
      return undefined
    }
  }
}

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
  const [searchQuery] = useQueryState('search', parseAsString.withDefault(''))

  const [showToggleModal, setShowToggleModal] = useState(false)

  const value = row?.[col.id]
  const hasValue = col.id in row
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

  const { mutate: runCronJob, isPending: isRunning } = useDatabaseCronJobRunCommandMutation({
    onSuccess: () => {
      toast.success(`Command from "${jobname}" ran successfully`)
    },
  })

  const { mutate: toggleDatabaseCronJob, isPending: isToggling } = useDatabaseCronJobToggleMutation(
    {
      onSuccess: (_, vars) => {
        toast.success(`Successfully ${vars.active ? 'enabled' : 'disabled'} "${jobname}"`)
        setShowToggleModal(false)
      },
    }
  )

  const onRunCronJob = () => {
    runCronJob({
      projectRef: project?.ref!,
      connectionString: project?.connectionString,
      jobId: jobid,
    })
  }

  const onConfirmToggle = () => {
    toggleDatabaseCronJob({
      projectRef: project?.ref!,
      connectionString: project?.connectionString,
      jobId: jobid,
      active: !active,
      searchTerm: searchQuery,
    })
  }

  if (col.id === 'actions') {
    return (
      <div className="flex items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="text"
              loading={isRunning}
              className="h-6 w-6"
              icon={<MoreVertical />}
              onClick={(e) => e.stopPropagation()}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 space-y-1">
            <Tooltip>
              <TooltipTrigger className="w-full">
                <DropdownMenuItem
                  className="gap-x-2"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRunCronJob()
                  }}
                >
                  <Play size={12} />
                  Run command
                </DropdownMenuItem>
              </TooltipTrigger>
              <TooltipContent>
                Manual runs execute the command immediately and will not appear in the cron jobs
                table.
              </TooltipContent>
            </Tooltip>
            <DropdownMenuItem
              className="gap-x-2"
              onClick={(e) => {
                e.stopPropagation()
                onSelectEdit(row)
              }}
            >
              <Edit size={12} />
              Edit job
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-x-2"
              onClick={(e) => {
                e.stopPropagation()
                onSelectDelete(row)
              }}
            >
              <Trash size={12} />
              Delete job
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
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
            !hasValue ? (
              <Minus size={14} className="text-foreground-lighter" />
            ) : col.id === 'latest_run' && formattedValue === null ? (
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
          ) : col.id === 'command' ? (
            <HoverCard openDelay={0} closeDelay={0}>
              <HoverCardTrigger asChild>
                <div className="text-xs font-mono w-full h-full flex items-center">
                  {formattedValue}
                </div>
              </HoverCardTrigger>
              <HoverCardContent
                align="end"
                className="p-0 w-[400px]"
                onClick={(e) => e.stopPropagation()}
              >
                <p className="text-xs font-mono px-2 py-1 border-b">Command</p>
                <CodeBlock
                  hideLineNumbers
                  language="sql"
                  value={formattedValue.trim()}
                  className={cn(
                    'py-0 px-3.5 max-w-full prose dark:prose-dark border-0 rounded-t-none',
                    '[&>code]:m-0 [&>code>span]:flex [&>code>span]:flex-wrap min-h-11',
                    '[&>code]:text-xs'
                  )}
                />
              </HoverCardContent>
            </HoverCard>
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
          <Copy size={12} />
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
