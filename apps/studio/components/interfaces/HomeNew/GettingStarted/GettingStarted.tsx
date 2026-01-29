import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { BASE_PATH } from 'lib/constants'
import { Badge, Button, Card, CardContent, cn, IconDiscord } from 'ui'
import { GettingStartedAction, GettingStartedStep } from './GettingStarted.types'

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
  const allStepsComplete = steps.length > 0 && steps.every((step) => step.status === 'complete')
  const [activeStepKey, setActiveStepKey] = useState<string | null>(null)

  useEffect(() => {
    if (steps.length === 0) {
      setActiveStepKey(null)
      return
    }

    // Check if the current active step key is still valid in the new steps array
    const isActiveStepValid = activeStepKey && steps.some((step) => step.key === activeStepKey)

    // If no step is selected or the active step is no longer valid (e.g., after tab switch)
    if (!isActiveStepValid) {
      // If all steps are complete, don't select any step
      if (allStepsComplete) {
        setActiveStepKey(null)
      } else {
        // Select the first incomplete step, or the first step if all are complete
        const firstIncompleteStep = steps.find((step) => step.status !== 'complete')
        setActiveStepKey(firstIncompleteStep?.key ?? steps[0]?.key ?? null)
      }
    }
  }, [steps, allStepsComplete, activeStepKey])

  const activeStep = activeStepKey ? steps.find((step) => step.key === activeStepKey) : null
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

  const showCongratulations = allStepsComplete && !activeStep

  return (
    <Card className="overflow-hidden @container">
      <div className="flex flex-col @2xl:flex-row">
        <aside className="hidden border-r @2xl:block @2xl:w-[calc(1/3*100%-16px)]">
          <ol>
            {steps.map((step, index) => {
              const isActive = activeStep ? step.key === activeStep.key : false
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
                          <Check size={16} strokeWidth={1.5} className="text-brand-link" />
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
          {showCongratulations ? (
            <div className="relative w-full flex-1 min-h-[100px] shrink-0 overflow-hidden bg-200 flex flex-col justify-end">
              <div className="p-10">
                <div className="w-8 h-8 rounded-md bg-brand/15 flex items-center justify-center shrink-0 mb-4">
                  <Check size={16} strokeWidth={1.5} className="text-brand-link" />
                </div>
                <div className="flex flex-row items-center gap-4 mb-1">
                  <h3>All steps complete</h3>
                </div>
                <p className="text-foreground-light max-w-prose mb-4 text-balance">
                  Drop into our Discord community to share your progress and learn from fellow
                  developers.
                </p>

                <Button
                  asChild
                  type="default"
                  icon={<IconDiscord size={14} />}
                  className="text-foreground-light hover:text-foreground"
                >
                  <Link href={'https://discord.supabase.com/'} target="_blank">
                    Join our Discord
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2 border-b px-2 py-2 @2xl:hidden">
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
                {activeStep?.image ? (
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
                {activeStep && (
                  <>
                    <div className="flex flex-row items-center gap-4 mb-1">
                      <h3>{activeStep.title}</h3>
                      <Badge
                        variant={activeStep.status === 'complete' ? 'success' : 'default'}
                        className="capitalize hidden @2xl:inline-flex"
                      >
                        {activeStep.status}
                      </Badge>
                    </div>
                    <p className="text-foreground-light max-w-prose mb-4 text-balance">
                      {activeStep.description}
                    </p>
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
                  </>
                )}
              </div>
            </>
          )}
        </CardContent>
      </div>
    </Card>
  )
}
