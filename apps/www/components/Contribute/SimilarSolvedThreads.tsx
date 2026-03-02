'use client'

import { useRef, useState } from 'react'
import {
  Badge,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  cn,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  Label_Shadcn_,
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  TextArea_Shadcn_,
} from 'ui'
import { ChevronDown, ThumbsUp, ThumbsDown } from 'lucide-react'
import type {
  SimilarSolvedThread,
  SimilarThreadFeedbackReaction,
  ThreadSource,
} from '~/types/contribute'
import { submitSimilarThreadFeedback, updateSimilarThreadFeedback } from '~/app/contribute/actions'
import { ChannelIcon } from './Icons'

function getChannelFromUrl(url: string): ThreadSource {
  const u = url.toLowerCase()
  if (u.includes('discord')) return 'discord'
  if (u.includes('reddit')) return 'reddit'
  if (u.includes('github')) return 'github'
  // TODO: handle unknown URL patterns more explictly, don’t just default to GitHub
  return 'github'
}

interface SimilarSolvedThreadsProps {
  threads: SimilarSolvedThread[]
  parentThreadId: string
}

const SimilarThreadCard = ({
  thread,
  className,
}: {
  thread: SimilarSolvedThread
  className?: string
}) => {
  const channel = getChannelFromUrl(thread.external_activity_url || '')
  const filteredStack = thread.stack?.filter((s) => s !== 'Other') ?? []
  const hasStack = filteredStack.length > 0

  const url = thread.external_activity_url || null
  const linkClassName = cn(
    'border-b border-border px-6 py-4 flex items-center gap-3 overflow-hidden hover:bg-surface-200 transition-colors',
    className
  )
  const content = (
    <>
      <div className="flex items-center justify-center bg-surface-200 dark:bg-surface-300 h-10 w-10 rounded-md shrink-0">
        <ChannelIcon channel={channel} />
      </div>
      <div className="min-w-0 flex-1 flex flex-col">
        <h4 className="text-base text-foreground truncate block">{thread.subject}</h4>
        {thread.problem_description ? (
          <p className="text-sm text-foreground-lighter leading-relaxed line-clamp-2">
            {thread.problem_description}
          </p>
        ) : null}
        {hasStack ? (
          <div className="flex flex-wrap gap-x-1.5 gap-y-1 overflow-hidden pt-1">
            {filteredStack.map((tech) => (
              <Badge key={tech} variant="default">
                {tech}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>
    </>
  )

  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClassName}
        aria-label={`View thread: ${thread.subject}`}
      >
        {content}
      </a>
    )
  }

  return <div className={linkClassName}>{content}</div>
}

export const SimilarSolvedThreads = ({ threads, parentThreadId }: SimilarSolvedThreadsProps) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [submittedReaction, setSubmittedReaction] = useState<SimilarThreadFeedbackReaction | null>(
    null
  )
  const [feedbackId, setFeedbackId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogReaction, setDialogReaction] = useState<SimilarThreadFeedbackReaction>('positive')
  const [dialogFeedback, setDialogFeedback] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isClosingProgrammatically = useRef(false)

  const handleThumbClick = async (reaction: SimilarThreadFeedbackReaction) => {
    if (submittedReaction) return
    setIsSubmitting(true)
    const result = await submitSimilarThreadFeedback({
      parentThreadId,
      reaction,
      similarThreadKey: null,
    })
    setIsSubmitting(false)
    if (result.success) {
      setFeedbackId(result.id ?? null)
      setDialogReaction(reaction)
      setDialogFeedback('')
      setDialogOpen(true)
    }
  }

  const persistAndCloseDialog = async () => {
    if (!feedbackId) return
    setIsSubmitting(true)
    const result = await updateSimilarThreadFeedback(
      feedbackId,
      dialogReaction,
      dialogFeedback.trim() || null
    )
    setIsSubmitting(false)
    if (result.success) {
      setSubmittedReaction(dialogReaction)
      isClosingProgrammatically.current = true
      setDialogOpen(false)
      queueMicrotask(() => {
        isClosingProgrammatically.current = false
      })
    }
  }

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open)
    if (!open && feedbackId && !isClosingProgrammatically.current) {
      persistAndCloseDialog()
    }
  }

  return (
    <Card className={cn('relative')}>
      <CardHeader className={cn('p-0', !isExpanded && 'border-b-0')}>
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="flex w-full items-center gap-1.5 px-[var(--card-padding-x)] py-4 text-left text-xs font-mono uppercase text-card-foreground"
        >
          Related solved threads
          <span className="text-foreground-muted tabular-nums font-normal">({threads.length})</span>
          <ChevronDown
            className={`h-3.5 w-3.5 text-foreground-lighter transition-transform duration-200 ${
              isExpanded ? 'rotate-0' : '-rotate-90'
            }`}
          />
        </button>
      </CardHeader>
      {isExpanded && (
        <>
          <CardContent className="p-0">
            {threads.map((thread, idx) => (
              <SimilarThreadCard
                key={thread.thread_key || idx}
                thread={thread}
                className={idx === threads.length - 1 ? 'border-b-0' : undefined}
              />
            ))}
          </CardContent>
          <CardFooter className="flex items-center justify-between min-h-[58px]">
            {submittedReaction ? (
              <span className="text-sm text-foreground-muted">
                Thanks for helping improve related threads
              </span>
            ) : (
              <TooltipProvider>
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => handleThumbClick('positive')}
                        disabled={isSubmitting}
                        className="p-1 rounded hover:bg-surface-200 transition-colors disabled:opacity-50"
                        aria-label="Relevant"
                      >
                        <ThumbsUp className="h-4 w-4 text-foreground-muted" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Relevant</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => handleThumbClick('negative')}
                        disabled={isSubmitting}
                        className="p-1 rounded hover:bg-surface-200 transition-colors disabled:opacity-50"
                        aria-label="Irrelevant"
                      >
                        <ThumbsDown className="h-4 w-4 text-foreground-muted" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Irrelevant</TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>
            )}
          </CardFooter>
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Help improve related threads</DialogTitle>
            <DialogDescription>How relevant were these threads to your issue?</DialogDescription>
          </DialogHeader>
          <DialogSectionSeparator />
          <DialogSection className="space-y-4">
            <fieldset className="space-y-1">
              <legend className="text-sm text-foreground">Relevance</legend>
              <div className="flex items-center gap-1">
                <label
                  className={cn(
                    'p-2 rounded cursor-pointer transition-colors',
                    dialogReaction === 'positive'
                      ? 'bg-surface-300 text-foreground'
                      : 'hover:bg-surface-200 text-foreground-lighter'
                  )}
                >
                  <input
                    type="radio"
                    name="relevance"
                    value="positive"
                    checked={dialogReaction === 'positive'}
                    onChange={() => setDialogReaction('positive')}
                    className="sr-only"
                    aria-label="Relevant"
                  />
                  <ThumbsUp className="h-4 w-4" aria-hidden />
                </label>
                <label
                  className={cn(
                    'p-2 rounded cursor-pointer transition-colors',
                    dialogReaction === 'negative'
                      ? 'bg-surface-300 text-foreground'
                      : 'hover:bg-surface-200 text-foreground-lighter'
                  )}
                >
                  <input
                    type="radio"
                    name="relevance"
                    value="negative"
                    checked={dialogReaction === 'negative'}
                    onChange={() => setDialogReaction('negative')}
                    className="sr-only"
                    aria-label="Irrelevant or unhelpful"
                  />
                  <ThumbsDown className="h-4 w-4" aria-hidden />
                </label>
              </div>
            </fieldset>
            <div className="space-y-1">
              <Label_Shadcn_ htmlFor="feedback">
                Additional feedback <span className="text-foreground-muted">(optional)</span>
              </Label_Shadcn_>
              <TextArea_Shadcn_
                id="feedback"
                placeholder="What was helpful or missing?"
                rows={4}
                value={dialogFeedback}
                onChange={(e) => setDialogFeedback(e.target.value)}
                className="text-sm resize-none"
              />
            </div>
          </DialogSection>
          <DialogFooter>
            <Button onClick={persistAndCloseDialog} disabled={isSubmitting} loading={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit feedback'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
