import { ArrowLeft, ArrowRight } from 'lucide-react'
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
  title: string
  description?: string
  backLabel: string
  backHref?: string
  steps: SteppedFlowStep[]
  currentStep: string
  onStepChange: (stepId: string) => void
  onCancel: () => void
  nextDisabled?: boolean
  nextLabel?: string
  onNext?: () => void
  nextLoading?: boolean
  finalAction?: SteppedFlowFinalAction
  children: ReactNode
}

export const SteppedFlow = ({
  title,
  description,
  backLabel,
  backHref,
  steps,
  currentStep,
  onStepChange,
  onCancel,
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
      <header className="flex flex-col gap-4 border-b px-6 py-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          {backHref ? (
            <a
              href={backHref}
              tabIndex={0}
              className="mb-2 flex items-center gap-1.5 text-sm text-foreground-light hover:text-foreground"
              onClick={(event) => {
                event.preventDefault()
                onCancel()
              }}
            >
              <ArrowLeft size={14} />
              {backLabel}
            </a>
          ) : (
            <button
              type="button"
              tabIndex={0}
              className="mb-2 flex items-center gap-1.5 text-sm text-foreground-light hover:text-foreground"
              onClick={onCancel}
            >
              <ArrowLeft size={14} />
              {backLabel}
            </button>
          )}
          <h1 className="text-xl text-foreground">{title}</h1>
          {description && <p className="max-w-xl text-sm text-foreground-light">{description}</p>}
        </div>
        <Button type="button" onClick={onCancel}>
          Cancel
        </Button>
      </header>

      <div className="mx-auto grid w-full max-w-[924px] flex-1 grid-cols-1 gap-6 px-6 pt-8 pb-10 lg:grid-cols-[minmax(0,760px)_140px]">
        <div className="min-w-0">
          <p className="mb-4 text-xs text-foreground-lighter lg:hidden">
            Step {currentIndex + 1} of {steps.length}
            {currentStepLabel ? ` · ${currentStepLabel}` : ''}
          </p>
          <main className="min-w-0">{children}</main>
          <footer className="mt-6 flex items-center justify-between border-t pt-4">
            <Button
              type="button"
              icon={<ArrowLeft size={14} />}
              disabled={currentIndex === 0}
              onClick={() => {
                if (currentIndex === 0) return
                onStepChange(steps[currentIndex - 1].id)
              }}
            >
              Back
            </Button>
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
                <ArrowRight size={14} />
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
