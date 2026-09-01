import { type ReactNode } from 'react'
import { Button, Card, CardFooter, CardHeader, cn } from 'ui'

export type SteppedFlowStep = {
  id: string
  label: string
}

export type SteppedFlowFinalAction = {
  label: string
  onClick?: () => void
  loading?: boolean
  disabled?: boolean
  form?: string
  type?: 'button' | 'submit'
}

export const SteppedFlowHeader = ({
  title,
  description,
  actions,
  children,
}: {
  title: string
  description?: ReactNode
  actions?: ReactNode
  children?: ReactNode
}) => {
  return (
    <CardHeader>
      <header className="flex flex-col space-y-1">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-1">
            <h2 className="text-lg text-foreground">{title}</h2>
            {description ? <p className="text-sm text-foreground-light">{description}</p> : null}
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
        {children}
      </header>
    </CardHeader>
  )
}

export interface SteppedFlowProps {
  steps: SteppedFlowStep[]
  currentStep: string
  onStepChange: (stepId: string) => void
  nextDisabled?: boolean
  nextLabel?: string
  onNext?: () => void
  nextLoading?: boolean
  navigationDisabled?: boolean
  onCancel?: () => void
  cancelLabel?: string
  finalAction?: SteppedFlowFinalAction
  children: ReactNode
}

export const SteppedFlow = ({
  steps,
  currentStep,
  onStepChange,
  nextDisabled = false,
  nextLabel = 'Next',
  onNext,
  nextLoading = false,
  navigationDisabled = false,
  onCancel,
  cancelLabel = 'Cancel',
  finalAction,
  children,
}: SteppedFlowProps) => {
  const currentIndex = Math.max(
    0,
    steps.findIndex((step) => step.id === currentStep)
  )
  const stepCount = steps.length
  const isLastStep = stepCount > 0 && currentIndex === stepCount - 1
  const isFirstStep = currentIndex === 0
  const currentStepLabel = steps[currentIndex]?.label
  const showCancel = isFirstStep && !!onCancel
  const nextStepId = steps[currentIndex + 1]?.id

  const handleNext = () => {
    if (onNext) {
      onNext()
      return
    }

    if (nextStepId) {
      onStepChange(nextStepId)
    }
  }

  if (stepCount === 0) {
    return null
  }

  return (
    <div className="flex min-h-full flex-col">
      <div className="mx-auto w-full max-w-[760px] flex-1 px-6 pt-8 pb-10">
        <p className="mb-4 text-xs text-foreground-lighter" role="status">
          Step {currentIndex + 1} of {stepCount}
          {currentStepLabel ? ` · ${currentStepLabel}` : ''}
        </p>
        <Card
          key={currentStep}
          className="animate-in fade-in-0 duration-200 motion-reduce:animate-none"
        >
          {children}
          <CardFooter
            className={cn(currentIndex > 0 || showCancel ? 'justify-between' : 'justify-end')}
          >
            {currentIndex > 0 ? (
              <Button
                type="button"
                variant="default"
                disabled={navigationDisabled}
                onClick={() => onStepChange(steps[currentIndex - 1].id)}
              >
                Back
              </Button>
            ) : null}
            {currentIndex === 0 && showCancel ? (
              <Button
                type="button"
                variant="default"
                disabled={navigationDisabled}
                onClick={onCancel}
              >
                {cancelLabel}
              </Button>
            ) : null}
            <div className="flex items-center gap-2">
              {isLastStep && finalAction ? (
                <Button
                  type={finalAction.type ?? (finalAction.form ? 'submit' : 'button')}
                  form={finalAction.form}
                  variant="primary"
                  loading={finalAction.loading}
                  disabled={navigationDisabled || finalAction.disabled}
                  onClick={finalAction.onClick}
                >
                  {finalAction.label}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  disabled={navigationDisabled || nextDisabled || !nextStepId}
                  loading={nextLoading}
                  onClick={handleNext}
                >
                  {nextLabel}
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
