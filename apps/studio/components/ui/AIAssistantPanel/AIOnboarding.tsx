import { motion } from 'framer-motion'
import { FileText } from 'lucide-react'

import { Button } from 'ui'
import { type SqlSnippet } from './AIAssistant.types'
import { codeSnippetPrompts, defaultPrompts } from './AIAssistant.prompts'

interface AIOnboardingProps {
  sqlSnippets?: SqlSnippet[]
  suggestions?: {
    title?: string
    prompts?: { label: string; description: string }[]
  }
  onValueChange: (value: string) => void
  onFocusInput?: () => void
}

export const AIOnboarding = ({
  sqlSnippets,
  suggestions,
  onValueChange,
  onFocusInput,
}: AIOnboardingProps) => {
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
    <div className="w-full mb-6">
      <div className="px-4 mb-4">
        <h2 className="heading-section text-foreground mb-1">How can I assist you?</h2>
        <p className="text-foreground-light text-sm">
          Generate SQL, RLS policies and edge functions, debug issues or check on your project
          health.
        </p>
      </div>
      <div>
        {prompts.map((item, index) => (
          <motion.div
            key={index}
            initial={{ y: 5, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Button
              size="small"
              type="text"
              className="w-full justify-start"
              icon={<FileText strokeWidth={1.5} size={14} className="text-foreground-light" />}
              onClick={() => {
                onValueChange(item.prompt)
                onFocusInput?.()
              }}
            >
              {item.title}
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
