'use client'

import { createClient } from '@supabase/supabase-js'
import { Check, MessageSquareQuote, X } from 'lucide-react'
import { usePathname } from 'next/navigation'
import {
  type CSSProperties,
  type MouseEventHandler,
  forwardRef,
  useReducer,
  useRef,
  useState,
} from 'react'

import { type Database, useConstant, useIsLoggedIn } from 'common'
import { Button, cn } from 'ui'

import { IS_PLATFORM } from '~/lib/constants'
import { useSendFeedbackMutation } from '~/lib/fetch/feedback'
import { useSendTelemetryEvent } from '~/lib/telemetry'
import { getNotionTeam, getSanitizedTabParams } from './Feedback.utils'
import { type FeedbackFields, FeedbackModal } from './FeedbackModal'

const FeedbackButton = forwardRef<
  HTMLButtonElement,
  { isYes: boolean; onClick: MouseEventHandler; visible: boolean }
>(({ isYes, onClick, visible }, ref) => {
  const isLoggedIn = useIsLoggedIn()
  if (!isLoggedIn) return null

  return (
    <button
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

function Feedback({ className }: { className?: string }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [modalOpen, setModalOpen] = useState(false)
  const feedbackButtonRef = useRef<HTMLButtonElement>(null)

  const pathname = usePathname() ?? ''
  const sendTelemetryEvent = useSendTelemetryEvent()
  const { mutate: sendFeedbackComment } = useSendFeedbackMutation()
  const supabase = useConstant(() =>
    IS_PLATFORM
      ? createClient<Database>(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
      : undefined
  )

  const unanswered = state.type === 'unanswered'
  const isYes = 'response' in state && state.response === 'yes'
  const isNo = 'response' in state && state.response === 'no'
  const showYes = unanswered || isYes
  const showNo = unanswered || isNo

  async function sendFeedbackVote(response: Response) {
    const { error } = await supabase.from('feedback').insert({
      vote: response,
      page: pathname,
      metadata: {
        query: getSanitizedTabParams(),
      },
    })
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

  async function handleSubmit({ page, comment, title }: FeedbackFields) {
    sendFeedbackComment({
      message: comment,
      pathname: page,
      title,
      // @ts-expect-error -- can't click this button without having a state.response
      isHelpful: state.response === 'yes',
      team: getNotionTeam(pathname),
    })
    setModalOpen(false)
    refocusButton()
  }

  return (
    <section className={cn('@container', className)} aria-labelledby="feedback-title">
      <h3 id="feedback-title" className="block font-mono text-xs text-foreground-light mb-3">
        Is this helpful?
      </h3>
      <div className="relative flex flex-col gap-2 @[12rem]:gap-4 @[12rem]:flex-row @[12rem]:items-center">
        <div
          style={{ '--container-flex-gap': '0.5rem' } as CSSProperties}
          className="relative flex gap-2 items-center"
        >
          <Button
            type="outline"
            rounded
            className={cn(
              'px-1 w-7 h-7',
              'text-foreground-light',
              '[transition-property:opacity,transform,color] [transition-duration:150ms,250ms,250ms]',
              'motion-reduce:[transition-duration:150ms,1ms,300ms]',
              '[transition-timing-function:cubic-bezier(.76,0,.23,1)]',
              !isNo && 'hover:text-warning-600 hover:border-warning-500',
              isNo && `bg-warning text-warning-200 !border-warning disabled:opacity-100`,
              !showNo && 'opacity-0 invisible'
            )}
            onClick={() => handleVote('no')}
            disabled={state.type === StateType.Followup}
          >
            <X size={14} strokeWidth={2} className="text-current" />
            <span className="sr-only">No</span>
          </Button>
          <Button
            type="outline"
            rounded
            className={cn(
              'px-1 w-7 h-7',
              'text-foreground-light',
              '[transition-property:opacity,transform,color] [transition-duration:150ms,250ms,250ms]',
              'motion-reduce:[transition-duration:150ms,1ms,300ms]',
              '[transition-timing-function:cubic-bezier(.76,0,.23,1)]',
              !isYes && 'hover:text-brand-600 hover:border-brand-500',
              isYes &&
                'bg-brand text-brand-200 !border-brand disabled:opacity-100 -translate-x-[calc(100%+var(--container-inline-flex-gap,0.5rem))]',
              !showYes && 'opacity-0 invisible'
            )}
            onClick={() => handleVote('yes')}
            disabled={state.type === StateType.Followup}
          >
            <Check size={14} strokeWidth={2} />
            <span className="sr-only">Yes</span>
          </Button>
        </div>
        <div
          className={cn(
            'flex flex-col gap-0.5',
            '@[12rem]:absolute @[12rem]:left-9',
            'text-xs',
            'opacity-0 invisible',
            'text-left',
            '-translate-x-2',
            '[transition-property:opacity,transform]',
            '[transition-duration:450ms,300ms]',
            '[transition-delay:200ms,0ms]',
            '[transition-timing-function:cubic-bezier(.76,0,.23,1)]',
            'motion-reduce:[transition-duration:150ms,1ms]',
            '!ease-out',
            state.type === StateType.Followup && 'opacity-100 visible -translate-x-0'
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

export { Feedback }
