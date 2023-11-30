import { zodResolver } from '@hookform/resolvers/zod'
import { useProfile } from 'lib/profile'
import { compact, last, sortBy } from 'lodash'
import OpenAI from 'openai'
import { createRef, useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { AssistantChatForm } from 'ui'
import * as z from 'zod'
import Message from './Message'

export const AIPolicyChat = ({
  messages,
  loading,
  onSubmit,
  onDiff,
  onChange,
}: {
  messages: OpenAI.Beta.Threads.Messages.ThreadMessage[]
  loading: boolean
  onSubmit: (s: string) => void
  onDiff: (s: string) => void
  onChange: (value: boolean) => void
}) => {
  const { profile } = useProfile()
  const bottomRef = useRef<HTMLDivElement>(null)
  const name = compact([profile?.first_name, profile?.last_name]).join(' ')
  const sorted = useMemo(() => {
    return sortBy(messages, (m) => m.created_at).filter((m) => {
      if (m.content[0].type === 'text') {
        return !m.content[0].text.value.startsWith('Here is my database schema for reference:')
      }
      return false
    })
  }, [messages])

  const FormSchema = z.object({ chat: z.string() })
  const form = useForm<z.infer<typeof FormSchema>>({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    resolver: zodResolver(FormSchema),
    defaultValues: { chat: '' },
  })
  const formChatValue = form.getValues().chat
  const pendingReply = loading && last(sorted)?.role === 'user'

  useEffect(() => {
    // 👇️ scroll to bottom every time messages change
    if (bottomRef.current) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 500)
    }
  }, [messages.length])

  useEffect(() => {
    if (!loading) {
      form.setValue('chat', '')
      form.setFocus('chat')
    }
  }, [loading])

  useEffect(() => {
    onChange(formChatValue.length === 0)
  }, [formChatValue])

  const [commandsOpen, setCommandsOpen] = useState<boolean>(false)
  const textAreaRef = createRef<HTMLTextAreaElement>()
  const [value, setValue] = useState('')

  return (
    <div id={'ai-chat-assistant'} className="flex flex-col h-full">
      <div className="overflow-auto flex-1">
        <Message
          role="assistant"
          content={`Hi${
            name ? ' ' + name : ''
          }, how can I help you? I'm powered by AI, so surprises and mistakes are possible.
        Make sure to verify any generated code or suggestions, and share feedback so that we can
        learn and improve.`}
        />

        {sorted.map((m, idx) => (
          <Message
            key={`message-${idx}`}
            name={name}
            role={m.role}
            content={
              m.content[0] && m.content[0].type === 'text' ? m.content[0].text.value : undefined
            }
            createdAt={m.created_at}
            isDebug={(m.metadata as any).type === 'debug'}
            onDiff={onDiff}
          />
        ))}

        {pendingReply && <Message role="assistant" content="Thinking..." />}

        <div ref={bottomRef} className="h-1" />
      </div>
      <div className="sticky p-5 flex-0 border-t">
        <AssistantChatForm
          textAreaRef={textAreaRef}
          key={'new-thread-form'}
          id={'new-thread-form'}
          commandsOpen={commandsOpen}
          setCommandsOpen={setCommandsOpen}
          onSubmit={form.handleSubmit((data: z.infer<typeof FormSchema>) => {
            onSubmit(data.chat)
          })}
          value={value}
          placeholder="e.g Create a Telegram-like chat application"
          disabled={loading}
          loading={loading}
          onValueChange={(e) => setValue(e.target.value)}
        />
      </div>
    </div>
  )
}
