'use client'
import { Message } from '@/lib/types'
import { CheckIcon } from 'lucide-react'
import { useState } from 'react'
import { Input, cn } from 'ui'
import AIChat from './AIChat'
import UserChat from './UserChat'

interface ChatProps {
  messages: Message[]
  loading: boolean
  selected: string | undefined
  onSelect: (m: string) => void
  onSubmit: (s: string) => void
}

export const Chat = ({ messages, loading, selected, onSelect, onSubmit }: ChatProps) => {
  const [value, setValue] = useState('')

  console.log({ messages })

  return (
    <div className={cn('min-w-[400px] border-r', 'flex flex-col h-full px-4 py-4 border-r')}>
      <div className="grow gap-2 flex flex-col mb-4">
        {messages.map((m) => {
          if (m.role === 'user') {
            return <UserChat key={m.id} message={m} />
          }
          if (m.sql === '') {
            return null
          }
          return (
            <AIChat key={m.id} message={m} isSelected={selected === m.id} onSelect={onSelect} />
          )
        })}

        {loading && (
          <div
            key="loading"
            className="bg-blue-500 p-4 w-3/4 rounded-lg self-end cursor-pointer border border-blue-500 hover:border-white flex flex-row justify-between"
          >
            ...
          </div>
        )}
      </div>

      <div>
        <Input
          value={value}
          onChange={(v) => setValue(v.target.value)}
          onKeyDown={(e) => {
            if (e.code === 'Enter') {
              onSubmit(value)
            }
          }}
        />
      </div>
    </div>
  )
}
