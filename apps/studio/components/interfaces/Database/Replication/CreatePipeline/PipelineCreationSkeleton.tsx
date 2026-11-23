import { RadioGroupStacked, RadioGroupStackedItem, Skeleton } from 'ui'

import { PIPELINE_CREATION_STEPS } from './PipelineCreationFlow.constants'
import { SteppedFlow, SteppedFlowHeader } from '@/components/ui/SteppedFlow/SteppedFlow'

export const PipelineCreationSkeleton = () => {
  const initialStep = PIPELINE_CREATION_STEPS[0]

  return (
    <SteppedFlow
      steps={PIPELINE_CREATION_STEPS}
      currentStep={initialStep.id}
      onStepChange={() => {}}
      onCancel={() => {}}
      nextLabel="Continue"
      navigationDisabled
    >
      <SteppedFlowHeader title={initialStep.title} description={initialStep.description()} />
      <div className="space-y-3 p-5" aria-busy="true" aria-label="Loading destinations">
        <p className="text-sm font-medium text-foreground">Destination type</p>
        <RadioGroupStacked disabled aria-hidden="true" className="pointer-events-none">
          {[0, 1, 2, 3].map((index) => (
            <RadioGroupStackedItem
              key={index}
              value={String(index)}
              className="opacity-100! [&>div]:items-center [&>div]:py-3.5"
              label={
                <span className="flex items-center gap-x-3.5">
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <span className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-40 sm:w-72" />
                  </span>
                </span>
              }
            />
          ))}
        </RadioGroupStacked>
      </div>
    </SteppedFlow>
  )
}
