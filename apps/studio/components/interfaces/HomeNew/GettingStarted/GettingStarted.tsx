import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'

import { cn, Button, Card, CardContent, CardHeader, CardTitle, Badge } from 'ui'

import { GettingStartedStep } from './GettingStartedSection'

export interface GettingStartedProps {
  steps: GettingStartedStep[]
}

export function GettingStarted({ steps }: GettingStartedProps) {
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

  if (!activeStep) {
    return null
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col lg:flex-row">
        <aside className="border-b border-border lg:border-b-0 lg:border-r lg:flex-none lg:basis-1/3 lg:max-w-sm bg-foreground/[.02]">
          <ol className="flex flex-col gap-1 p-4 md:p-6">
            {steps.map((step, index) => {
              const isActive = step.key === activeStep.key
              const isComplete = step.status === 'complete'

              return (
                <li key={step.key}>
                  <button
                    type="button"
                    onClick={() => setActiveStepKey(step.key)}
                    className={cn(
                      'group w-full rounded-md px-3 py-2 text-left transition-colors',
                      isActive
                        ? 'bg-foreground/[.06] text-foreground'
                        : 'hover:bg-foreground/[.04] text-foreground-light'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          'flex h-5 w-5 items-center justify-center rounded-full border',
                          isComplete
                            ? 'border-brand bg-brand/10 text-brand'
                            : 'border-foreground-muted text-foreground-muted'
                        )}
                        aria-hidden="true"
                      >
                        {isComplete ? <Check size={14} strokeWidth={2} /> : <span className="h-1.5 w-1.5 rounded-full bg-foreground-muted" />}
                      </span>
                      <div className="flex flex-col">
                        <span
                          className={cn(
                            'text-sm font-medium transition-colors',
                            isActive ? 'text-foreground' : 'group-hover:text-foreground'
                          )}
                        >
                          {index + 1}. {step.title}
                        </span>
                        <span className="text-xs uppercase tracking-wide text-foreground-muted">
                          {step.status}
                        </span>
                      </div>
                    </div>
                  </button>
                </li>
              )
            })}
          </ol>
        </aside>

        <div className="flex flex-1 flex-col">
          <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-border px-6 py-6">
            <div className="flex items-center gap-3">
              {activeStep.icon && <div className="text-foreground-muted">{activeStep.icon}</div>}
              <CardTitle className="text-foreground-light">
                {steps.findIndex((step) => step.key === activeStep.key) + 1}. {activeStep.title}
              </CardTitle>
            </div>
            <Badge
              variant={activeStep.status === 'complete' ? 'success' : 'default'}
              className="capitalize"
            >
              {activeStep.status}
            </Badge>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-6 p-6">
            <div className="flex flex-col gap-4">
              {activeStep.image && <div className="w-full">{activeStep.image}</div>}
              <p className="text-base text-foreground">{activeStep.description}</p>
            </div>
            <div className="mt-auto flex flex-wrap gap-2 pt-2">
              {activeStep.actions.map((action, i) => {
                if (action.component) {
                  return <div key={`${activeStep.key}-action-${i}`}>{action.component}</div>
                }

                if (action.href) {
                  return (
                    <Button
                      asChild
                      key={`${activeStep.key}-action-${i}`}
                      type={action.variant ?? 'default'}
                      icon={action.icon}
                      className="text-foreground-light hover:text-foreground"
                    >
                      <Link href={action.href}>{action.label}</Link>
                    </Button>
                  )
                }

                return (
                  <Button
                    key={`${activeStep.key}-action-${i}`}
                    type={action.variant ?? 'default'}
                    icon={action.icon}
                    onClick={action.onClick}
                    className="text-foreground-light hover:text-foreground"
                  >
                    {action.label}
                  </Button>
                )
              })}
            </div>
          </CardContent>
        </div>
      </div>
    </Card>
  )
}
