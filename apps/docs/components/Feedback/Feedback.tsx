import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { Check, MessageSquareQuote, X } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useReducer, useRef, useState, type CSSProperties } from 'react'
import { Button, cn } from 'ui'
import { useSendTelemetryEvent } from '~/lib/telemetry'
import { FeedbackModal, type FeedbackFields } from './FeedbackModal'

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
    supabase
      .from('feedback_comment')
      .insert({ page, comment })
      .then(({ error }) => console.error(error))
    setModalOpen(false)
    refocusButton()
  }

  return (
    <section className="px-5 mb-6" aria-labelledby="feedback-title">
      <h3 id="feedback-title" className="block font-mono text-xs uppercase text-foreground mb-4">
        Is this helpful?
      </h3>
      <div
        style={{ '--container-flex-gap': '0.5rem' } as CSSProperties}
        className={`relative flex gap-[var(--container-flex-gap)] items-center mb-2`}
      >
        <Button
          type="outline"
          rounded
          className={cn(
            'px-1',
            !isYes && 'hover:text-brand-600 hover:border-brand-500',
            isYes && 'bg-brand text-brand-200 !border-brand disabled:opacity-100',
            !showYes && 'opacity-0 invisible',
            '[transition-property:opacity,transform,color] [transition-duration:150ms,300ms,300ms,300ms]'
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
            '[transition-property:opacity,transform,color] [transition-duration:150ms,300ms,300ms,300ms]'
          )}
          onClick={() => handleVote('no')}
          disabled={state.type === StateType.Followup}
        >
          <X size={14} strokeWidth={3} />
          <span className="sr-only">No</span>
        </Button>
      </div>
      <button
        ref={feedbackButtonRef}
        className={cn(
          'flex items-center gap-2',
          'text-[0.8rem] text-foreground-lighter text-left',
          'hover:text-foreground',
          state.type !== StateType.Followup && 'opacity-0 invisible',
          '[transition-property:opacity,color]',
          isNo && 'delay-100'
        )}
        onClick={() => setModalOpen(true)}
      >
        {isYes ? <>What went well?</> : <>How can we improve?</>}
        <MessageSquareQuote size={14} strokeWidth={1.5} />
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
