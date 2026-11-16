import { CheckIcon, CircleIcon, Loader2Icon, SparklesIcon, XIcon } from 'lucide-react'
import { Badge, cn } from 'ui'

import { ASSISTANT_AUTHOR } from './AlertIssueAssistant.utils'
import type { AssistantRunState, AssistantStepStatus } from './AlertIssueAssistantProvider'
import { Markdown } from '@/components/interfaces/Markdown'

export const ASSISTANT_MARKDOWN_CLASS_NAME =
  'flex max-w-none flex-col gap-2 text-sm text-foreground [&_code]:font-mono [&_code]:text-xs [&_p]:m-0 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-surface-200 [&_pre]:p-3 [&_ul]:list-disc [&_ul]:pl-5'

export const AssistantAuthor = ({ timestamp }: { timestamp?: string }) => (
  <div className="flex items-center gap-2 text-xs text-foreground-lighter">
    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-300 text-brand-600">
      <SparklesIcon size={12} aria-hidden />
    </span>
    <span className="text-foreground-light">{ASSISTANT_AUTHOR}</span>
    <Badge variant="success">Assistant</Badge>
    {timestamp && <span>{timestamp}</span>}
  </div>
)

const StepIcon = ({ status }: { status: AssistantStepStatus }) => {
  if (status === 'running')
    return <Loader2Icon size={14} className="animate-spin text-foreground-light" />
  if (status === 'done') return <CheckIcon size={14} className="text-brand" />
  if (status === 'failed') return <XIcon size={14} className="text-destructive" />
  return <CircleIcon size={14} className="text-foreground-muted" />
}

/** The assistant's reply while it is still working, shown at the end of the comment thread. */
export const AlertIssueAssistantRun = ({ run }: { run: AssistantRunState }) => (
  <li
    aria-label="Supabase Assistant is responding"
    className="flex flex-col gap-2 rounded-md border border-brand-400 bg-brand-200/20 p-3"
  >
    <AssistantAuthor timestamp={run.isAnswering ? 'writing a reply…' : 'working…'} />
    <ol aria-label="Assistant steps" className="flex flex-col gap-1.5">
      {run.steps.map(({ step, status, detail }) => (
        <li key={step.id} data-status={status} className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2 text-sm">
            <StepIcon status={status} />
            <span
              className={cn(status === 'pending' ? 'text-foreground-lighter' : 'text-foreground')}
            >
              {step.label}
            </span>
          </div>
          {detail && status !== 'running' && (
            <p className="ml-6 truncate font-mono text-xs text-foreground-lighter">{detail}</p>
          )}
        </li>
      ))}
    </ol>
    {run.answer && <Markdown content={run.answer} className={ASSISTANT_MARKDOWN_CLASS_NAME} />}
  </li>
)
