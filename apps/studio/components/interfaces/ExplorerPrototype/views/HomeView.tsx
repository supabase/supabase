/**
 * PROTOTYPE — Explorer's fixed home tab.
 *
 * Home is intentionally not a resource or a closable tab. It is a compact
 * launch surface for the three ways to start exploring a project.
 */

import { NotebookText, SquareCode } from 'lucide-react'

import { ChatComposer } from './ChatComposer'
import { ActionCard } from '@/components/layouts/Tabs/ActionCard'

interface HomeViewProps {
  onCreateNotebook: () => void
  onCreateSnippet: () => void
  onCreateChat: (prompt: string) => void
}

export const HomeView = ({ onCreateNotebook, onCreateSnippet, onCreateChat }: HomeViewProps) => {
  return (
    <div className="h-full overflow-y-auto bg-background">
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
                icon={<NotebookText className="h-4 w-4 text-foreground" strokeWidth={1.5} />}
                title="Create a notebook"
                description="Combine notes, queries, and results"
                bgColor="bg-blue-500"
                onClick={onCreateNotebook}
              />
              <ActionCard
                icon={<SquareCode className="h-4 w-4 text-foreground" strokeWidth={1.5} />}
                title="Create a snippet"
                description="Save a query for later"
                bgColor="bg-blue-500"
                onClick={onCreateSnippet}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
