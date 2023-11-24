'use client'
import { ChatInputAtom } from '@/components/Chat/ChatInput'
import { CHAT_EXAMPLES } from '@/data/chat-examples'
import { useMutation } from '@tanstack/react-query'
import { ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { cn } from 'ui'

interface ChatInputParams {
  userID: string | undefined
}

const suggestions = CHAT_EXAMPLES

const NewThreadInput = ({ userID }: ChatInputParams) => {
  const router = useRouter()
  const [value, setValue] = useState('')

  const { mutate, isPending, isSuccess } = useMutation({
    mutationFn: async (prompt: string) => {
      const body = { prompt, userID } // Include userID in the body object

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

  return (
    <>
      <div className="relative w-10/12 xl:w-11/12 max-w-xl">
        <ChatInputAtom
          handleSubmit={() => {
            if (value.length > 0) mutate(value)
          }}
          autoFocus
          value={value}
          rows={1}
          contentEditable
          aria-expanded={false}
          placeholder="e.g Create a Telegram-like chat application"
          disabled={isPending || isSuccess}
          loading={isPending || isSuccess}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
      <div className="flex gap-3">
        {suggestions.map((suggestion, idx) => (
          <button
            key={idx}
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
