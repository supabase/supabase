'use client'
import { AssistantMessage, Message, UserMessage } from '@/lib/types'
import { useState } from 'react'
import { Input, ScrollArea, cn } from 'ui'
import BottomMarker from './BottomMarker'
import UserChat from './UserChat'
import Loader from './Loader'
import { Loader2 } from 'lucide-react'

interface ChatProps {
  messages: Message[]
  loading: boolean
  selected: string | undefined
  hideChat: boolean
  onSelect: (id: string) => void
  onSubmit: (value: string) => void
}

export const Chat = ({ messages, loading, selected, hideChat, onSelect, onSubmit }: ChatProps) => {
  const [value, setValue] = useState('')
  const [inputEntered, setInputEntered] = useState(false)
  const userMessages = messages.filter((message) => message.role === 'user')

  return (
    <div
      className={cn(
        'border-r relative',
        'flex flex-col h-full border-r',
        hideChat ? 'w-[0px] overflow-hidden' : 'w-[400px] 2xl:w-[500px]'
      )}
    >
      <div className="flex flex-col grow items-between">
        {messages.length === 0 ? (
          <div className="grow">
            <Loader />
          </div>
        ) : (
          <ScrollArea className="grow h-[200px]">
            <div className="px-4 mt-4 flex flex-col">
              {userMessages.map((message, idx) => {
                const index = messages.indexOf(message)
                const reply = messages[index + 1] as AssistantMessage
                const isLatest = idx === userMessages.length - 1
                return (
                  <UserChat
                    key={message.id}
                    message={message as UserMessage}
                    reply={reply}
                    isLatest={isLatest}
                    isSelected={selected === reply?.id}
                    isLoading={loading && isLatest}
                    onSelect={onSelect}
                  />
                )
              })}
              <BottomMarker />
            </div>
          </ScrollArea>
        )}

        <div className="px-4 pb-4">
          <Input
            value={value}
            disabled={loading || inputEntered}
            inputClassName="rounded-full pl-8"
            placeholder={loading ? 'Generating reply to request...' : 'Ask for some changes'}
            icon={<div className="ml-1 w-2 h-2 rounded-full bg-purple-900" />}
            onChange={(v) => setValue(v.target.value)}
            onKeyDown={(e) => {
              if (e.code === 'Enter') {
                onSubmit(value)
                setInputEntered(true)
              }
            }}
            actions={
              loading || inputEntered ? (
                <div className="mr-2">
                  <Loader2 size={16} className="animate-spin" />
                </div>
              ) : null
            }
          />
        </div>
      </div>
    </div>
  )
}
