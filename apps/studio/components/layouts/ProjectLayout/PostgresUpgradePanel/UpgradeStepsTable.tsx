import { Check, Circle, Loader2 } from 'lucide-react'
import { Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, cn } from 'ui'
import { DATABASE_UPGRADE_STEPS } from './UpgradingState.constants'

interface UpgradeStepsTableProps {
  /**
   * Current progress step (if actively upgrading)
   * When undefined, all steps are shown as pending
   */
  progress?: string
  /**
   * Whether to show progress indicators
   * false = all steps pending (pre-upgrade view)
   * true = show current/completed step indicators
   */
  showProgress: boolean
}

export const UpgradeStepsTable = ({ progress, showProgress }: UpgradeStepsTableProps) => {
  const progressStage = Number((progress || '').split('_')[0])

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
          {DATABASE_UPGRADE_STEPS.map((step, idx: number) => {
            const isCurrentStep = showProgress && step.key === progress
            const isCompletedStep = showProgress && progressStage > idx

            return (
              <TableRow
                key={step.key}
                className={cn(
                  // Tighten up child cell padding
                  '[&_td]:px-2.5 md:[&_td]:px-3 [&_td]:py-3 md:[&_td]:py-3.5',
                  // Handle conditional row background color
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
                  {step.offline && (
                    <p className="text-sm text-foreground-muted text-right whitespace-nowrap">
                      Project offline
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
