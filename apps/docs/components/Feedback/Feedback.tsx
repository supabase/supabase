'use client'

import { createClient } from '@supabase/supabase-js'
import { IS_PLATFORM } from '~/lib/constants'
import { useSendTelemetryEvent } from '~/lib/telemetry'
import { gotrueClient, useConstant, useIsLoggedIn, type Database } from 'common'
import { Bug, Check, MessageSquareQuote, ThumbsDown, ThumbsUp, X } from 'lucide-react'
import { usePathname } from 'next/navigation'
import {
  forwardRef,
  useReducer,
  useRef,
  useState,
  type CSSProperties,
  type MouseEventHandler,
  type ReactElement,
} from 'react'
import { Button, cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import { getSanitizedTabParams } from './Feedback.utils'
import { FeedbackModal, type FeedbackFields } from './FeedbackModal'

const FeedbackButton = forwardRef<
  HTMLButtonElement,
  { isYes: boolean; onClick: MouseEventHandler; visible: boolean }
>(({ isYes, onClick, visible }, ref) => {
  const isLoggedIn = useIsLoggedIn()
  if (!isLoggedIn) return null

  return (
    <button
      tabIndex={0}
      ref={ref}
      className={cn(
        'mt-0',
        'flex items-center gap-1',
        'text-xs text-foreground-lighter',
        'hover:text-foreground text-left',
        !visible && 'opacity-0 invisible',
        '[transition-property:opacity,color]',
        '[transition-delay:700ms,0ms]'
      )}
      onClick={onClick}
    >
      {isYes ? <>What went well?</> : <>How can we improve?</>}
      <MessageSquareQuote size={14} strokeWidth={1.5} />
    </button>
  )
})
FeedbackButton.displayName = 'FeedbackButton'

type Response = 'yes' | 'no'

interface FeedbackProps {
  variant?: 'default' | 'rail'
  className?: string
}

interface FeedbackTooltipProps {
  label: string
  isEnabled: boolean
  children: ReactElement
}

const NO_LABEL = "No, this page didn't help"

const YES_LABEL = 'Yes, this page helped'

enum StateType {
  Unanswered = 'unanswered',
  Followup = 'followup',
}

type State = { type: StateType.Unanswered } | { type: StateType.Followup; response: Response }

type Action = { event: 'VOTED'; response: Response }

const initialState = { type: StateType.Unanswered } satisfies State

function reducer(state: State, action: Action) {
  switch (action.event) {
    case 'VOTED':
      if (state.type === StateType.Unanswered)
        return { type: StateType.Followup, response: action.response }
    default:
      return state
  }
}

function Feedback({ className, variant = 'default' }: FeedbackProps) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [modalOpen, setModalOpen] = useState(false)
  const feedbackButtonRef = useRef<HTMLButtonElement>(null)

  const pathname = usePathname() ?? ''
  const sendTelemetryEvent = useSendTelemetryEvent()
  const isRail = variant === 'rail'
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabase = useConstant(() =>
    IS_PLATFORM && supabaseUrl && supabaseAnonKey
      ? createClient<Database>(supabaseUrl, supabaseAnonKey)
      : undefined
  )

  const unanswered = state.type === 'unanswered'
  const isYes = 'response' in state && state.response === 'yes'
  const isNo = 'response' in state && state.response === 'no'
  const showYes = unanswered || isYes
  const showNo = unanswered || isNo

  async function sendFeedbackVote(response: Response) {
    if (!supabase) return
    const { error } = await supabase
      .from('feedback')
      .insert({ vote: response, page: pathname, metadata: { query: getSanitizedTabParams() } })
    if (error) console.error(error)
  }

  function handleVote(response: Response) {
    sendTelemetryEvent({
      action: 'docs_feedback_clicked',
      properties: { response },
    })
    sendFeedbackVote(response)
    dispatch({ event: 'VOTED', response })
    // Focus so screen reader users are aware of the new element
    setTimeout(() => {
      feedbackButtonRef.current?.focus()
      // Wait for element to show up first
    }, 700)
  }

  function refocusButton() {
    setTimeout(() => {
      feedbackButtonRef.current?.focus()
      // Wait for modal to disappear and button to become focusable again
    }, 100)
  }

  async function handleSubmit({ comment, title }: FeedbackFields) {
    if (supabase) {
      const userId = (await gotrueClient.getSession()).data.session?.user?.id ?? null
      const { error } = await supabase.from('feedback_comments').insert({
        page: pathname,
        // @ts-expect-error -- the comment modal only opens after a vote, so state.response is set
        vote: state.response,
        title,
        comment,
        user_id: userId,
        metadata: { query: getSanitizedTabParams() },
      })
      if (error) console.error(error)
    }
    setModalOpen(false)
    refocusButton()
  }

  return (
    <section className={cn('@container', className)} aria-labelledby="feedback-title">
      <h2
        id="feedback-title"
        className={cn('block font-mono text-xs text-foreground-light mb-3', isRail && 'sr-only')}
      >
        Is this helpful?
      </h2>
      <div className="relative flex flex-col gap-2 @[12rem]:gap-4 @[12rem]:flex-row @[12rem]:items-center">
        <div
          style={{ '--container-flex-gap': '0.5rem' } as CSSProperties}
          className={cn('relative flex items-center', !isRail && 'gap-2')}
        >
          <FeedbackTooltip label={NO_LABEL} isEnabled={isRail}>
            <Button
              variant={isRail ? 'text' : 'outline'}
              rounded={!isRail}
              className={cn(
                isRail ? 'size-8 p-0' : 'px-1 w-7 h-7',
                'text-foreground-light',
                '[transition-property:opacity,transform,color] [transition-duration:150ms,250ms,250ms]',
                'motion-reduce:[transition-duration:150ms,1ms,300ms]',
                '[transition-timing-function:cubic-bezier(.76,0,.23,1)]',
                !isNo && 'hover:text-warning focus-visible:text-warning',
                !isNo && !isRail && 'hover:border-warning-500',
                isNo &&
                  (isRail
                    ? 'text-warning disabled:opacity-100'
                    : 'bg-warning text-warning-200 border-warning! disabled:opacity-100'),
                !showNo && 'opacity-0 invisible'
              )}
              // the label repeats the tooltip, so the button drops the description radix adds
              aria-label={isRail ? NO_LABEL : undefined}
              aria-describedby={undefined}
              onClick={() => handleVote('no')}
              disabled={state.type === StateType.Followup}
            >
              {isRail ? (
                <ThumbsDown aria-hidden className="size-4" />
              ) : (
                <X size={14} strokeWidth={2} className="text-current" />
              )}
              <span className="sr-only">No</span>
            </Button>
          </FeedbackTooltip>
          <FeedbackTooltip label={YES_LABEL} isEnabled={isRail}>
            <Button
              variant={isRail ? 'text' : 'outline'}
              rounded={!isRail}
              className={cn(
                isRail ? 'size-8 p-0' : 'px-1 w-7 h-7',
                'text-foreground-light',
                '[transition-property:opacity,transform,color] [transition-duration:150ms,250ms,250ms]',
                'motion-reduce:[transition-duration:150ms,1ms,300ms]',
                '[transition-timing-function:cubic-bezier(.76,0,.23,1)]',
                !isYes && 'hover:text-brand-600 focus-visible:text-brand-600',
                !isYes && !isRail && 'hover:border-brand-500',
                isYes &&
                  (isRail
                    ? 'text-brand-600 disabled:opacity-100 -translate-x-full'
                    : 'bg-brand-default text-brand-200 border-brand-default! disabled:opacity-100 -translate-x-[calc(100%+var(--container-inline-flex-gap,0.5rem))]'),
                !showYes && 'opacity-0 invisible'
              )}
              aria-label={isRail ? YES_LABEL : undefined}
              aria-describedby={undefined}
              onClick={() => handleVote('yes')}
              disabled={state.type === StateType.Followup}
            >
              {isRail ? (
                <ThumbsUp aria-hidden className="size-4" />
              ) : (
                <Check size={14} strokeWidth={2} />
              )}
              <span className="sr-only">Yes</span>
            </Button>
          </FeedbackTooltip>
          {isRail ? (
            <FeedbackTooltip label="Report a bug on GitHub" isEnabled>
              <Button
                asChild
                variant="text"
                className={cn(
                  'size-8 p-0 text-foreground-light transition-opacity',
                  state.type === StateType.Followup && 'opacity-0 invisible'
                )}
              >
                <a
                  href="https://github.com/supabase/supabase/issues/new/choose"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Report a bug on GitHub"
                  aria-describedby={undefined}
                >
                  <Bug aria-hidden className="size-4" />
                </a>
              </Button>
            </FeedbackTooltip>
          ) : null}
        </div>
        <div
          className={cn(
            'flex flex-col gap-0.5',
            '@[12rem]:absolute',
            isRail ? '@[12rem]:left-8' : '@[12rem]:left-9',
            'text-xs',
            'opacity-0 invisible',
            'text-left',
            '-translate-x-2',
            '[transition-property:opacity,transform]',
            '[transition-duration:450ms,300ms]',
            '[transition-delay:200ms,0ms]',
            '[transition-timing-function:cubic-bezier(.76,0,.23,1)]',
            'motion-reduce:[transition-duration:150ms,1ms]',
            'ease-out!',
            state.type === StateType.Followup && 'opacity-100 visible translate-x-0'
          )}
        >
          {state.type === StateType.Followup && (
            <>
              <span className="text-foreground-light">Thanks for your feedback!</span>
              <FeedbackButton
                ref={feedbackButtonRef}
                onClick={() => setModalOpen(true)}
                isYes={isYes}
                visible={true}
              />
            </>
          )}
        </div>
      </div>
      <FeedbackModal
        visible={modalOpen}
        page={pathname}
        onCancel={() => {
          setModalOpen(false)
          refocusButton()
        }}
        onSubmit={handleSubmit}
      />
    </section>
  )
}

const FeedbackTooltip = ({ label, isEnabled, children }: FeedbackTooltipProps) =>
  isEnabled ? (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  ) : (
    children
  )

export { Feedback }
