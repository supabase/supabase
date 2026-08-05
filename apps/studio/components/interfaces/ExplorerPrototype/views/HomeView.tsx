/**
 * PROTOTYPE — Explorer's fixed home tab.
 *
 * Home is intentionally not a resource or a closable tab. It is a compact
 * launch surface for ad-hoc queries, notebooks, and chats.
 */

import { MessageSquare, NotebookText, SquareCode } from 'lucide-react'
import { useState } from 'react'
import { Button } from 'ui'

import { ChatComposer } from './ChatComposer'
import { ActionCard } from '@/components/layouts/Tabs/ActionCard'

interface HomeViewProps {
  onCreateQuery: () => void
  onCreateNotebook: () => void
  onCreateChat: (prompt: string) => void
}

export const HomeView = ({ onCreateQuery, onCreateNotebook, onCreateChat }: HomeViewProps) => {
  const [showTemplates, setShowTemplates] = useState(true)

  return (
    <div className="h-full overflow-y-auto">
      <div className="flex min-h-full items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl">
          <div className="mb-12 space-y-1 text-center">
            <h1 className="heading-section">Explore your project</h1>
            <p className="text-sm text-foreground-light">
              Ask the Assistant about your data, or begin with a new resource.
            </p>
          </div>

          <ChatComposer
            onSubmit={onCreateChat}
            ariaLabel="Ask about your project"
            submitLabel="Start chat"
          />

          <section className="mt-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ActionCard
                icon={<SquareCode className="h-4 w-4 text-foreground" strokeWidth={1.5} />}
                title="Run SQL"
                description="Write and run an ad-hoc query"
                bgColor="bg-blue-500"
                onClick={onCreateQuery}
              />
              <ActionCard
                icon={<NotebookText className="h-4 w-4 text-foreground" strokeWidth={1.5} />}
                title="Create a notebook"
                description="Combine notes, queries, and results"
                bgColor="bg-blue-500"
                onClick={onCreateNotebook}
              />
            </div>
          </section>

          {showTemplates && (
            <section className="mt-8">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-medium text-foreground">Start with a template</h2>
                <Button variant="text" size="tiny" onClick={() => setShowTemplates(false)}>
                  Dismiss
                </Button>
              </div>
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
                  icon={<MessageSquare className="h-4 w-4 text-foreground" strokeWidth={1.5} />}
                  title="Investigate errors"
                  description="Chat template"
                  bgColor="bg-blue-500"
                  onClick={() => onCreateChat('Help me investigate recent errors in my project.')}
                />
                <ActionCard
                  icon={<MessageSquare className="h-4 w-4 text-foreground" strokeWidth={1.5} />}
                  title="Explore your schema"
                  description="Chat template"
                  bgColor="bg-blue-500"
                  onClick={() => onCreateChat('Help me understand my database schema.')}
                />
                <ActionCard
                  icon={<MessageSquare className="h-4 w-4 text-foreground" strokeWidth={1.5} />}
                  title="Optimize a query"
                  description="Chat template"
                  bgColor="bg-blue-500"
                  onClick={() => onCreateChat('Help me optimize a slow database query.')}
                />
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
