import { useSupabaseClient } from '@supabase/auth-helpers-react'
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

import { type Database, useIsLoggedIn } from 'common'
import { Button, cn } from 'ui'

import { useSendFeedbackMutation } from '~/lib/fetch/feedback'
import { useSendTelemetryEvent } from '~/lib/telemetry'
import { FeedbackModal, type FeedbackFields } from './FeedbackModal'
import { getSanitizedTabParams } from './Feedback.utils'

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
        'flex items-center gap-2',
        'text-xs text-foreground-lighter',
        'hover:text-foreground',
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

function Feedback() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [modalOpen, setModalOpen] = useState(false)
  const feedbackButtonRef = useRef<HTMLButtonElement>(null)

  const pathname = usePathname()
  const sendTelemetryEvent = useSendTelemetryEvent()
  const { mutate: sendFeedbackComment } = useSendFeedbackMutation()
  const supabase = useSupabaseClient<Database>()

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
      category: 'docs',
      action: 'feedback_voted',
      label: response,
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
    })
    setModalOpen(false)
    refocusButton()
  }

  return (
    <section className="@container px-5 mb-6" aria-labelledby="feedback-title">
      <h3 id="feedback-title" className="block font-mono text-xs uppercase text-foreground mb-4">
        Is this helpful?
      </h3>
      <div className="relative flex flex-col gap-y-4 mb-2 @[12rem]:flex-row @[12rem]:items-center">
        <div
          style={{ '--container-flex-gap': '0.5rem' } as CSSProperties}
          className={`relative flex gap-[var(--container-flex-gap)] items-center`}
        >
          <Button
            type="outline"
            rounded
            className={cn(
              'px-1',
              !isYes && 'hover:text-brand-600 hover:border-brand-500',
              isYes && 'bg-brand text-brand-200 !border-brand disabled:opacity-100',
              !showYes && 'opacity-0 invisible',
              '[transition-property:opacity,transform,color] [transition-duration:150ms,300ms,300ms]',
              'motion-reduce:[transition-duration:150ms,1ms,300ms]'
            )}
            onClick={() => handleVote('yes')}
            disabled={state.type === StateType.Followup}
          >
            <Check size={14} strokeWidth={3} />
            <span className="sr-only">Yes</span>
          </Button>
          <Button
            type="outline"
            rounded
            className={cn(
              'px-1',
              !isNo && 'hover:text-warning-600 hover:border-warning-500',
              isNo &&
                `bg-warning text-warning-200 !border-warning -translate-x-[calc(100%+var(--container-flex-gap,0.5rem))] disabled:opacity-100`,
              !showNo && 'opacity-0 invisible',
              '[transition-property:opacity,transform,color] [transition-duration:150ms,300ms,300ms]',
              'motion-reduce:[transition-duration:150ms,1ms,300ms]'
            )}
            onClick={() => handleVote('no')}
            disabled={state.type === StateType.Followup}
          >
            <X size={14} strokeWidth={3} />
            <span className="sr-only">No</span>
          </Button>
        </div>
        <div
          className={cn(
            'flex flex-col gap-1',
            'text-xs',
            'opacity-0 invisible',
            'text-left',
            '-translate-x-[0.25rem] @[12rem]:-translate-x-[1.25rem]',
            '[transition-property:opacity,transform] [transition-duration:150ms,300ms]',
            'motion-reduce:[transition-duration:150ms,1ms]',
            'delay-300',
            state.type === StateType.Followup &&
              'opacity-100 visible -translate-x-0 @[12rem]:-translate-x-[1rem]'
          )}
        >
          <span className="text-foreground-light">Thanks for your feedback!</span>
          <FeedbackButton
            ref={feedbackButtonRef}
            onClick={() => setModalOpen(true)}
            isYes={isYes}
            visible={!unanswered}
          />
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
