import Link from 'next/link'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
} from 'ui'

import { EXAMPLE_WORKER } from './workerSnippets'
import { WorkerSnippetTabs } from './WorkerSnippetTabs'
import CopyButton from '@/components/ui/CopyButton'
import { WORKERS_DOCS_URL, WORKERS_SKILL_MARKDOWN } from '@/lib/constants/workers'

interface DeployWorkerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const STEPS = [
  {
    title: 'Scaffold the worker',
    description: 'Creates supabase/workers/<name>/ with an entrypoint for the runtime you pick.',
  },
  {
    title: 'Configure it',
    description: 'Runtime, size, access, and instance count live in supabase/config.toml.',
  },
  {
    title: 'Push it',
    description: 'Builds the image and schedules it on a microVM in US West.',
  },
]

export const DeployWorkerDialog = ({ open, onOpenChange }: DeployWorkerDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent size="large">
      <DialogHeader>
        <DialogTitle>Deploy a worker</DialogTitle>
      </DialogHeader>

      <DialogSection className="space-y-4">
        <p className="text-sm text-foreground-light">
          Workers are deployed with the Supabase CLI. This dashboard is read-only during the private
          alpha.
        </p>
        <ol className="space-y-4">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-strong text-xs text-foreground-light">
                {index + 1}
              </span>
              <div className="space-y-0.5">
                <p className="text-sm text-foreground">{step.title}</p>
                <p className="text-sm text-foreground-lighter">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </DialogSection>

      <DialogSectionSeparator />

      <DialogSection>
        <WorkerSnippetTabs input={EXAMPLE_WORKER} tabs={['cli', 'config', 'ai']} />
      </DialogSection>

      <DialogFooter>
        <CopyButton text={WORKERS_SKILL_MARKDOWN} variant="default" copyLabel="Copy SKILL.md">
          Copy SKILL.md
        </CopyButton>
        <Button asChild variant="primary">
          <Link href={WORKERS_DOCS_URL} target="_blank" rel="noreferrer">
            View docs
          </Link>
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)
