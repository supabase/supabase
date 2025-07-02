import { motion } from 'framer-motion'
import { FileText, MessageCircleMore, WandSparkles } from 'lucide-react'
import { useRef, useState } from 'react'

import { Button, cn } from 'ui'
import { AssistantChatForm } from 'ui-patterns'

interface AIOnboardingProps {
  onMessageSend: (message: string) => void
}

export const AIOnboarding = ({ onMessageSend }: AIOnboardingProps) => {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const prompts = [
    {
      title: 'Generate a back-end',
      prompt:
        'Create a messaging app with users, messages, and an edge function that uses OpenAI to summarize message threads.',
      icon: <WandSparkles strokeWidth={1.25} size={14} />,
    },
    {
      title: 'Health check',
      prompt: 'Can you check if my database and edge functions are healthy?',
      icon: <MessageCircleMore strokeWidth={1.25} size={14} />,
    },
    {
      title: 'Query your data',
      prompt:
        'Give me a list of new users from the auth.users table who signed up in the past week',
      icon: <FileText strokeWidth={1.25} size={14} />,
    },
    {
      title: 'Set up RLS policies',
      prompt: 'Create RLS policies to ensure users can only access their own data',
      icon: <MessageCircleMore strokeWidth={1.25} size={14} />,
    },
    {
      title: 'Create a function',
      prompt: 'Create an edge function that summarises the contents of a table row using OpenAI',
      icon: <WandSparkles strokeWidth={1.25} size={14} />,
    },
    {
      title: 'Generate sample data',
      prompt: 'Generate sample data for a blog with users, posts, and comments tables',
      icon: <FileText strokeWidth={1.25} size={14} />,
    },
  ]

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header Section */}
      <div className="flex-1 flex flex-col items-center justify-center p-7">
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-md flex flex-col items-center"
        >
          <h2 className="text-2xl mb-6">How can I assist you?</h2>
          <div className="w-full mb-6">
            <AssistantChatForm
              textAreaRef={inputRef}
              className={cn(
                'z-20 [&>textarea]:text-base [&>textarea]:md:text-sm [&>textarea]:border-1 [&>textarea]:rounded-md [&>textarea]:!outline-none [&>textarea]:!ring-offset-0 [&>textarea]:!ring-0'
              )}
              loading={false}
              disabled={false}
              placeholder="Ask me anything..."
              value={value}
              onValueChange={(e) => setValue(e.target.value)}
              onSubmit={(event) => {
                event.preventDefault()
                if (value.trim()) {
                  onMessageSend(value)
                  setValue('')
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
                  className="text-xs rounded-full"
                  onClick={() => {
                    setValue(item.prompt)
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
