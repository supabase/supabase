import { NotebookText, SquareCode } from 'lucide-react'
import { useState } from 'react'
import { cn } from 'ui'

import { useCreateChat, useCreateNotebook, useCreateQuery } from './hooks'
import { NOTEBOOK_TEMPLATES } from './templates'
import { ActionCard } from '@/components/layouts/Tabs/ActionCard'
import { CHAT_TEMPLATES } from '@/components/ui/AIAssistantPanel/AIAssistant.prompts'
import { AssistantAgentHarnessFooter } from '@/components/ui/AIAssistantPanel/AssistantAgentHarnessFooter'
import { AssistantChatForm } from '@/components/ui/AIAssistantPanel/AssistantChatForm'

export const ExplorerHomeTab = () => {
  const { createNotebook } = useCreateNotebook()
  const { createQuery } = useCreateQuery()
  const { createChat } = useCreateChat()

  const [value, setValue] = useState<string>('')

  return (
    <div className="flex flex-col h-full">
      <div
        className={cn(
          'flex-grow min-h-0 overflow-y-auto bg-surface-100 h-full',
          'flex flex-col items-center px-10'
        )}
      >
        <div className="w-full max-w-2xl my-auto py-10">
          <div className="text-center mb-6">
            <h1 className="heading-section">Run SQL. Chat with your project. Create a Notebook</h1>
          </div>

          <AssistantChatForm
            loading={false}
            className="bg"
            placeholder="Explore your data, check project health, create a notebook..."
            value={value}
            onValueChange={(e) => setValue(e.target.value)}
            onSubmit={(message) => createChat({ initialMessage: message })}
          />
          <AssistantAgentHarnessFooter />

          <section className="mt-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ActionCard
                icon={<SquareCode className="h-4 w-4 text-foreground" strokeWidth={1.5} />}
                title="Run SQL"
                description="Write and run an ad-hoc query"
                bgColor="bg-blue-500"
                onClick={() => createQuery()}
              />
              <ActionCard
                icon={<NotebookText className="h-4 w-4 text-foreground" strokeWidth={1.5} />}
                title="Create a notebook"
                description="Combine notes, queries, and results"
                bgColor="bg-blue-500"
                onClick={() => createNotebook()}
              />
            </div>
          </section>

          <section className="mt-8 flex flex-col gap-y-3">
            <h2 className="text-sm font-medium text-foreground">Start with a template</h2>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {NOTEBOOK_TEMPLATES.map((template) => (
                <ActionCard
                  key={template.title}
                  icon={<NotebookText className="h-4 w-4 text-foreground" strokeWidth={1.5} />}
                  title={template.title}
                  description={template.description}
                  bgColor="bg-blue-500"
                  onClick={() =>
                    createNotebook({ name: template.title, cells: template.buildCells() })
                  }
                />
              ))}
              {CHAT_TEMPLATES.map((template) => (
                <ActionCard
                  key={template.title}
                  icon={<template.icon className="h-4 w-4 text-foreground" strokeWidth={1.5} />}
                  title={template.title}
                  bgColor="bg-blue-500"
                  onClick={() =>
                    createChat({ name: template.title, initialMessage: template.initialMessage })
                  }
                />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
