import { ArrowRight, MessageSquare, NotebookText, SquareCode, type LucideIcon } from 'lucide-react'
import { Badge, Button } from 'ui'

import { useExplorerPreferences } from '@/components/interfaces/Account/Preferences/useExplorerPreferences'

const ONBOARDING_POINTS: Array<{ icon: LucideIcon; title: string; description: string }> = [
  {
    icon: SquareCode,
    title: 'Run SQL',
    description: 'Run any SQL on your database or query your logs, and chart the results.',
  },
  {
    icon: MessageSquare,
    title: 'Chat with your project',
    description: 'Ask Assistant to write queries, explain results, or build notebooks for you.',
  },
  {
    icon: NotebookText,
    title: 'Save to notebooks',
    description: 'Keep queries and notes for your team. Notebooks will replace snippets over time.',
  },
]

export const ExplorerOnboarding = () => {
  const { completeOnboarding, isReady } = useExplorerPreferences()

  return (
    <div className="flex h-full min-h-0 flex-col items-center overflow-y-auto bg-surface-100 px-6">
      <div className="my-auto w-full max-w-xl shrink-0 space-y-8 py-12">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h1 className="heading-section">Welcome to Explorer</h1>
            <Badge variant="default">Preview</Badge>
          </div>
          <p className="text-base leading-relaxed text-foreground-light">
            Interact with your database and logs in one place. Run SQL, chat with Assistant, or
            combine queries and notes in notebooks.
          </p>
        </div>

        <ul className="space-y-5">
          {ONBOARDING_POINTS.map(({ icon: Icon, title, description }) => (
            <li key={title} className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-surface-200">
                <Icon
                  size={20}
                  strokeWidth={1.5}
                  className="text-foreground-muted"
                  aria-hidden="true"
                />
              </div>
              <div className="space-y-0.5">
                <h2 className="text-sm text-foreground">{title}</h2>
                <p className="text-sm leading-relaxed text-foreground-light">{description}</p>
              </div>
            </li>
          ))}
        </ul>

        <Button
          variant="primary"
          iconRight={<ArrowRight />}
          onClick={completeOnboarding}
          disabled={!isReady}
        >
          Continue to Explorer
        </Button>
      </div>
    </div>
  )
}
