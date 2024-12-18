import { useChat } from 'ai/react'
import { Button, Textarea } from 'ui'
import { ArrowUp } from 'lucide-react'
import { motion } from 'framer-motion'
import { Markdown } from 'components/interfaces/Markdown'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { Label_Shadcn_ } from 'ui'
import { BASE_PATH } from 'lib/constants'
import { useState, useEffect } from 'react'

interface SupabaseService {
  name: 'Auth' | 'Storage' | 'Database' | 'Edge Function' | 'Cron' | 'Queues' | 'Vector'
  reason: string
}

interface Props {
  aiDescription?: string
  onSqlGenerated: (sql: string) => void
  onServicesUpdated: (services: SupabaseService[]) => void
  onTitleUpdated: (title: string) => void
  isOneOff: boolean
}

export const SchemaGenerator = ({
  aiDescription = '',
  onSqlGenerated,
  onServicesUpdated,
  onTitleUpdated,
  isOneOff = false,
}: Props) => {
  const [input, setInput] = useState('')
  const [hasSql, setHasSql] = useState(false)

  const {
    messages,
    handleInputChange,
    append,
    isLoading: isMessagesLoading,
  } = useChat({
    api: `${BASE_PATH}/api/ai/onboarding/design`,
    id: 'schema-generator',
    maxSteps: 7,
    onFinish: () => {
      setInput('')
    },
    async onToolCall({ toolCall }) {
      if (toolCall.toolName === 'executeSql') {
        try {
          const sql = (toolCall.args as { sql: string }).sql
          setHasSql(true)
          onSqlGenerated(sql)
          return {
            success: true,
            message: 'Database successfully updated. Respond with next steps.',
          }
        } catch (error) {
          console.error('Failed to execute SQL:', error)
          return {
            success: false,
            error: `SQL execution failed: ${error instanceof Error ? error.message : String(error)}`,
          }
        }
      }

      if (toolCall.toolName === 'setServices') {
        const newServices = (toolCall.args as { services: SupabaseService[] }).services
        onServicesUpdated(newServices)
        return 'Services updated successfully'
      }

      if (toolCall.toolName === 'setTitle') {
        const newTitle = (toolCall.args as { title: string }).title
        onTitleUpdated(newTitle)
        return 'Title updated successfully'
      }
    },
  })

  useEffect(() => {
    if (aiDescription) {
      append({ role: 'user', content: aiDescription })
    }
  }, [])

  return (
    <div>
      {!isOneOff && (
        <div className="flex justify-between w-full block items-center mb-4">
          <Label_Shadcn_ className="text-foreground-light flex-1">
            Generate a starting schema
          </Label_Shadcn_>
          {messages?.length > 0 && (
            <Button
              type="outline"
              size="tiny"
              onClick={() => {
                append({
                  role: 'user',
                  content: 'Undo everything you have done and create a blank database',
                })
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
          messages[messages.length - 1].content.length > 0 &&
          ((isOneOff && !hasSql) || !isOneOff) && (
            <div className="px-4 py-3 border-b space-y-1">
              <p>
                <Markdown
                  className="text-foreground-light"
                  content={
                    messages.filter((m) => m.role === 'assistant').slice(-1)[0]?.content || ''
                  }
                />
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
              handleInputChange(e)
              setInput(e.target.value)
            }}
            placeholder={messages.length > 0 ? 'Make an edit...' : 'Describe your application...'}
            rows={Math.max(3, Math.min(input.split('\n').length, 10))}
            onKeyDown={(e) => {
              if (!(e.target instanceof HTMLTextAreaElement)) {
                return
              }
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault()
                setHasSql(false)
                append({ role: 'user', content: input })
              }
            }}
          />
          <Button
            onClick={(e) => {
              e.preventDefault()
              setHasSql(false)
              append({ role: 'user', content: input })
            }}
            disabled={isMessagesLoading}
            loading={isMessagesLoading}
            icon={<ArrowUp size={16} />}
            className="rounded-full absolute bottom-2 right-2"
          ></Button>
        </div>
      </div>
    </div>
  )
}
