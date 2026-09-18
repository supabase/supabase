import {
  ArrowRight,
  Compass,
  MessageSquare,
  NotebookText,
  SquareCode,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'
import { Badge, Button, cn } from 'ui'

import { useExplorerPreferences } from '@/components/interfaces/Account/Preferences/useExplorerPreferences'

const ONBOARDING_STEPS: Array<{
  icon: LucideIcon
  title: string
  description: string
  isPreview?: boolean
}> = [
  {
    icon: Compass,
    title: 'Welcome to Explorer',
    description:
      'Interact with your database and logs in one place. Run SQL, save your work to notebooks, and chat with Assistant.',
    isPreview: true,
  },
  {
    icon: SquareCode,
    title: 'Run SQL',
    description:
      'Run any SQL on your database, just like in the SQL Editor. You can also query your logs and chart the results.',
  },
  {
    icon: NotebookText,
    title: 'Notebooks',
    description:
      'Save queries alongside notes and context so you, your team, or Assistant can run them later. Notebooks will replace snippets over time.',
  },
  {
    icon: MessageSquare,
    title: 'Chat with your project',
    description:
      'Ask Assistant to write queries, explain results, or build notebooks for you. Your organization’s AI settings control what it can access.',
  },
]

export const ExplorerOnboarding = () => {
  const { completeOnboarding, isReady } = useExplorerPreferences()
  const [stepIndex, setStepIndex] = useState(0)

  const step = ONBOARDING_STEPS[stepIndex]
  const isFirstStep = stepIndex === 0
  const isLastStep = stepIndex === ONBOARDING_STEPS.length - 1
  const Icon = step.icon

  return (
    <div className="flex h-full min-h-0 flex-col items-center overflow-y-auto bg-surface-100 px-6">
      <div className="my-auto w-full max-w-xl shrink-0 space-y-8 py-12">
        <div aria-live="polite" className="min-h-40 space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-md border bg-surface-200">
            <Icon
              size={24}
              strokeWidth={1.5}
              className="text-foreground-muted"
              aria-hidden="true"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h1 className="heading-section">{step.title}</h1>
              {step.isPreview && <Badge variant="default">Preview</Badge>}
            </div>
            <p className="text-base leading-relaxed text-foreground-light">{step.description}</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="sr-only">
              Step {stepIndex + 1} of {ONBOARDING_STEPS.length}
            </span>
            {ONBOARDING_STEPS.map(({ title }, index) => (
              <span
                key={title}
                aria-hidden="true"
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  index === stepIndex ? 'w-4 bg-foreground' : 'w-1.5 bg-border-stronger'
                )}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {!isFirstStep && (
              <Button type="button" variant="default" onClick={() => setStepIndex(stepIndex - 1)}>
                Back
              </Button>
            )}
            {isLastStep ? (
              <Button
                type="button"
                variant="primary"
                iconRight={<ArrowRight />}
                onClick={completeOnboarding}
                disabled={!isReady}
              >
                Continue to Explorer
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                iconRight={<ArrowRight />}
                onClick={() => setStepIndex(stepIndex + 1)}
              >
                Next
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
