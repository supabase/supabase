import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { useRouter } from 'next/router'
import { useRef, useState } from 'react'

import { Button, IconCheck, IconDiscussions, IconX, cn, useConsent } from 'ui'

import { sendTelemetryEvent } from '~/lib/telemetry'

type Response = 'yes' | 'no'

function Feedback() {
  const [response, setResponse] = useState<Response | null>(null)
  const feedbackButtonRef = useRef<HTMLButtonElement>(null)

  const { hasAcceptedConsent } = useConsent()
  const supabase = useSupabaseClient()
  const router = useRouter()

  const unanswered = response === null
  const isYes = response === 'yes'
  const isNo = response === 'no'
  const showYes = unanswered || isYes
  const showNo = unanswered || isNo

  async function sendFeedbackVote(response: Response) {
    const { error } = await supabase
      .from('feedback')
      .insert({ vote: response, page: router.asPath })
    if (error) console.error(error)
  }

  function handleResponse(response: Response) {
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
    setResponse(response)
    feedbackButtonRef.current?.focus()
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
          onClick={() => handleResponse('yes')}
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
          onClick={() => handleResponse('no')}
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
      >
        {isYes ? <>What went well?</> : <>How can we improve?</>}
        <IconDiscussions size="tiny" />
      </button>
    </>
  )
}

export { Feedback }
