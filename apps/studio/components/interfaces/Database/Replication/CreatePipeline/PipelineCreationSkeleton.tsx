import { Skeleton } from 'ui'

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
        <div className="overflow-hidden rounded-md border" aria-hidden="true">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className="flex items-center gap-3 border-b px-[21px] py-3.5 last:border-b-0"
            >
              <Skeleton className="h-4 w-4 rounded-full" />
              <div className="flex flex-1 items-center gap-3.5">
                <Skeleton className="h-8 w-8 rounded-md" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-3/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SteppedFlow>
  )
}
