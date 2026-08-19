import { type ReactNode } from 'react'
import { Button, cn } from 'ui'

export type SteppedFlowStep = {
  id: string
  label: string
  description?: string
}

export type SteppedFlowFinalAction = {
  label: string
  onClick?: () => void
  loading?: boolean
  disabled?: boolean
  form?: string
  type?: 'button' | 'submit'
}

export interface SteppedFlowProps {
  steps: SteppedFlowStep[]
  currentStep: string
  onStepChange: (stepId: string) => void
  nextDisabled?: boolean
  nextLabel?: string
  onNext?: () => void
  nextLoading?: boolean
  finalAction?: SteppedFlowFinalAction
  children: ReactNode
}

export const SteppedFlow = ({
  steps,
  currentStep,
  onStepChange,
  nextDisabled = false,
  nextLabel = 'Continue',
  onNext,
  nextLoading = false,
  finalAction,
  children,
}: SteppedFlowProps) => {
  const currentIndex = Math.max(
    0,
    steps.findIndex((step) => step.id === currentStep)
  )
  const isLastStep = currentIndex === steps.length - 1
  const currentStepLabel = steps[currentIndex]?.label

  return (
    <div className="flex min-h-full flex-col">
      <div className="mx-auto grid w-full max-w-[924px] flex-1 grid-cols-1 gap-6 px-6 pt-8 pb-10 lg:grid-cols-[minmax(0,760px)_140px]">
        <div className="min-w-0">
          <p className="mb-4 text-xs text-foreground-lighter lg:hidden">
            Step {currentIndex + 1} of {steps.length}
            {currentStepLabel ? ` · ${currentStepLabel}` : ''}
          </p>
          <main className="min-w-0">{children}</main>
          <footer
            className={cn(
              'mt-6 flex items-center border-t pt-4',
              currentIndex > 0 ? 'justify-between' : 'justify-end'
            )}
          >
            {currentIndex > 0 && (
              <Button
                type="button"
                variant="default"
                onClick={() => onStepChange(steps[currentIndex - 1].id)}
              >
                Back
              </Button>
            )}
            {isLastStep && finalAction ? (
              <Button
                type={finalAction.type ?? (finalAction.form ? 'submit' : 'button')}
                form={finalAction.form}
                variant="primary"
                loading={finalAction.loading}
                disabled={finalAction.disabled}
                onClick={finalAction.onClick}
              >
                {finalAction.label}
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                disabled={nextDisabled}
                loading={nextLoading}
                onClick={onNext}
              >
                {nextLabel}
              </Button>
            )}
          </footer>
        </div>

        <nav
          aria-label="Setup progress"
          className="sticky top-6 hidden h-fit flex-col gap-0.5 lg:flex"
        >
          {steps.map((step, index) => {
            const isCurrent = index === currentIndex
            const isComplete = index < currentIndex
            const isReachable = index <= currentIndex

            return (
              <button
                key={step.id}
                type="button"
                tabIndex={isReachable ? 0 : -1}
                aria-current={isCurrent ? 'step' : undefined}
                aria-label={
                  isCurrent
                    ? `Current step: ${step.label}`
                    : isComplete
                      ? `Go to completed step: ${step.label}`
                      : `${step.label}, not yet available`
                }
                disabled={!isReachable}
                onClick={() => {
                  if (!isReachable) return
                  onStepChange(step.id)
                }}
                className={cn(
                  'grid grid-cols-[12px_minmax(0,1fr)] items-start gap-2 rounded-md px-2 py-1.5 text-left',
                  isCurrent ? 'text-foreground' : 'text-foreground-light',
                  isReachable && 'hover:bg-surface-200 hover:text-foreground',
                  !isReachable && 'cursor-not-allowed opacity-60'
                )}
              >
                <span
                  className={cn(
                    'mt-1.5 h-2 w-2 rounded-full border',
                    isComplete && 'border-brand bg-brand',
                    isCurrent && !isComplete && 'border-foreground bg-foreground',
                    !isCurrent && !isComplete && 'border-foreground-muted bg-transparent'
                  )}
                />
                <span className="min-w-0">
                  <strong className="block text-sm font-medium">{step.label}</strong>
                  {step.description && (
                    <small className="block text-xs font-normal text-foreground-lighter">
                      {step.description}
                    </small>
                  )}
                </span>
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
