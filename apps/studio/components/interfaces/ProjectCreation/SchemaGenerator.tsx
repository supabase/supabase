import { useChat } from 'ai/react'
import { Button } from 'ui'
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
}

export const SchemaGenerator = ({
  aiDescription = '',
  onSqlGenerated,
  onServicesUpdated,
  onTitleUpdated,
}: Props) => {
  const [input, setInput] = useState('')

  const {
    messages,
    handleInputChange,
    append,
    isLoading: isMessagesLoading,
  } = useChat({
    api: `${BASE_PATH}/api/ai/onboarding/design`,
    id: 'schema-generator',
    maxSteps: 7,
    async onToolCall({ toolCall }) {
      if (toolCall.toolName === 'executeSql') {
        try {
          const sql = (toolCall.args as { sql: string }).sql
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
    <FormItemLayout>
      <div className="flex justify-between w-full block items-center mb-4">
        <Label_Shadcn_ className="flex-1">Generate a starting schema</Label_Shadcn_>
        {messages?.length > 0 && (
          <Button
            type="outline"
            size="small"
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
      <div className="rounded-md border bg-surface-100">
        {messages.length > 0 && (
          <div className="px-4 py-3 border-b space-y-1">
            <p className="text-foreground-light">
              {messages.filter((m) => m.role === 'user').slice(-1)[0]?.content || ''}
            </p>
            <p>
              {messages[messages.length - 1].role === 'user' ||
              messages[messages.length - 1].content === '' ? (
                <motion.div className="text-foreground-lighter text-sm flex gap-1.5 items-center">
                  <span>Thinking</span>
                  <div className="flex gap-1">
                    {[0, 0.3, 0.6].map((delay) => (
                      <motion.span
                        key={delay}
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          delay,
                        }}
                      >
                        .
                      </motion.span>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <Markdown
                  className="text-foreground"
                  content={
                    messages.filter((m) => m.role === 'assistant').slice(-1)[0]?.content || ''
                  }
                />
              )}
            </p>
          </div>
        )}
        <div className="w-full relative text-sm border-none block bg-muted mb-0 text-foreground-light placeholder:text-foreground-lighter">
          <textarea
            id="input"
            name="prompt"
            autoComplete="off"
            className="text-sm w-full bg-transparent border-none px-4 pt-2 py-8 resize-none focus:outline-none focus:ring-0 resize-none"
            value={input}
            disabled={isMessagesLoading}
            onChange={(e) => {
              handleInputChange(e)
              setInput(e.target.value)
            }}
            placeholder={messages.length > 0 ? 'Make an edit...' : 'Describe your application...'}
            autoFocus
            rows={
              messages.length > 0
                ? Math.max(1, Math.min(input.split('\n').length, 10))
                : Math.max(3, Math.min(input.split('\n').length, 10))
            }
            onKeyDown={(e) => {
              if (!(e.target instanceof HTMLTextAreaElement)) {
                return
              }
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault()
                append({ role: 'user', content: input })
                setInput('')
              }
            }}
          />
          <Button
            onClick={(e) => {
              e.preventDefault()
              append({ role: 'user', content: input })
              setInput('')
            }}
            className="rounded-full w-7 h-7 absolute bottom-2 right-2 justify-center items-center p-0"
          >
            <ArrowUp size={16} />
          </Button>
        </div>
      </div>
    </FormItemLayout>
  )
}
