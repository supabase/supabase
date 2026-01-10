import { Check, Circle, Loader2 } from 'lucide-react'
import { Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, cn } from 'ui'
import { BACKUP_STEP, DATABASE_UPGRADE_STEPS } from './UpgradingState.constants'

type UpgradeStepsTableProps =
  | {
      /**
       * Pre-upgrade view: all steps shown as pending
       */
      variant: 'pending'
    }
  | {
      /**
       * Active upgrade view: shows current progress through steps
       */
      variant: 'upgrading'
      progress: string | undefined
    }
  | {
      /**
       * Backing up view: all upgrade steps completed, backup step in progress
       */
      variant: 'backingUp'
    }
  | {
      /**
       * Completed view: all steps including backup shown as completed
       */
      variant: 'completed'
    }
  | {
      /**
       * Failed view: all steps shown as completed (project is back online)
       */
      variant: 'failed'
    }

export const UpgradeStepsTable = (props: UpgradeStepsTableProps) => {
  const { variant } = props

  const progress = variant === 'upgrading' ? props.progress : undefined
  const progressStage = progress ? Number(progress.split('_')[0]) : -1

  const isTerminalState = variant === 'completed' || variant === 'failed'
  const showProgress = variant === 'upgrading' || variant === 'backingUp' || isTerminalState
  const allUpgradeStepsCompleted = variant === 'backingUp' || isTerminalState

  // Only append backup step when actively backing up
  const steps =
    variant === 'backingUp' ? [...DATABASE_UPGRADE_STEPS, BACKUP_STEP] : DATABASE_UPGRADE_STEPS

  return (
    <Card>
      <Table>
        <TableHeader className="sr-only">
          <TableRow>
            <TableHead>Step</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="justify-end">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {steps.map((step, idx) => {
            const isBackupStep = step.key === BACKUP_STEP.key
            const isFirstStep = idx === 0

            // Show the first step as current immediately when upgrade starts (progress is undefined)
            // This is to give visual feedback that something is happening
            const isCurrentStep = isTerminalState
              ? false // No step is "current" in terminal states
              : isBackupStep
                ? variant === 'backingUp'
                : showProgress &&
                  !allUpgradeStepsCompleted &&
                  (step.key === progress || (progress === undefined && isFirstStep))

            const isCompletedStep = isTerminalState
              ? true // All steps are completed in terminal states
              : !isBackupStep && showProgress && (allUpgradeStepsCompleted || progressStage > idx)

            const statusText = 'offline' in step && step.offline ? 'Project offline' : null

            return (
              <TableRow
                key={step.key}
                className={cn(
                  '[&_td]:px-2.5 md:[&_td]:px-3 [&_td]:py-3 transition-colors duration-300',
                  (variant === 'upgrading' || variant === 'backingUp') &&
                    (isCurrentStep
                      ? // ? 'bg-inherit'
                        'bg-surface-75'
                      : isCompletedStep
                        ? 'bg-surface-200/50'
                        : 'bg-surface-75')
                )}
              >
                <TableCell className="border-r border-border w-1">
                  <div className="flex items-center justify-center">
                    <StepIndicator
                      isCurrentStep={isCurrentStep}
                      isCompletedStep={isCompletedStep}
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <p
                    className={cn(
                      'text-sm truncate transition-colors duration-300',
                      isCurrentStep
                        ? 'text-foreground'
                        : isCompletedStep
                          ? 'text-foreground-muted'
                          : showProgress
                            ? 'text-foreground-lighter'
                            : 'text-foreground'
                    )}
                  >
                    {/* Manual strike-through to ensure proper centering */}
                    <span
                      className={cn(
                        'relative inline-block leading-none after:content-[""] after:absolute after:left-0 after:right-0 after:top-[0.55em] after:h-[1.5px] after:bg-foreground-muted after:transition-opacity after:duration-300',
                        isCompletedStep && !isCurrentStep ? 'after:opacity-100' : 'after:opacity-0'
                      )}
                    >
                      {isCurrentStep ? step.activeTitle : step.staticTitle}
                    </span>
                  </p>
                </TableCell>
                <TableCell className="justify-end">
                  {statusText && (
                    <p
                      className={cn(
                        'text-sm text-foreground-muted text-right whitespace-nowrap',
                        isCompletedStep && !isCurrentStep
                          ? 'text-foreground-muted/50'
                          : 'text-foreground-muted'
                      )}
                    >
                      {statusText}
                    </p>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </Card>
  )
}

interface StepIndicatorProps {
  isCurrentStep: boolean
  isCompletedStep: boolean
}

const StepIndicator = ({ isCurrentStep, isCompletedStep }: StepIndicatorProps) => {
  if (isCurrentStep) {
    return (
      <div className="flex items-center justify-center w-5 h-5 rounded-full">
        <Loader2 size={20} className="animate-spin text-brand-link" strokeWidth={2} />
      </div>
    )
  }

  if (isCompletedStep) {
    return (
      <div className="flex items-center justify-center w-[18px] h-[18px] rounded-full bg-brand-500 dark:bg-brand">
        <Check size={12} className="text-contrast" strokeWidth={3} />
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center w-5 h-5 rounded-full">
      <Circle
        size={20}
        className="text-foreground-muted/50 dark:text-foreground-muted/75"
        strokeWidth={2}
      />
    </div>
  )
}
