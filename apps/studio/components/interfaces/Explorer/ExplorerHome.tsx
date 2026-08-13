import { untrustedSql } from '@supabase/pg-meta'
import { MessageCirclePlus, NotebookText, SquareCode } from 'lucide-react'
import { useState } from 'react'

import { useCreateNotebook } from './hooks'
import { ActionCard } from '@/components/layouts/Tabs/ActionCard'
import { AssistantChatForm } from '@/components/ui/AIAssistantPanel/AssistantChatForm'
import { generateUuid } from '@/lib/api/snippets.browser'
import { AssistantModel } from '@/state/ai-assistant-state'

export const ExplorerHome = () => {
  const { createNotebook } = useCreateNotebook()

  const [value, setValue] = useState<string>('')
  const [selectedModel, setSelectedModal] = useState<AssistantModel>('gpt-5.4-nano')

  const onCreateNotebook = () => {}
  const onCreateChat = () => {}

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
          selectedModel={selectedModel}
          onSelectModel={setSelectedModal}
          onSubmit={() => {}}
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
              onClick={() =>
                createNotebook({
                  name: 'SQL query',
                  cells: [
                    {
                      _tag: 'database_cell',
                      id: generateUuid(),
                      unchecked_sql: untrustedSql(''),
                      row_limit: 100,
                    },
                  ],
                })
              }
            />
          </div>
        </section>

        <section className="mt-8 flex flex-col gap-y-3">
          <h2 className="text-sm font-medium text-foreground">Start with a template</h2>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <ActionCard
              icon={<NotebookText className="h-4 w-4 text-foreground" strokeWidth={1.5} />}
              title="Authentication health"
              description="Notebook template"
              bgColor="bg-blue-500"
              onClick={onCreateNotebook}
            />
            <ActionCard
              icon={<NotebookText className="h-4 w-4 text-foreground" strokeWidth={1.5} />}
              title="Signup funnel"
              description="Notebook template"
              bgColor="bg-blue-500"
              onClick={onCreateNotebook}
            />
            <ActionCard
              icon={<NotebookText className="h-4 w-4 text-foreground" strokeWidth={1.5} />}
              title="Incident review"
              description="Notebook template"
              bgColor="bg-blue-500"
              onClick={onCreateNotebook}
            />
            <ActionCard
              icon={<MessageCirclePlus className="h-4 w-4 text-foreground" strokeWidth={1.5} />}
              title="Investigate errors"
              description="Chat template"
              bgColor="bg-blue-500"
              onClick={onCreateChat}
            />
            <ActionCard
              icon={<MessageCirclePlus className="h-4 w-4 text-foreground" strokeWidth={1.5} />}
              title="Explore your schema"
              description="Chat template"
              bgColor="bg-blue-500"
              onClick={onCreateChat}
            />
            <ActionCard
              icon={<MessageCirclePlus className="h-4 w-4 text-foreground" strokeWidth={1.5} />}
              title="Optimize a query"
              description="Chat template"
              bgColor="bg-blue-500"
              onClick={onCreateChat}
            />
          </div>
        </section>
      </div>
    </div>
  )
}
