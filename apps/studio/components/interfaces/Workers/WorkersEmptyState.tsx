import { Terminal } from 'lucide-react'
import { Button, Card } from 'ui'

import { WorkerCommandLine } from './WorkerCommandLine'
import { WORKERS_CLI_DEPLOY } from '@/lib/constants/workers'

interface WorkersEmptyStateProps {
  onDeploy: () => void
}

const STEPS = [
  {
    title: 'Detects your stack',
    description:
      'The CLI inspects your project and picks the right runtime — Node, Deno, Bun, Python, or your Dockerfile.',
  },
  {
    title: 'Builds & schedules',
    description:
      'Your worker is built and scheduled onto a microVM in US West, right next to your database.',
  },
  {
    title: 'Shows up here',
    description: 'The worker and its state appear on this page once the build finishes.',
  },
]

export const WorkersEmptyState = ({ onDeploy }: WorkersEmptyStateProps) => (
  <Card className="grid grid-cols-1 divide-y divide-default lg:grid-cols-[1.6fr_1fr] lg:divide-x lg:divide-y-0">
    <div className="flex flex-col gap-6 p-8">
      <div className="space-y-2">
        <h3 className="text-lg text-foreground">Deploy a worker</h3>
        <p className="max-w-md text-sm text-foreground-light">
          No workers yet. Run managed compute in microVMs next to your database. Deploy your first
          worker with the Supabase CLI.
        </p>
      </div>

      <div>
        <Button variant="primary" icon={<Terminal />} onClick={onDeploy}>
          Deploy a worker
        </Button>
      </div>

      <ol className="space-y-5">
        {STEPS.map((step, index) => (
          <li key={step.title} className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-strong text-xs text-foreground-light">
              {index + 1}
            </span>
            <div className="space-y-0.5">
              <p className="text-sm text-foreground">{step.title}</p>
              <p className="max-w-md text-sm text-foreground-lighter">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>

    <div className="flex flex-col gap-4 p-8">
      <p className="text-xs font-mono uppercase tracking-wider text-foreground-lighter">
        Deploy from the terminal
      </p>
      <div className="rounded-md border border-default bg-surface-100 px-3 py-2">
        <WorkerCommandLine command={WORKERS_CLI_DEPLOY} />
      </div>
    </div>
  </Card>
)
