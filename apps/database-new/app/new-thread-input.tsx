'use client'
import { ChatInputAtom } from '@/components/Chat/ChatInputAtom'
import { CHAT_EXAMPLES } from '@/data/chat-examples'
import { useMutation } from '@tanstack/react-query'
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
      <ChatInputAtom
        autoFocus
        type=""
        value={value}
        className={'rounded-full text-sm pl-10'}
        placeholder="e.g Create a Telegram-like chat application"
        disabled={isPending || isSuccess}
        loading={isPending || isSuccess}
        onKeyDown={(e) => {
          if (e.code === 'Enter') {
            if (value.length > 0) mutate(value)
          }
        }}
        onChange={(e) => setValue(e.target.value)}
      />

      <div className="flex items-center space-x-2">
        {suggestions.map((suggestion, idx) => (
          <button
            key={idx}
            className={cn(
              'transition border rounded-full px-4 py-2',
              'text-light',
              'hover:border-stronger hover:text'
            )}
            onClick={() => setValue(suggestion.prompt)}
          >
            <p className="text-xs">{suggestion.label}</p>
          </button>
        ))}
      </div>
    </>
  )
}

export default NewThreadInput
