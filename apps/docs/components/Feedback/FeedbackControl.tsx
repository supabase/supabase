'use client'

import { useSendTelemetryEvent } from '~/lib/telemetry'
import { Bug, ThumbsDown, ThumbsUp } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useId } from 'react'
import { Button, cn } from 'ui'

import { DockTooltip } from './DockTooltip'
import type { FeedbackVote } from './feedback-schema'
import { useFeedbackDock } from './FeedbackDockProvider'

export interface FeedbackControlProps {
  className?: string
}

const COPY = {
  yes: 'Yes, this page helped',
  no: "No, this page didn't help",
  bug: 'Report a bug on GitHub',
} as const

export const FeedbackControl = ({ className }: FeedbackControlProps) => {
  const headingId = useId()
  const pathname = usePathname() ?? ''
  const sendTelemetryEvent = useSendTelemetryEvent()
  const { state, actions, canSubmit, isEnabled } = useFeedbackDock()

  if (!isEnabled) return null

  const isDockOnThisPage = state.isOpen && state.targetPage?.pathname === pathname

  const handleVote = (vote: FeedbackVote) => {
    sendTelemetryEvent({ action: 'docs_feedback_clicked', properties: { response: vote } })
    actions.openDock({ vote, page: { pathname } })
  }
  const handleYesClick = () => handleVote('yes')
  const handleNoClick = () => handleVote('no')
  const handleBugClick = () => sendTelemetryEvent({ action: 'docs_feedback_bug_report_clicked' })

  return (
    <section aria-labelledby={headingId} className={cn('flex flex-col gap-3', className)}>
      <h3 id={headingId} className="font-mono text-xs text-foreground-light">
        Is this page helpful?
      </h3>
      <div className="flex items-center gap-2">
        {canSubmit ? (
          <>
            <DockTooltip label={COPY.yes}>
              <Button
                variant="default"
                aria-label={COPY.yes}
                aria-pressed={isDockOnThisPage && state.vote === 'yes'}
                className={cn(
                  'size-7 p-0',
                  'aria-pressed:border aria-pressed:border-dashed aria-pressed:border-foreground-muted',
                  'aria-pressed:bg-transparent aria-pressed:bg-none aria-pressed:opacity-25 aria-pressed:shadow-none'
                )}
                icon={<ThumbsUp />}
                onClick={handleYesClick}
              />
            </DockTooltip>
            <DockTooltip label={COPY.no}>
              <Button
                variant="default"
                aria-label={COPY.no}
                aria-pressed={isDockOnThisPage && state.vote === 'no'}
                className={cn(
                  'size-7 p-0',
                  'aria-pressed:border aria-pressed:border-dashed aria-pressed:border-foreground-muted',
                  'aria-pressed:bg-transparent aria-pressed:bg-none aria-pressed:opacity-25 aria-pressed:shadow-none'
                )}
                icon={<ThumbsDown />}
                onClick={handleNoClick}
              />
            </DockTooltip>
          </>
        ) : null}
        <DockTooltip label={COPY.bug}>
          <Button asChild variant="default" className="size-7 p-0" icon={<Bug />}>
            <a
              href="https://github.com/supabase/supabase/issues/new/choose"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={COPY.bug}
              onClick={handleBugClick}
            />
          </Button>
        </DockTooltip>
      </div>
    </section>
  )
}
