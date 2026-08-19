import { Plus, Sparkles, Terminal } from 'lucide-react'
import { Button, Card } from 'ui'

import CopyButton from '@/components/ui/CopyButton'
import { WORKERS_CLI_DEPLOY, WORKERS_SKILL_MARKDOWN } from '@/lib/constants/workers'

interface WorkersEmptyStateProps {
  onDeploy: () => void
  onCreate: () => void
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
    title: 'Streams back here',
    description: 'Lifecycle events and logs stream to Logflare and show up on this page.',
  },
]

export const WorkersEmptyState = ({ onDeploy, onCreate }: WorkersEmptyStateProps) => (
  <Card className="grid grid-cols-1 divide-y divide-default lg:grid-cols-[1.6fr_1fr] lg:divide-x lg:divide-y-0">
    <div className="flex flex-col gap-6 p-8">
      <div className="space-y-2">
        <h3 className="text-lg text-foreground">Deploy a worker</h3>
        <p className="max-w-md text-sm text-foreground-light">
          No workers yet. Run managed compute in microVMs next to your database. Deploy from the
          dashboard, or push your own code with the Supabase CLI.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="primary" icon={<Plus />} onClick={onCreate}>
          New worker
        </Button>
        <Button variant="default" icon={<Terminal />} onClick={onDeploy}>
          Deploy with CLI
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
        Prefer the CLI?
      </p>
      <div className="rounded-md border border-default bg-surface-100 px-3 py-2 font-mono text-sm text-foreground-light">
        {WORKERS_CLI_DEPLOY}
      </div>

      <div className="space-y-2 rounded-md border border-default p-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-foreground">SKILL.md</span>
          <span className="inline-flex items-center gap-1 rounded-full border border-strong px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-foreground-lighter">
            <Sparkles size={10} /> For agents
          </span>
        </div>
        <p className="text-sm text-foreground-lighter">
          Drop a skill file into your agent so it can deploy and manage workers for you.
        </p>
        <div className="flex items-center gap-3 pt-1">
          <CopyButton text={WORKERS_SKILL_MARKDOWN} variant="default" size="tiny">
            Copy SKILL.md
          </CopyButton>
        </div>
      </div>
    </div>
  </Card>
)
