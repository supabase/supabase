import { MessageSquarePlus } from 'lucide-react'
import type { ReactNode } from 'react'

import { CHAT_TEMPLATES, codeSnippetPrompts } from './AIAssistant.prompts'
import { ActionCard } from '@/components/layouts/Tabs/ActionCard'
import type { SqlSnippet } from '@/state/ai-assistant-state'

interface AIOnboardingProps {
  children: ReactNode
  sqlSnippets?: SqlSnippet[]
  suggestions?: {
    title?: string
    prompts?: { label: string; description: string }[]
  }
  onValueChange: (value: string) => void
  onFocusInput?: () => void
}

export const AIOnboarding = ({
  children,
  sqlSnippets,
  suggestions,
  onValueChange,
  onFocusInput,
}: AIOnboardingProps) => {
  const suggestionPrompts = suggestions?.prompts ?? []
  const hasSuggestions = suggestionPrompts.length > 0
  let templates = CHAT_TEMPLATES

  if (hasSuggestions) {
    templates = suggestionPrompts.map((suggestion) => ({
      title: suggestion.label,
      icon: MessageSquarePlus,
      initialMessage: suggestion.description,
    }))
  } else if (sqlSnippets && sqlSnippets.length > 0) {
    templates = codeSnippetPrompts.map((prompt) => ({
      title: prompt.title,
      icon: prompt.icon,
      initialMessage: prompt.prompt,
    }))
  }

  return (
    <div className="@container flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-8">
      <div className="m-auto w-full max-w-2xl">
        <div className="mb-6 text-center">
          <h2 className="heading-section">Chat with your project</h2>
        </div>

        {children}

        <section className="mt-8 flex flex-col gap-y-3">
          {hasSuggestions && suggestions?.title && (
            <h3 className="text-sm font-medium text-foreground">{suggestions.title}</h3>
          )}
          <div className="grid grid-cols-1 gap-3 @2xl:grid-cols-3">
            {templates.map((template) => (
              <button
                key={template.title}
                type="button"
                tabIndex={0}
                className="rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                onClick={() => {
                  onValueChange(template.initialMessage)
                  onFocusInput?.()
                }}
              >
                <ActionCard
                  icon={<template.icon className="h-4 w-4 text-foreground" strokeWidth={1.5} />}
                  title={template.title}
                  bgColor="bg-brand-400"
                />
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
