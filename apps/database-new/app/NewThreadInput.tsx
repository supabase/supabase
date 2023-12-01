'use client'

import { CHAT_EXAMPLES } from '@/data/chat-examples'
import { useAppStateSnapshot } from '@/lib/state'
import { createClient } from '@/lib/supabase/client'
import { ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { useFormState } from 'react-dom'
import { AssistantChatForm, cn } from 'ui'
import { updateThread } from './actions'

const suggestions = CHAT_EXAMPLES

const NewThreadInput = () => {
  const [value, setValue] = useState(() => {
    if (typeof window !== 'undefined') {
      const localPrompt = localStorage.getItem('prompt')
      if (localPrompt) {
        localStorage.removeItem('prompt')
        return localPrompt
      }
    }
    return ''
  })

  const initialState = {
    message: undefined,
    success: undefined,
    data: {
      value,
    },
  }

  const [state, formAction] = useFormState(updateThread, initialState)
  const supabase = createClient()
  const snap = useAppStateSnapshot()

  return (
    <>
      <div className="relative w-10/12 xl:w-11/12 max-w-xl">
        <AssistantChatForm
          action={formAction}
          key={'new-thread-form'}
          id={'new-thread-form'}
          onSubmit={async (event) => {
            console.log('hello')
            const {
              data: { user },
            } = await supabase.auth.getUser()
            if (!user) {
              event.preventDefault()
              localStorage.setItem('prompt', value)
              snap.setLoginDialogOpen(true)
              return
            }
          }}
          value={value}
          placeholder="e.g Create a Telegram-like chat application"
          onValueChange={(e) => setValue(e.target.value)}
          message={state.message}
        />
      </div>
      <div className="flex gap-3">
        {suggestions.map((suggestion, idx) => (
          <button
            key={idx}
            type="button"
            className={cn(
              'text-xs',
              'flex items-center gap-3 !pr-3',
              'transition border rounded-full px-3 py-1.5',
              'text-light',
              'hover:border-stronger hover:text'
            )}
            onClick={(event) => {
              setValue(suggestion.prompt)
              event.preventDefault()
            }}
          >
            {suggestion.label}
            <ExternalLink size={12} />
          </button>
        ))}
      </div>
    </>
  )
}

export default NewThreadInput
