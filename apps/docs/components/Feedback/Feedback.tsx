import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { usePathname } from 'next/navigation'
import { type CSSProperties, useReducer, useRef, useState } from 'react'

import { Button, IconCheck, IconDiscussions, IconX, cn } from 'ui'

import { unauthedAllowedPost } from '~/lib/fetch/fetchWrappers'
import { useSendTelemetryEvent } from '~/lib/telemetry'
import { type FeedbackFields, FeedbackModal } from './FeedbackModal'

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

const FLEX_GAP_VARIABLE = '--container-flex-gap'

function Feedback() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [modalOpen, setModalOpen] = useState(false)
  const feedbackButtonRef = useRef<HTMLButtonElement>(null)

  const pathname = usePathname()
  const sendTelemetryEvent = useSendTelemetryEvent()
  const supabase = useSupabaseClient()

  const unanswered = state.type === 'unanswered'
  const isYes = 'response' in state && state.response === 'yes'
  const isNo = 'response' in state && state.response === 'no'
  const showYes = unanswered || isYes
  const showNo = unanswered || isNo

  async function sendFeedbackVote(response: Response) {
    const { error } = await supabase.from('feedback').insert({ vote: response, page: pathname })
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
    requestAnimationFrame(() => {
      feedbackButtonRef.current?.focus()
    })
  }

  function refocusButton() {
    // Save reference to button, because ref could be cleared by the time rAF runs
    const button = feedbackButtonRef.current
    requestAnimationFrame(() => {
      button?.focus()
    })
  }

  async function handleSubmit({ page, comment }: FeedbackFields) {
    const { error } = await unauthedAllowedPost('/platform/feedback/send', {
      body: {
        message: comment,
        category: 'Feedback',
        tags: ['docs-feedback'],
        pathname: page,
      },
    })
    if (error) console.error(error)
    setModalOpen(false)
    refocusButton()
  }

  return (
    <section className="px-5 mb-6" aria-labelledby="feedback-title">
      <h3 id="feedback-title" className="block font-mono text-xs uppercase text-foreground mb-4">
        Is this helpful?
      </h3>
      <div
        style={{ [FLEX_GAP_VARIABLE]: '0.5rem' } as CSSProperties}
        className={`relative flex gap-[var(${FLEX_GAP_VARIABLE})] items-center mb-2`}
      >
        <Button
          type="outline"
          className={cn(
            'px-1',
            'hover:text-brand-600',
            isYes && 'text-brand-600 border-stronger',
            !showYes && 'opacity-0 invisible',
            'transition-opacity'
          )}
          onClick={() => handleVote('yes')}
        >
          <IconCheck />
          <span className="sr-only">Yes</span>
        </Button>
        <Button
          type="outline"
          className={cn(
            'px-1',
            'hover:text-warning-600',
            isNo &&
              `text-warning-600 border-stronger -translate-x-[calc(100%+var(${FLEX_GAP_VARIABLE},0.5rem))]`,
            !showNo && 'opacity-0 invisible',
            '[transition-property:opacity,transform] [transition-duration:150ms,300ms] [transition-delay:0,150ms]'
          )}
          onClick={() => handleVote('no')}
        >
          <IconX />
          <span className="sr-only">No</span>
        </Button>
      </div>
      <button
        ref={feedbackButtonRef}
        className={cn(
          'flex items-center gap-2',
          'text-[0.8rem] text-foreground-lighter text-left',
          state.type !== StateType.Followup && 'opacity-0 invisible',
          'transition-opacity',
          isNo && 'delay-100'
        )}
        onClick={() => setModalOpen(true)}
      >
        {isYes ? <>What went well?</> : <>How can we improve?</>}
        <IconDiscussions size="tiny" />
      </button>
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
