import { ChevronRightIcon } from 'lucide-react'
import { useRef, useState } from 'react'
import { Card, cn } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

import { errorMessage, type AskAgent } from '../common'
import type { Project } from '../contract'
import { checkIcons, projectChecks, type ProjectCheckId } from './project-overview'

export interface ProjectChecksProps {
  project: Project
  /** Sends a check to the agent. Omit when the host cannot; the checks are disabled. */
  onAsk?: AskAgent
}

/** Read-only investigations the user can ask the agent to run on a project. */
export function ProjectChecks({ project, onAsk }: ProjectChecksProps) {
  const [sendingId, setSendingId] = useState<ProjectCheckId>()
  const [sendResult, setSendResult] = useState<
    { status: 'sent' } | { status: 'error'; message: string }
  >()
  const isSending = useRef(false)
  const canSend = !!onAsk && sendingId === undefined

  async function handleSend(check: ProjectCheckId) {
    if (!onAsk || isSending.current) return
    isSending.current = true
    setSendingId(check)
    setSendResult(undefined)
    try {
      await onAsk({ type: 'project-check', project, check })
      setSendResult({ status: 'sent' })
    } catch (error) {
      setSendResult({ status: 'error', message: errorMessage(error) })
    } finally {
      isSending.current = false
      setSendingId(undefined)
    }
  }

  return (
    <section aria-labelledby="project-checks-title" className="@container space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h3 id="project-checks-title" className="text-sm text-foreground">
          Check your project
        </h3>
        {/* Always rendered so the confirmation is announced. */}
        <p role="status" className="text-xs text-foreground-lighter">
          {sendResult?.status === 'sent' ? 'Sent to chat.' : ''}
        </p>
      </div>
      <Card className="overflow-hidden">
        <div className="grid grid-cols-1 divide-y divide-muted @2xl:grid-cols-4 @2xl:divide-x @2xl:divide-y-0">
          {projectChecks.map((check) => {
            const Icon = checkIcons[check.id]
            return (
              <button
                key={check.id}
                type="button"
                disabled={!canSend}
                onClick={() => void handleSend(check.id)}
                className={cn(
                  'group flex w-full items-center gap-3 p-4 text-left transition-colors',
                  'hover:bg-surface-100 focus-ring disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent',
                  '@2xl:min-h-32 @2xl:flex-col @2xl:justify-center @2xl:p-6 @2xl:text-center'
                )}
              >
                <span className="shrink-0 text-foreground-light group-hover:text-foreground">
                  <Icon size={18} aria-hidden="true" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-1 @2xl:flex-initial">
                  <span className="text-sm text-foreground">
                    {sendingId === check.id ? 'Sending…' : check.title}
                  </span>
                  <span className="text-sm text-foreground-lighter">{check.description}</span>
                </span>
                <ChevronRightIcon
                  size={16}
                  aria-hidden="true"
                  className="shrink-0 text-foreground-lighter group-hover:text-foreground @2xl:hidden"
                />
              </button>
            )
          })}
        </div>
      </Card>
      {!onAsk && (
        <p className="text-xs text-foreground-lighter">
          This host doesn’t support sending prompts to chat.
        </p>
      )}
      {sendResult?.status === 'error' && (
        <Admonition
          type="destructive"
          title="Failed to send to chat"
          description={sendResult.message}
        />
      )}
    </section>
  )
}
