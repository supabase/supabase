import { MessageSquarePlus, NotebookText, SquareCode } from 'lucide-react'
import { useState } from 'react'

import { useCreateChat, useCreateNotebook, useCreateQuery } from './hooks'
import { CHAT_TEMPLATES, NOTEBOOK_TEMPLATES } from './templates'
import { ActionCard } from '@/components/layouts/Tabs/ActionCard'
import { AssistantChatForm } from '@/components/ui/AIAssistantPanel/AssistantChatForm'

export const ExplorerHomeTab = () => {
  const { createNotebook } = useCreateNotebook()
  const { createQuery } = useCreateQuery()
  const { createChat } = useCreateChat()

  const [value, setValue] = useState<string>('')

  return (
    <div className="bg-surface-100 h-full flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-center flex-col gap-y-1 mb-12">
          <h1 className="heading-section">Explore your project</h1>
          <p className="text-foreground-lighter text-sm">
            Ask the Assistant about your data, or begin with a new resource.
          </p>
        </div>

        <AssistantChatForm
          loading={false}
          className="bg"
          placeholder="Ask anything about your project"
          value={value}
          onValueChange={(e) => setValue(e.target.value)}
          onSubmit={(message) => createChat({ initialMessage: message })}
        />

        <section className="mt-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ActionCard
              icon={<NotebookText className="h-4 w-4 text-foreground" strokeWidth={1.5} />}
              title="Create a notebook"
              description="Combine notes, queries, and results"
              bgColor="bg-blue-500"
              onClick={() => createNotebook()}
            />
            <ActionCard
              icon={<SquareCode className="h-4 w-4 text-foreground" strokeWidth={1.5} />}
              title="Run SQL"
              description="Write and run an ad-hoc query"
              bgColor="bg-blue-500"
              onClick={createQuery}
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
                icon={<MessageSquarePlus className="h-4 w-4 text-foreground" strokeWidth={1.5} />}
                title={template.title}
                description={template.description}
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
  )
}
