import { type ReactNode } from 'react'
import { Button, Card, cn } from 'ui'

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
      <div className="mx-auto w-full max-w-[760px] flex-1 px-6 pt-8 pb-10">
        <p className="mb-4 text-xs text-foreground-lighter">
          Step {currentIndex + 1} of {steps.length}
          {currentStepLabel ? ` · ${currentStepLabel}` : ''}
        </p>
        <Card key={currentStep} className="animate-in fade-in-0 duration-200">
          {children}
        </Card>
        <footer
          className={cn(
            'mt-6 flex items-center',
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
    </div>
  )
}
