import { ArrowRight, Check, Copy, Plus, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { Button, Card, cn, copyToClipboard } from 'ui'

import {
  WORKERS_CLI_DEPLOY,
  WORKERS_DOCS_URL,
  WORKERS_SKILL_MARKDOWN,
} from '@/lib/constants/workers'

interface WorkersEmptyStateProps {
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

export const WorkersEmptyState = ({ onCreate }: WorkersEmptyStateProps) => {
  const [isCopied, setIsCopied] = useState(false)

  const handleCopySkill = () => {
    setIsCopied(true)
    copyToClipboard(WORKERS_SKILL_MARKDOWN)
    setTimeout(() => setIsCopied(false), 2000)
  }

  return (
    <Card className="grid grid-cols-1 divide-y divide-default lg:grid-cols-[1.6fr_1fr] lg:divide-x lg:divide-y-0">
      {/* Left: deploy hero + steps */}
      <div className="flex flex-col gap-6 p-8">
        <div className="space-y-2">
          <h3 className="text-lg text-foreground">Deploy a worker</h3>
          <p className="max-w-md text-sm text-foreground-light">
            Run managed compute in microVMs right next to your database. Create one to get started —
            it deploys in a few seconds.
          </p>
        </div>

        <div>
          <Button variant="primary" icon={<Plus />} onClick={onCreate}>
            Create worker
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

      {/* Right rail: CLI + SKILL.md + docs */}
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
            <Button
              variant="default"
              size="tiny"
              icon={isCopied ? <Check className="text-brand" /> : <Copy />}
              onClick={handleCopySkill}
            >
              {isCopied ? 'Copied' : 'Copy SKILL.md'}
            </Button>
            <Link
              href={WORKERS_DOCS_URL}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-foreground-light transition-colors hover:text-foreground"
            >
              View docs
            </Link>
          </div>
        </div>

        <Link
          href={WORKERS_DOCS_URL}
          target="_blank"
          rel="noreferrer"
          className={cn(
            'flex items-center justify-between rounded-md border border-default px-4 py-3',
            'text-sm text-foreground-light transition-colors hover:border-strong hover:text-foreground'
          )}
        >
          Read the docs
          <ArrowRight size={14} />
        </Link>
      </div>
    </Card>
  )
}
