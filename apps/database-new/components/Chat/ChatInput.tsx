'use client'
import { CHAT_EXAMPLES } from '@/data/chat-examples'
import { useMutation } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Input, Input_Shadcn_, cn } from 'ui'

interface ChatInputParams {
  userID: string | undefined
}

const suggestions = CHAT_EXAMPLES

const ChatInput = ({ userID }: ChatInputParams) => {
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
      <div className="flex items-center gap-x-1.5 font-mono font-bold text-xl">
        <span>database</span>
        <div className="w-1.5 h-1.5 rounded-full bg-purple-900"></div>
        <span>design</span>
      </div>
      <div className="relative w-10/12 xl:w-11/12 max-w-xl">
        <div
          className={cn('absolute', 'top-4 left-4', 'ml-1 w-2 h-2 rounded-full bg-purple-900')}
        />
        <Input_Shadcn_
          autoFocus
          type=""
          value={value}
          className={'rounded-full text-sm pl-10'}
          placeholder="e.g Create a Telegram-like chat application"
          disabled={isPending || isSuccess}
          onKeyDown={(e) => {
            if (e.code === 'Enter') {
              if (value.length > 0) mutate(value)
            }
          }}
          onChange={(e) => setValue(e.target.value)}
        />
        <div className="absolute right-2 top-1">
          {isPending || isSuccess ? (
            <div className="mr-1">
              <Loader2 size={22} className="animate-spin" />
            </div>
          ) : (
            <div className="flex items-center justify-center w-7 h-7 bg-surface-300 border border-control rounded-full mr-0.5 p-1.5">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M13.5 3V2.25H15V3V10C15 10.5523 14.5522 11 14 11H3.56062L5.53029 12.9697L6.06062 13.5L4.99996 14.5607L4.46963 14.0303L1.39641 10.9571C1.00588 10.5666 1.00588 9.93342 1.39641 9.54289L4.46963 6.46967L4.99996 5.93934L6.06062 7L5.53029 7.53033L3.56062 9.5H13.5V3Z"
                  fill="currentColor"
                ></path>
              </svg>
            </div>
          )}
        </div>
      </div>

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

export default ChatInput
