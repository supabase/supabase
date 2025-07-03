import { motion } from 'framer-motion'
import { Code, FileText, Heart, MessageCircleMore, Shield, WandSparkles } from 'lucide-react'
import { useRef } from 'react'

import { Button, cn } from 'ui'
import { AssistantChatForm } from 'ui-patterns'
import { CollapsibleCodeBlock } from './CollapsibleCodeBlock'

interface AIOnboardingProps {
  onMessageSend: (message: string) => void
  sqlSnippets?: string[]
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

  const defaultPrompts = [
    {
      title: 'Create a back-end',
      prompt:
        'Create a messaging app with users, messages, and an edge function that uses OpenAI to summarize message threads.',
      icon: <WandSparkles strokeWidth={1.25} size={14} className="!w-4 !h-4" />,
    },
    {
      title: 'Health check',
      prompt: 'Can you check if my database and edge functions are healthy?',
      icon: <Heart strokeWidth={1.25} size={14} className="!w-4 !h-4" />,
    },
    {
      title: 'Query your data',
      prompt:
        'Give me a list of new users from the auth.users table who signed up in the past week',
      icon: <FileText strokeWidth={1.25} size={14} className="!w-4 !h-4" />,
    },
    {
      title: 'Set up RLS policies',
      prompt: 'Create RLS policies to ensure users can only access their own data',
      icon: <Shield strokeWidth={1.25} size={14} className="!w-4 !h-4" />,
    },
    {
      title: 'Create a function',
      prompt: 'Create an edge function that summarises the contents of a table row using OpenAI',
      icon: <Code strokeWidth={1.25} size={14} className="!w-4 !h-4" />,
    },
    {
      title: 'Generate sample data',
      prompt: 'Generate sample data for a blog with users, posts, and comments tables',
      icon: <FileText strokeWidth={1.25} size={14} className="!w-4 !h-4" />,
    },
  ]

  const codeSnippetPrompts = [
    {
      title: 'Explain code',
      prompt: 'Explain what this code does and how it works',
      icon: <FileText strokeWidth={1.25} size={14} className="!w-4 !h-4" />,
    },
    {
      title: 'Improve code',
      prompt: 'How can I improve this code for better performance and readability?',
      icon: <WandSparkles strokeWidth={1.25} size={14} className="!w-4 !h-4" />,
    },
    {
      title: 'Debug issues',
      prompt: 'Help me debug any potential issues with this code',
      icon: <MessageCircleMore strokeWidth={1.25} size={14} className="!w-4 !h-4" />,
    },
  ]

  // Use suggestions if available, otherwise use code-specific prompts if snippets exist, or default prompts
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
            {sqlSnippets && sqlSnippets.length > 0 && (
              <div className="mx-4">
                {sqlSnippets.map((snippet: string, index: number) => (
                  <CollapsibleCodeBlock
                    key={index}
                    hideLineNumbers
                    value={snippet}
                    onRemove={() => onRemoveSnippet?.(index)}
                    className="text-xs rounded-b-none border-b-0 text-left"
                  />
                ))}
              </div>
            )}
            <AssistantChatForm
              textAreaRef={inputRef}
              className={cn(
                'z-20 [&>textarea]:text-base [&>textarea]:md:text-sm [&>textarea]:border-1 [&>textarea]:rounded-md [&>textarea]:!outline-none [&>textarea]:!ring-offset-0 [&>textarea]:!ring-0'
              )}
              loading={false}
              disabled={false}
              placeholder="Ask me anything..."
              value={value}
              onValueChange={(e) => onValueChange(e.target.value)}
              onSubmit={(event) => {
                event.preventDefault()
                if (value.trim()) {
                  onMessageSend(value)
                  onValueChange('')
                }
              }}
              autoFocus
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
                  icon={item.icon}
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
