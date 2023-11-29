'use client'

import { CHAT_EXAMPLES } from '@/data/chat-examples'
import { useAppStateSnapshot } from '@/lib/state'
import { createClient } from '@/lib/supabase/client'
import { useMutation } from '@tanstack/react-query'
import { ExternalLink } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createRef, useState } from 'react'
import { AssistantChatInput, cn } from 'ui'

const suggestions = CHAT_EXAMPLES

const NewThreadInput = () => {
  const router = useRouter()

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

  const supabase = createClient()

  const snap = useAppStateSnapshot()

  const { mutate, isPending, isSuccess } = useMutation({
    mutationFn: async (prompt: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const body = { prompt, userID: user?.id } // Include userID in the body object

      const response = await fetch('/api/ai/sql/threads/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const result = await response.json()
      return result
    },
    onSuccess(data) {
      const url = `/${data.threadId}/${data.runId}`
      router.push(url)
    },
  })

  const textAreaRef = createRef<HTMLTextAreaElement>()
  const submitRef = createRef<HTMLButtonElement>()

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Check if the pressed key is "Enter" (key code 13) without the "Shift" key
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      if (submitRef.current) {
        submitRef.current.click()
      }
    }
  }
  return (
    <>
      <div className="relative w-10/12 xl:w-11/12 max-w-xl">
        <form
          key={'new-thread-form'}
          id={'new-thread-form'}
          onSubmit={async (event) => {
            event.preventDefault()
            console.log('Simple onSubmit')

            console.log('submitting')

            const {
              data: { user },
            } = await supabase.auth.getUser()

            if (!user) {
              localStorage.setItem('prompt', value)
              snap.setLoginDialogOpen(true)
              return
            }
            if (value.length > 0) {
              mutate(value)
            }
          }}
        >
          <AssistantChatInput
            ref={textAreaRef}
            submitRef={submitRef}
            autoFocus
            value={value}
            rows={1}
            contentEditable
            aria-expanded={false}
            placeholder="e.g Create a Telegram-like chat application"
            disabled={isPending || isSuccess}
            loading={isPending || isSuccess}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </form>
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
