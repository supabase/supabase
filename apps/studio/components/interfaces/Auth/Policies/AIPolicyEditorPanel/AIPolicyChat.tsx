import { zodResolver } from '@hookform/resolvers/zod'
import { compact, last } from 'lodash'
import { ArrowDownRight, Loader2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  AiIcon,
  Button,
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
  Collapsible_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  Form_Shadcn_,
  IconChevronDown,
  IconSettings,
  Input_Shadcn_,
} from 'ui'
import * as z from 'zod'

import { useProfile } from 'lib/profile'
import { useAppStateSnapshot } from 'state/app-state'
import { HELP_PRESETS, MessageWithDebug } from './AIPolicyEditorPanel.utils'
import Message from './Message'
import { m } from 'framer-motion'

interface AIPolicyChatProps {
  messages: MessageWithDebug[]
  loading: boolean
  onSubmit: (s: string) => void
  onDiff: (s: string) => void
  onChange: (value: boolean) => void
}

export const AIPolicyChat = ({
  messages,
  loading,
  onSubmit,
  onDiff,
  onChange,
}: AIPolicyChatProps) => {
  const { profile } = useProfile()
  const snap = useAppStateSnapshot()
  const bottomRef = useRef<HTMLDivElement>(null)

  const [showDetails, setShowDetails] = useState(false)

  const name = compact([profile?.first_name, profile?.last_name]).join(' ')

  const FormSchema = z.object({ chat: z.string() })
  const form = useForm<z.infer<typeof FormSchema>>({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    resolver: zodResolver(FormSchema),
    defaultValues: { chat: '' },
  })
  const formChatValue = form.getValues().chat
  const pendingReply = loading && last(messages)?.role === 'user'

  // try to scroll on each rerender to the bottom
  useEffect(() => {
    if (loading && bottomRef.current) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 500)
    }
  })

  useEffect(() => {
    if (!loading) {
      form.setValue('chat', '')
      form.setFocus('chat')
    }
  }, [loading])

  useEffect(() => {
    onChange(formChatValue.length === 0)
  }, [formChatValue])

  return (
    <div id={'ai-chat-assistant'} className="flex flex-col h-full max-w-full">
      <div className="overflow-auto flex-1">
        <Message
          key="zero"
          role="assistant"
          content={`Hi${
            name ? ' ' + name : ''
          }, how can I help you? I'm powered by AI, so surprises and mistakes are possible.
        Make sure to verify any generated code or suggestions, and share feedback so that we can
        learn and improve.`}
        >
          <div>
            <Button
              type="default"
              icon={<IconSettings strokeWidth={1.5} />}
              onClick={() => snap.setShowAiSettingsModal(true)}
            >
              AI Settings
            </Button>
          </div>
        </Message>

        {messages.map((m) => (
          <Message
            key={`message-${m.id}`}
            name={m.name}
            role={m.role}
            content={m.content}
            createdAt={new Date(m.createdAt || new Date()).getTime()}
            isDebug={m.isDebug}
            onDiff={onDiff}
          />
        ))}

        {pendingReply && <Message key="thinking" role="assistant" content="Thinking..." />}

        <div ref={bottomRef} className="h-1" />
      </div>

      <Collapsible_Shadcn_
        className="-mt-1.5 pb-1.5"
        open={showDetails}
        onOpenChange={() => setShowDetails(!showDetails)}
      >
        <CollapsibleTrigger_Shadcn_ className="group pl-6 font-normal p-0 [&[data-state=open]>div>svg]:!-rotate-180">
          <div className="flex items-center gap-x-2 w-full">
            <p className="text-xs text-foreground-light group-hover:text-foreground transition">
              Not sure where to start?
            </p>
            <IconChevronDown
              className="transition-transform duration-200"
              strokeWidth={1.5}
              size={14}
            />
          </div>
        </CollapsibleTrigger_Shadcn_>
        <CollapsibleContent_Shadcn_ className="pl-6 my-2 grid gap-1.5">
          {HELP_PRESETS.map((text: string) => (
            <Button
              type="text"
              key={text}
              className="flex justify-start p-0 hover:bg-transparent hover:underline text-foreground-light"
              onClick={() => {
                form.setValue('chat', text)
                form.setFocus('chat')
              }}
            >
              <div className="text-sm flex items-center gap-2">
                {text}
                <ArrowDownRight
                  className="transition-transform duration-200"
                  strokeWidth={1.5}
                  size={14}
                />
              </div>
            </Button>
          ))}
        </CollapsibleContent_Shadcn_>
      </Collapsible_Shadcn_>

      <Form_Shadcn_ {...form}>
        <form
          id="rls-chat"
          className="sticky p-5 flex-0 border-t"
          onSubmit={form.handleSubmit((data: z.infer<typeof FormSchema>) => {
            onSubmit(data.chat)
          })}
        >
          <FormField_Shadcn_
            control={form.control}
            name="chat"
            render={({ field }) => (
              <FormItem_Shadcn_>
                <FormControl_Shadcn_>
                  <div className="relative">
                    <AiIcon className="absolute top-2 left-3 [&>div>div]:border-black dark:[&>div>div]:border-white" />
                    <Input_Shadcn_
                      {...field}
                      autoComplete="off"
                      disabled={loading}
                      autoFocus
                      className={`bg-surface-300 dark:bg-black rounded-full pl-10 ${
                        loading ? 'pr-10' : ''
                      }`}
                      placeholder="Ask for some changes to your policy"
                    />
                    {loading && <Loader2 className="absolute top-2 right-3 animate-spin" />}
                  </div>
                </FormControl_Shadcn_>
              </FormItem_Shadcn_>
            )}
          />
        </form>
      </Form_Shadcn_>
    </div>
  )
}
