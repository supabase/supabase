import { zodResolver } from '@hookform/resolvers/zod'
import { Message as MessageType } from 'ai'
import { useTelemetryProps } from 'common'
import Telemetry from 'lib/telemetry'
import { compact, last } from 'lodash'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/router'
import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import {
  Button,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  cn,
} from 'ui'
import { AiIcon } from 'ui-patterns/Cmdk'
import * as z from 'zod'

import { useLocalStorageQuery, useSelectedOrganization } from 'hooks'
import { IS_PLATFORM, LOCAL_STORAGE_KEYS, OPT_IN_TAGS } from 'lib/constants'
import { useProfile } from 'lib/profile'
import { useAppStateSnapshot } from 'state/app-state'
import { DiffType } from '../SQLEditor.types'
import Message from './Message'

export type MessageWithDebug = MessageType & { isDebug: boolean }

interface AiAssistantPanelProps {
  messages: MessageWithDebug[]
  selectedMessage?: string
  loading: boolean
  onSubmit: (s: string) => void
  onDiff: ({ id, diffType, sql }: { id: string; diffType: DiffType; sql: string }) => void
  onClose: () => void
  onChange: (value: boolean) => void
}

export const AiAssistantPanel = ({
  messages,
  selectedMessage,
  loading,
  onSubmit,
  onDiff,
  onClose,
  onChange,
}: AiAssistantPanelProps) => {
  const router = useRouter()
  const { profile } = useProfile()
  const snap = useAppStateSnapshot()
  const organization = useSelectedOrganization()
  const bottomRef = useRef<HTMLDivElement>(null)
  const telemetryProps = useTelemetryProps()

  const isOptedInToAI = organization?.opt_in_tags?.includes(OPT_IN_TAGS.AI_SQL) ?? false
  const [hasEnabledAISchema] = useLocalStorageQuery(LOCAL_STORAGE_KEYS.SQL_EDITOR_AI_SCHEMA, true)
  const includeSchemaMetadata = (isOptedInToAI || !IS_PLATFORM) && hasEnabledAISchema

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
    <div className="flex flex-col h-full min-w-[400px] w-[400px] border-l border-control">
      <div
        className={cn(
          'overflow-auto flex-1',
          messages.length === 0 ? 'flex flex-col justify-between' : ''
        )}
      >
        <Message
          key="zero"
          role="assistant"
          content={`Hi${
            name ? ' ' + name : ''
          }, how can I help you? I'm powered by AI, so surprises and mistakes are possible.
        Make sure to verify any generated code or suggestions, and share feedback so that we can
        learn and improve.`}
          action={
            <Button type="default" onClick={onClose}>
              Close Assistant
            </Button>
          }
        >
          <Button
            type="default"
            className="w-min"
            icon={
              <div
                className={cn(
                  'w-2 h-2 rounded-full',
                  includeSchemaMetadata ? 'bg-brand' : 'border border-stronger'
                )}
              />
            }
            onClick={() => snap.setShowAiSettingsModal(true)}
          >
            {includeSchemaMetadata ? 'Include' : 'Exclude'} database metadata in queries
          </Button>
        </Message>

        {messages.map((m) => (
          <Message
            key={`message-${m.id}`}
            name={m.name}
            role={m.role}
            content={m.content}
            createdAt={new Date(m.createdAt || new Date()).getTime()}
            isDebug={m.isDebug}
            isSelected={selectedMessage === m.id}
            onDiff={(diffType, sql) => onDiff({ id: m.id, diffType, sql })}
          />
        ))}

        {pendingReply && <Message key="thinking" role="assistant" content="Thinking..." />}

        <div ref={bottomRef} className="h-1" />
        {/* <div className="grid grid-cols-12 gap-2 p-2">
          {ASSISTANT_TEMPLATES.map((template) => (
            <CardButton
              hideChevron
              key={template.name}
              title={template.name}
              description={template.description}
              className="!p-3 col-span-12 h-auto [&>div>div]:!mt-0 [&>div>h5]:text-sm"
              onClick={() => onSubmit(template.prompt)}
            />
          ))}
        </div> */}
      </div>

      <Form_Shadcn_ {...form}>
        <form
          className="sticky p-5 flex-0 border-t"
          onSubmit={form.handleSubmit((data: z.infer<typeof FormSchema>) => {
            onSubmit(data.chat)
            Telemetry.sendEvent(
              {
                category: 'sql_editor_ai_assistant',
                action: 'ai_suggestion_asked',
                label: 'sql-editor-ai-assistant',
              },
              telemetryProps,
              router
            )
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
                      placeholder="Ask a question about your SQL query"
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
