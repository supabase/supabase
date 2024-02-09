import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { useRouter } from 'next/router'
import { useReducer, useRef, useState } from 'react'

import { Button, IconCheck, IconDiscussions, IconX, cn, useConsent } from 'ui'

import { sendTelemetryEvent } from '~/lib/telemetry'
import { type Feedback, FeedbackModal } from './FeedbackModal'

type Response = 'yes' | 'no'

type State =
  | { type: 'unanswered' }
  | { type: 'followup'; response: Response }
  | { type: 'final'; response: Response }

type Action = { event: 'VOTED'; response: Response } | { event: 'FOLLOWUP_ANSWERED' }

const initialState = { type: 'unanswered' } satisfies State

function reducer(state: State, action: Action) {
  switch (action.event) {
    case 'VOTED':
      if (state.type === 'unanswered') return { type: 'followup', response: action.response }
    case 'FOLLOWUP_ANSWERED':
      if (state.type === 'followup') return { type: 'final', response: state.response }
    default:
      return state
  }
}

function Feedback() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [modalOpen, setModalOpen] = useState(false)
  const feedbackButtonRef = useRef<HTMLButtonElement>(null)

  const { hasAcceptedConsent } = useConsent()
  const supabase = useSupabaseClient()
  const router = useRouter()

  const unanswered = state.type === 'unanswered'
  const isYes = 'response' in state && state.response === 'yes'
  const isNo = 'response' in state && state.response === 'no'
  const showYes = unanswered || isYes
  const showNo = unanswered || isNo

  async function sendFeedbackVote(response: Response) {
    const { error } = await supabase
      .from('feedback')
      .insert({ vote: response, page: router.asPath })
    if (error) console.error(error)
  }

  function handleVote(response: Response) {
    if (hasAcceptedConsent) {
      sendTelemetryEvent({
        category: 'docs',
        action: 'feedback_voted',
        label: response,
        // check that this matches the shape of pageview events and other telemetry
        page_location: router.asPath,
      })
    }
    sendFeedbackVote(response)
    dispatch({ event: 'VOTED', response })
    feedbackButtonRef.current?.focus()
  }

  function handleSubmit(feedback: Feedback) {
    console.log(feedback)
    setModalOpen(false)
  }

  return (
    <>
      <div className="relative flex gap-2 items-center mb-2">
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
            isNo && 'text-warning-600 border-stronger -translate-x-[calc(100%+0.5rem)]',
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
          'text-[0.8rem] text-foreground-lighter',
          unanswered && 'opacity-0 invisible',
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
        page={router.asPath}
        onCancel={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </>
  )
}

export { Feedback }
