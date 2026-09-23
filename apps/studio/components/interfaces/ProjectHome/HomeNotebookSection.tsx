import { useParams } from 'common'
import { ExternalLink, NotebookText } from 'lucide-react'
import Link from 'next/link'
import { AiIconAnimation, Button, Card, CardContent } from 'ui'
import { EmptyStatePresentational } from 'ui-patterns/EmptyStatePresentational'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { HOME_NOTEBOOK_NAME } from './Home.utils'
import { HomeNotebookQueryCell } from './HomeNotebookQueryCell'
import { useHomeNotebook } from './useHomeNotebook'
import { useCreateChat, useCreateNotebook } from '@/components/interfaces/Explorer/hooks'
import {
  getAnalyzeNotebookChat,
  NOTEBOOK_CELL_WIDTH,
} from '@/components/interfaces/Explorer/Notebook/notebook.utils'
import { RunNotebookButton } from '@/components/interfaces/Explorer/Notebook/RunNotebookButton'
import { RunNotebookConfirmationModal } from '@/components/interfaces/Explorer/Notebook/RunNotebookConfirmationModal'
import { useRunNotebook } from '@/components/interfaces/Explorer/Notebook/useRunNotebook'
import { Markdown } from '@/components/interfaces/Markdown'
import { AlertError } from '@/components/ui/AlertError'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { isQueryCell } from '@/data/content/notebooks/notebook-schema'

/** Renders the project's "Home" notebook in place of the custom report when Explorer is enabled. */
export const HomeNotebookSection = () => {
  const { ref } = useParams()
  const { createNotebook } = useCreateNotebook()
  const { createChat, isCreating: isCreatingChat } = useCreateChat()
  const homeNotebook = useHomeNotebook(ref)

  const notebook = homeNotebook.status === 'success' ? homeNotebook.notebook : undefined
  const cells = notebook?.content.cells ?? []
  const hasQueryCells = cells.some(isQueryCell)
  const notebookHref = notebook && `/project/${ref}/explorer/notebook/${notebook.id}`

  const { registerQueryCell, isRunning, runNotebook, confirmationModalProps } = useRunNotebook({
    getCells: () => cells,
  })

  const handleAnalyze = () => {
    if (!notebook) return
    createChat(getAnalyzeNotebookChat({ id: notebook.id, name: notebook.name }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="heading-section">Pinned notebook</h3>
        {notebookHref && (
          <div className="flex items-center gap-x-2">
            <ButtonTooltip
              className="group"
              icon={
                <AiIconAnimation
                  size={16}
                  className="text-tertiary-foreground group-hover:text-primary"
                />
              }
              loading={isCreatingChat}
              disabled={cells.length === 0}
              tooltip={{
                content: {
                  side: 'bottom',
                  text: cells.length === 0 ? 'Add a cell to the notebook to analyze it' : undefined,
                },
              }}
              onClick={handleAnalyze}
            >
              Analyze
            </ButtonTooltip>
            <RunNotebookButton
              isRunning={isRunning}
              disabled={!hasQueryCells}
              onClick={runNotebook}
            />
            <Button asChild icon={<ExternalLink />}>
              <Link href={notebookHref}>Open in Explorer</Link>
            </Button>
          </div>
        )}
      </div>

      {homeNotebook.status === 'pending' && <GenericSkeletonLoader />}
      {homeNotebook.status === 'error' && (
        <AlertError error={homeNotebook.error} subject="Failed to retrieve Home notebook" />
      )}
      {homeNotebook.status === 'missing' && (
        <EmptyStatePresentational
          icon={<NotebookText className="text-foreground-lighter" />}
          title="Create a Home notebook"
          description="Pin the queries and notes you check most often to this page."
        >
          <Button onClick={() => createNotebook({ name: HOME_NOTEBOOK_NAME })}>
            Create notebook
          </Button>
        </EmptyStatePresentational>
      )}
      {notebookHref && cells.length === 0 && (
        <EmptyStatePresentational
          icon={<NotebookText className="text-foreground-lighter" />}
          title="Your Home notebook is empty"
          description="Add queries or notes to the notebook to see them here."
        >
          <Button asChild>
            <Link href={notebookHref}>Edit notebook</Link>
          </Button>
        </EmptyStatePresentational>
      )}
      {notebook && cells.length > 0 && (
        <Card className="bg-surface-100">
          <CardContent className="px-4 py-16">
            <div
              className="mx-auto flex w-full flex-col gap-y-4"
              style={{ maxWidth: NOTEBOOK_CELL_WIDTH }}
            >
              {cells.map((cell) =>
                isQueryCell(cell) ? (
                  <HomeNotebookQueryCell
                    // Remount on a server update so the editor loads the saved SQL and drops stale results
                    key={`${cell._id}-${notebook.updated_at}`}
                    cell={cell}
                    ref={registerQueryCell(cell._id)}
                  />
                ) : (
                  <Markdown key={cell._id} className="px-3 prose prose-sm max-w-none">
                    {cell.text}
                  </Markdown>
                )
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <RunNotebookConfirmationModal {...confirmationModalProps} />
    </div>
  )
}
