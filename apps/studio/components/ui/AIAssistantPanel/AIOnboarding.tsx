import { motion } from 'framer-motion'
import { FileText } from 'lucide-react'
import { useRef } from 'react'

import { Button, cn } from 'ui'
import { AssistantChatForm } from './AssistantChatForm'
import { type SqlSnippet } from './AIAssistant.types'
import { codeSnippetPrompts, defaultPrompts } from './AIAssistant.prompts'

interface AIOnboardingProps {
  onMessageSend: (message: string) => void
  sqlSnippets?: SqlSnippet[]
  onRemoveSnippet?: (index: number) => void
  suggestions?: {
    title?: string
    prompts?: { label: string; description: string }[]
  }
  value: string
  onValueChange: (value: string) => void
}

export const AIOnboarding = ({
  onMessageSend,
  sqlSnippets,
  onRemoveSnippet,
  suggestions,
  value,
  onValueChange,
}: AIOnboardingProps) => {
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const prompts = suggestions?.prompts
    ? suggestions.prompts.map((suggestion) => ({
        title: suggestion.label,
        prompt: suggestion.description,
        icon: <FileText strokeWidth={1.25} size={14} className="!w-4 !h-4" />,
      }))
    : sqlSnippets && sqlSnippets.length > 0
      ? codeSnippetPrompts
      : defaultPrompts

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header Section */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-xl w-full overflow-hiddenflex flex-col items-center"
        >
          <h2 className="text-2xl mb-6">How can I assist you?</h2>

          <div className="w-full mb-6">
            <AssistantChatForm
              textAreaRef={inputRef}
              className={cn(
                'z-20 [&>form>textarea]:text-base [&>form>textarea]:md:text-sm [&>form>textarea]:border-1 [&>form>textarea]:rounded-md [&>form>textarea]:!outline-none [&>form>textarea]:!ring-offset-0 [&>form>textarea]:!ring-0'
              )}
              loading={false}
              disabled={false}
              placeholder="Ask me anything..."
              value={value}
              onValueChange={(e) => onValueChange(e.target.value)}
              onSubmit={(finalMessage) => {
                if (finalMessage.trim()) {
                  onMessageSend(finalMessage)
                  onValueChange('')
                }
              }}
              sqlSnippets={sqlSnippets}
              onRemoveSnippet={onRemoveSnippet}
              snippetsClassName="text-left"
              includeSnippetsInMessage={true}
            />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {prompts.map((item, index) => (
              <motion.div
                key={index}
                initial={{ y: 5, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Button
                  size="small"
                  type="outline"
                  className="text-xs rounded-full !h-auto py-1 px-2 text-foreground-light"
                  onClick={() => {
                    onValueChange(item.prompt)
                    inputRef.current?.focus()
                  }}
                >
                  {item.title}
                </Button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
