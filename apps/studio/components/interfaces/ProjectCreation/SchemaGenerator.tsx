import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useEffect, useState } from 'react'

import { Markdown } from 'components/interfaces/Markdown'
import { onErrorChat } from 'components/ui/AIAssistantPanel/AIAssistant.utils'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { BASE_PATH } from 'lib/constants'
import { AiIconAnimation, Button, Label_Shadcn_, Textarea } from 'ui'

interface SupabaseService {
  name: 'Auth' | 'Storage' | 'Database' | 'Edge Function' | 'Cron' | 'Queues' | 'Vector'
  reason: string
}

interface SchemaGeneratorProps {
  step: 'initial' | 'second'
  onSqlGenerated: (sql: string) => void
  onReset?: () => void
  onServicesUpdated: (services: SupabaseService[]) => void
  onTitleUpdated: (title: string) => void
  isOneOff?: boolean
}

export const SchemaGenerator = ({
  step,
  onSqlGenerated,
  onServicesUpdated,
  onTitleUpdated,
  onReset,
  isOneOff = false,
}: SchemaGeneratorProps) => {
  const [input, setInput] = useState('')
  const [hasSql, setHasSql] = useState(false)

  const [promptIntendSent, setPromptIntendSent] = useState(false)
  const { mutate: sendEvent } = useSendEventMutation()

  const { messages, setMessages, sendMessage, status, addToolResult } = useChat({
    id: 'schema-generator',
    onError: onErrorChat,
    onFinish: () => {
      setInput('')
    },
    async onToolCall({ toolCall }) {
      if (toolCall.toolName === 'executeSql') {
        try {
          const sql = (toolCall.input as { sql: string }).sql
          setHasSql(true)
          onSqlGenerated(sql)
          addToolResult({
            tool: toolCall.toolName,
            toolCallId: toolCall.toolCallId,
            output: 'Database successfully updated. Respond with next steps.',
          })
        } catch (error) {
          console.error('Failed to execute SQL:', error)
          addToolResult({
            tool: toolCall.toolName,
            toolCallId: toolCall.toolCallId,
            output: `SQL execution failed: ${error instanceof Error ? error.message : String(error)}`,
          })
        }
      }

      if (toolCall.toolName === 'reset') {
        try {
          setHasSql(false)
          onSqlGenerated('')
          if (onReset) {
            onReset()
          }
          addToolResult({
            tool: toolCall.toolName,
            toolCallId: toolCall.toolCallId,
            output: 'Database successfully reset',
          })
        } catch (error) {
          console.error('Failed to reset the database', error)
          addToolResult({
            tool: toolCall.toolName,
            toolCallId: toolCall.toolCallId,
            output: `Resetting the database failed: ${error instanceof Error ? error.message : String(error)}`,
          })
        }
      }

      if (toolCall.toolName === 'setServices') {
        const newServices = (toolCall.input as { services: SupabaseService[] }).services
        onServicesUpdated(newServices)
        addToolResult({
          tool: toolCall.toolName,
          toolCallId: toolCall.toolCallId,
          output: 'Services updated successfully',
        })
      }

      if (toolCall.toolName === 'setTitle') {
        const newTitle = (toolCall.input as { title: string }).title
        onTitleUpdated(newTitle)
        addToolResult({
          tool: toolCall.toolName,
          toolCallId: toolCall.toolCallId,
          output: 'Title updated successfully',
        })
      }
    },
    transport: new DefaultChatTransport({
      api: `${BASE_PATH}/api/ai/onboarding/design`,
    }),
  })

  const isMessagesLoading = status === 'submitted' || status === 'streaming'

  useEffect(() => {
    if (isOneOff) {
      setMessages([])
      setInput('')
    }
  }, [isOneOff, setMessages])

  const sendUserMessage = (content: string) => {
    const payload = {
      role: 'user' as const,
      createdAt: new Date(),
      parts: [{ type: 'text' as const, text: content }],
      id: `msg-${Date.now()}`,
    }
    sendMessage(payload)
  }

  const getLastAssistantMessage = () => {
    const lastAssistantMessage = messages.filter((m) => m.role === 'assistant').slice(-1)[0]
    if (!lastAssistantMessage?.parts) return ''

    const textPart = lastAssistantMessage.parts.find((part: any) => part.type === 'text') as
      | { text: string }
      | undefined
    return textPart?.text || ''
  }

  return (
    <div>
      {!isOneOff && (
        <div className="flex justify-between w-full items-center mb-4">
          <Label_Shadcn_ className="text-foreground-light flex-1">
            Generate a starting schema
          </Label_Shadcn_>
          {messages?.length > 0 && (
            <Button
              type="outline"
              size="tiny"
              onClick={() => {
                setInput('Reset the database, services and start over')
                sendUserMessage('Reset the database, services and start over')
              }}
            >
              Reset
            </Button>
          )}
        </div>
      )}
      <div className="rounded-md border bg-surface-100">
        {messages.length > 0 &&
          messages[messages.length - 1].role === 'assistant' &&
          getLastAssistantMessage() &&
          ((isOneOff && !hasSql) || !isOneOff) && (
            <div className="px-4 py-3 border-b space-y-1">
              <p>
                <Markdown className="text-foreground-light" content={getLastAssistantMessage()} />
              </p>
            </div>
          )}
        <div className="w-full relative text-sm border-none block bg-muted mb-0 text-foreground-light placeholder:text-foreground-lighter">
          <Textarea
            id="input"
            name="prompt"
            autoComplete="off"
            className="text-sm w-full bg-transparent border-none resize-none px-4 pt-3 pb-8"
            value={input}
            disabled={isMessagesLoading}
            onChange={(e) => {
              setInput(e.target.value)
            }}
            placeholder={messages.length > 0 ? 'Make an edit...' : 'Describe your application...'}
            rows={Math.max(3, Math.min(input.split('\n').length, 10))}
            onKeyDown={(e) => {
              if (!(e.target instanceof HTMLTextAreaElement)) {
                return
              }
              if (!promptIntendSent && e.target.value.length > 5) {
                // distinguish between a new prompt or an edit
                const isNewPrompt = messages.length == 0
                // distinguish between initial step or second step
                if (step === 'initial') {
                  sendEvent({
                    action: 'project_creation_initial_step_prompt_intended',
                    properties: {
                      isNewPrompt,
                    },
                  })
                } else {
                  sendEvent({
                    action: 'project_creation_second_step_prompt_intended',
                    properties: {
                      isNewPrompt,
                    },
                  })
                }
                setPromptIntendSent(true)
              }
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault()
                setHasSql(false)
                sendUserMessage(input)
              }
            }}
          />
          <Button
            onClick={(e) => {
              e.preventDefault()
              setHasSql(false)
              sendUserMessage(input)
            }}
            disabled={isMessagesLoading}
            loading={isMessagesLoading}
            icon={<AiIconAnimation size={16} />}
            className="absolute bottom-2 right-2"
          >
            Generate
          </Button>
        </div>
      </div>
    </div>
  )
}
