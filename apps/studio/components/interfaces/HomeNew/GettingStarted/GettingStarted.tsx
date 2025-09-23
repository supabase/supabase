import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { BASE_PATH } from 'lib/constants'
import { Badge, Button, Card, CardContent, cn } from 'ui'
import { GettingStartedAction, GettingStartedStep } from './GettingStartedSection'

// Determine action type for tracking
const getActionType = (action: GettingStartedAction): 'primary' | 'ai_assist' | 'external_link' => {
  // Check if it's an AI assist action (has AiIconAnimation or "Do it for me"/"Generate" labels)
  if (
    action.label?.toLowerCase().includes('do it for me') ||
    action.label?.toLowerCase().includes('generate') ||
    action.label?.toLowerCase().includes('create policies for me')
  ) {
    return 'ai_assist'
  }
  // Check if it's an external link (href that doesn't start with /project/)
  if (action.href && !action.href.startsWith('/project/')) {
    return 'external_link'
  }
  return 'primary'
}

export interface GettingStartedProps {
  steps: GettingStartedStep[]
  onStepClick: ({
    stepIndex,
    stepTitle,
    actionType,
    wasCompleted,
  }: {
    stepIndex: number
    stepTitle: string
    actionType: 'primary' | 'ai_assist' | 'external_link'
    wasCompleted: boolean
  }) => void
}

export function GettingStarted({ steps, onStepClick }: GettingStartedProps) {
  const [activeStepKey, setActiveStepKey] = useState<string | null>(steps[0]?.key ?? null)

  useEffect(() => {
    if (steps.length === 0) {
      setActiveStepKey(null)
      return
    }

    const hasActiveStep = activeStepKey ? steps.some((step) => step.key === activeStepKey) : false

    if (!hasActiveStep) {
      setActiveStepKey(steps[0]?.key ?? null)
    }
  }, [steps, activeStepKey])

  const activeStep = steps.find((step) => step.key === activeStepKey) ?? steps[0]
  const activeStepIndex = activeStep ? steps.findIndex((step) => step.key === activeStep.key) : -1
  const previousStep = activeStepIndex > 0 ? steps[activeStepIndex - 1] : null
  const nextStep =
    activeStepIndex > -1 && activeStepIndex < steps.length - 1 ? steps[activeStepIndex + 1] : null

  const handleSelectPrevious = () => {
    if (previousStep) {
      setActiveStepKey(previousStep.key)
    }
  }

  const handleSelectNext = () => {
    if (nextStep) {
      setActiveStepKey(nextStep.key)
    }
  }

  if (!activeStep) {
    return null
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col lg:flex-row">
        <aside className="hidden border-r lg:block lg:w-[calc(1/3*100%-16px)]">
          <ol>
            {steps.map((step, index) => {
              const isActive = step.key === activeStep.key
              const isComplete = step.status === 'complete'

              return (
                <li key={step.key} className="border-b last:border-b-0 truncate">
                  <Button
                    type="text"
                    onClick={() => setActiveStepKey(step.key)}
                    className={cn(
                      'pl-1 block justify-start w-full rounded-none h-auto text-left text-foreground-light',
                      isActive && 'bg-muted text-foreground'
                    )}
                  >
                    <div className="flex items-center gap-3 text-sm w-full">
                      <span
                        className={cn(
                          'text-xs shrink-0 font-mono text-foreground-light w-7 h-7 bg border flex items-center justify-center rounded-md'
                        )}
                      >
                        {isComplete ? (
                          <Check size={16} strokeWidth={1.5} className="text-brand" />
                        ) : (
                          index + 1
                        )}
                      </span>
                      <span
                        className={cn(
                          'flex-1 block truncate',
                          isActive ? 'text-foreground' : 'group-hover:text-foreground',
                          isComplete && 'line-through'
                        )}
                      >
                        {step.title}
                      </span>
                      <ChevronRight
                        size={16}
                        strokeWidth={1.5}
                        className="text-foreground-lighter"
                      />
                    </div>
                  </Button>
                </li>
              )
            })}
          </ol>
        </aside>

        <CardContent className="flex flex-1 flex-col gap-0 p-0 overflow-y-auto border-b-0">
          <div className="flex items-center justify-between gap-2 border-b px-2 py-2 lg:hidden">
            <span className="text-xs shrink-0 font-mono text-foreground-light w-7 h-7 bg border flex items-center justify-center rounded-md">
              {activeStepIndex + 1}
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="outline"
                onClick={handleSelectPrevious}
                disabled={!previousStep}
                className="gap-2"
                aria-label="Previous step"
              >
                <ChevronLeft size={16} strokeWidth={1.5} />
              </Button>
              <Button
                type="outline"
                onClick={handleSelectNext}
                disabled={!nextStep}
                className="gap-2"
                aria-label="Next step"
              >
                <ChevronRight size={16} strokeWidth={1.5} />
              </Button>
            </div>
          </div>
          <div className="relative w-full flex-1 min-h-[100px] shrink-0 overflow-hidden">
            {activeStep.image ? (
              <Image
                className="w-full select-none invert dark:invert-0"
                src={activeStep.image}
                fill
                objectFit="cover"
                objectPosition="top"
                alt={activeStep.title}
              />
            ) : (
              <div className="absolute top-0 left-0 right-0 overflow-hidden">
                <img
                  src={`${BASE_PATH}/img/reports/bg-grafana-dark.svg`}
                  alt="Supabase Grafana"
                  className="w-full h-full object-cover object-right hidden dark:block user-select-none"
                />
                <img
                  src={`${BASE_PATH}/img/reports/bg-grafana-light.svg`}
                  alt="Supabase Grafana"
                  className="w-full h-full object-cover object-right dark:hidden user-select-none"
                />
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background-surface-100 to-transparent" />
          </div>
          <div className="p-10">
            <div className="flex flex-row items-center gap-4 mb-1">
              <h3>{activeStep.title}</h3>
              <Badge
                variant={activeStep.status === 'complete' ? 'success' : 'default'}
                className="capitalize hidden lg:inline-flex"
              >
                {activeStep.status}
              </Badge>
            </div>
            <p className="text-foreground-light max-w-prose mb-4">{activeStep.description}</p>
            <div className="mt-auto flex flex-wrap gap-2 pt-2">
              {activeStep.actions.map((action, i) => {
                if (action.component) {
                  return <div key={`${activeStep.key}-action-${i}`}>{action.component}</div>
                }

                const actionType = getActionType(action)

                if (action.href) {
                  return (
                    <Button
                      asChild
                      key={`${activeStep.key}-action-${i}`}
                      type={action.variant ?? 'default'}
                      icon={action.icon}
                      className="text-foreground-light hover:text-foreground"
                    >
                      <Link
                        href={action.href}
                        onClick={() => {
                          onStepClick({
                            stepIndex: activeStepIndex,
                            stepTitle: activeStep.title,
                            actionType,
                            wasCompleted: activeStep.status === 'complete',
                          })
                        }}
                      >
                        {action.label}
                      </Link>
                    </Button>
                  )
                }

                return (
                  <Button
                    key={`${activeStep.key}-action-${i}`}
                    type={action.variant ?? 'default'}
                    icon={action.icon}
                    onClick={() => {
                      action.onClick?.()
                      onStepClick({
                        stepIndex: activeStepIndex,
                        stepTitle: activeStep.title,
                        actionType,
                        wasCompleted: activeStep.status === 'complete',
                      })
                    }}
                    className="text-foreground-light hover:text-foreground"
                  >
                    {action.label}
                  </Button>
                )
              })}
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  )
}
