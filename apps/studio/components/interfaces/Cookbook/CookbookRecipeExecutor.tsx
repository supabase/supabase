import { useEffect, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { InputStep } from './steps/InputStep'
import { SqlStep } from './steps/SqlStep'
import { EdgeFunctionStep } from './steps/EdgeFunctionStep'
import { EnvStep } from './steps/EnvStep'
import type { CookbookRecipe, RecipeContext } from 'types/cookbook'
import { cn } from 'ui'

interface CookbookRecipeExecutorProps {
  recipe: CookbookRecipe
  projectRef: string
  connectionString?: string | null
}

export function CookbookRecipeExecutor({
  recipe,
  projectRef,
  connectionString,
}: CookbookRecipeExecutorProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [context, setContext] = useState<RecipeContext>({})
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const stepRefs = useRef<(HTMLDivElement | null)[]>([])

  const handleStepComplete = (stepIndex: number, outputs?: Record<string, any>) => {
    // Add outputs to context
    if (outputs) {
      setContext((prev) => ({ ...prev, ...outputs }))
    }

    // Mark step as completed
    setCompletedSteps((prev) => new Set(prev).add(stepIndex))

    // Move to next step and scroll to it
    const nextStepIndex = stepIndex + 1
    if (nextStepIndex < recipe.steps.length) {
      setCurrentStepIndex(nextStepIndex)
    }
  }

  // Scroll to current step when it changes
  useEffect(() => {
    if (stepRefs.current[currentStepIndex]) {
      stepRefs.current[currentStepIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }
  }, [currentStepIndex])

  const renderStep = (step: (typeof recipe.steps)[0], stepIndex: number) => {
    const isActive = stepIndex === currentStepIndex
    const isCompleted = completedSteps.has(stepIndex)
    const isDisabled = stepIndex > currentStepIndex

    const commonProps = {
      isActive,
      isCompleted,
      isDisabled,
    }

    switch (step.type) {
      case 'input':
        return (
          <InputStep
            step={step}
            context={context}
            onComplete={(outputs) => handleStepComplete(stepIndex, outputs)}
            {...commonProps}
          />
        )

      case 'sql':
        return (
          <SqlStep
            step={step}
            context={context}
            projectRef={projectRef}
            connectionString={connectionString}
            onComplete={(outputs) => handleStepComplete(stepIndex, outputs)}
            {...commonProps}
          />
        )

      case 'edge_function':
        return (
          <EdgeFunctionStep
            step={step}
            context={context}
            projectRef={projectRef}
            onComplete={(outputs) => handleStepComplete(stepIndex, outputs)}
            {...commonProps}
          />
        )

      case 'env':
        return (
          <EnvStep
            step={step}
            context={context}
            projectRef={projectRef}
            connectionString={connectionString}
            onComplete={() => handleStepComplete(stepIndex)}
            {...commonProps}
          />
        )

      default:
        return <div>Unknown step type</div>
    }
  }

  const isRecipeComplete = completedSteps.size === recipe.steps.length

  return (
    <PageLayout title={recipe.title} subtitle={recipe.description} size="small">
      <ScaffoldContainer size="small">
        <ScaffoldSection isFullWidth>
          {recipe.steps.map((step, index) => {
            const isActive = index === currentStepIndex
            const isCompleted = completedSteps.has(index)
            const isLastStep = index === recipe.steps.length - 1

            return (
              <div
                key={index}
                ref={(el) => {
                  stepRefs.current[index] = el
                }}
                className={cn(
                  'flex gap-6',
                  isActive ? 'opacity-100' : 'opacity-50 pointer-events-none'
                )}
              >
                {/* Step number with connecting line */}
                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      'text-xs shrink-0 font-mono text-foreground-light w-7 h-7 bg border flex items-center justify-center rounded-md'
                    )}
                  >
                    {isCompleted ? (
                      <Check size={16} strokeWidth={1.5} className="text-brand" />
                    ) : (
                      index + 1
                    )}
                  </span>
                  {!isLastStep && <div className="w-px bg-border flex-1 h-full mt-2" />}
                </div>

                {/* Step content */}
                <div className="flex-1 min-w-0 pb-10">{renderStep(step, index)}</div>
              </div>
            )
          })}

          {/* Completion message */}
          {isRecipeComplete && (
            <div>
              <div className="flex gap-4">
                {/* Empty spacer to align with step content */}
                <div className="w-7 shrink-0" />

                <div className="flex-1 min-w-0">
                  <div className="bg-brand-200 border border-brand-400 rounded-md p-6">
                    <h3 className="text-lg font-medium text-brand-600 mb-2">Recipe Complete!</h3>
                    <p className="text-sm text-brand-600">
                      All steps have been executed successfully. Your {recipe.title.toLowerCase()}{' '}
                      setup is now ready to use.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </ScaffoldSection>
      </ScaffoldContainer>
    </PageLayout>
  )
}
