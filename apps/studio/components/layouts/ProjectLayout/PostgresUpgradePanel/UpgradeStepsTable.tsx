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

export const UpgradeStepsTable = (props: UpgradeStepsTableProps) => {
  const { variant } = props

  const progress = variant === 'upgrading' ? props.progress : undefined
  const progressStage = Number((progress || '').split('_')[0])

  const showProgress = variant === 'upgrading' || variant === 'backingUp'
  const allUpgradeStepsCompleted = variant === 'backingUp'

  // Append backup step when in backingUp state
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
            const isCurrentStep = isBackupStep
              ? variant === 'backingUp'
              : showProgress && !allUpgradeStepsCompleted && step.key === progress
            const isCompletedStep =
              !isBackupStep && showProgress && (allUpgradeStepsCompleted || progressStage > idx)

            const statusText = 'offline' in step && step.offline ? 'Project offline' : null

            return (
              <TableRow
                key={step.key}
                className={cn(
                  '[&_td]:px-2.5 md:[&_td]:px-3 [&_td]:py-3 md:[&_td]:py-3.5',
                  isCurrentStep
                    ? 'bg-surface-75'
                    : isCompletedStep
                      ? 'bg-surface-200/50'
                      : 'bg-inherit'
                )}
              >
                <TableCell className="border-r border-border w-1">
                  <StepIndicator isCurrentStep={isCurrentStep} isCompletedStep={isCompletedStep} />
                </TableCell>
                <TableCell>
                  <p
                    className={cn(
                      'text-sm truncate',
                      isCurrentStep
                        ? 'text-foreground'
                        : isCompletedStep
                          ? 'text-foreground-muted'
                          : showProgress
                            ? 'text-foreground-lighter'
                            : 'text-foreground'
                    )}
                  >
                    {isCompletedStep && !isCurrentStep ? (
                      <span className="relative inline-block leading-none after:content-[''] after:absolute after:left-0 after:right-0 after:top-[0.55em] after:h-[1.5px] after:bg-foreground-muted">
                        {step.title}
                      </span>
                    ) : (
                      step.title
                    )}
                  </p>
                </TableCell>
                <TableCell className="justify-end">
                  {statusText && (
                    <p className="text-sm text-foreground-muted text-right whitespace-nowrap">
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
      <div className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-500 dark:bg-brand">
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
