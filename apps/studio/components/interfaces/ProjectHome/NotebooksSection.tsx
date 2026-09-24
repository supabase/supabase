import { useParams } from 'common'
import dayjs from 'dayjs'
import { NotebookText, Plus } from 'lucide-react'
import { AiIconAnimation, Badge, Button } from 'ui'
import { Row } from 'ui-patterns/Row'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { HomeCard } from './HomeCard'
import { useAnalyzeNotebook, useCreateNotebook } from '@/components/interfaces/Explorer/hooks'
import { AlertError } from '@/components/ui/AlertError'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import {
  useNotebooksInfiniteQuery,
  type NotebookRow,
} from '@/data/content/notebooks/notebooks-infinite-query'

const MAX_HOMEPAGE_NOTEBOOKS = 4

export const NotebooksSection = () => {
  const { ref: projectRef } = useParams()
  const { createNotebook } = useCreateNotebook()

  const { data, error, isPending, isError, isSuccess, refetch } = useNotebooksInfiniteQuery({
    projectRef,
    limit: MAX_HOMEPAGE_NOTEBOOKS,
    sort: 'inserted_at',
  })
  // The content endpoint can return more rows than `limit`, so cap the row here too
  const notebooks = (data?.pages[0]?.content ?? []).slice(0, MAX_HOMEPAGE_NOTEBOOKS)

  return (
    <div>
      {isPending && (
        <>
          <ShimmeringLoader className="w-96 mb-6" />
          <div className="flex flex-col gap-2">
            <ShimmeringLoader />
            <ShimmeringLoader className="w-3/4" />
            <ShimmeringLoader className="w-1/2" />
          </div>
        </>
      )}

      {!isPending && (
        <div className="flex justify-between items-center mb-6">
          <h2>Notebooks</h2>
          <Button icon={<Plus />} onClick={() => createNotebook()}>
            New notebook
          </Button>
        </div>
      )}

      {isError && (
        <AlertError
          error={error instanceof Error ? error : null}
          subject="Failed to retrieve notebooks"
          projectRef={projectRef}
          additionalActions={
            <Button variant="default" onClick={() => refetch()}>
              Retry
            </Button>
          }
        />
      )}

      {isSuccess && notebooks.length === 0 && (
        <EmptyState onCreateNotebook={() => createNotebook()} />
      )}

      {isSuccess && notebooks.length > 0 && (
        <Row maxColumns={4} minWidth={280}>
          {notebooks.map((notebook) => (
            <NotebookCard key={notebook.id} notebook={notebook} projectRef={projectRef} />
          ))}
        </Row>
      )}
    </div>
  )
}

function NotebookCard({
  notebook,
  projectRef,
}: {
  notebook: NotebookRow
  projectRef: string | undefined
}) {
  const { analyzeNotebook, isCreating } = useAnalyzeNotebook()

  const cellCount = notebook.content?.cells?.length
  // Treat an unknown cell count as empty so Analyze is never offered on a notebook with no cells
  const isEmpty = !cellCount

  return (
    <HomeCard
      href={`/project/${projectRef}/explorer/notebook/${notebook.id}`}
      icon={<NotebookText size={16} strokeWidth={1.5} className="text-foreground-light" />}
      label="NOTEBOOK"
      title={notebook.name}
      description={notebook.description?.trim()}
      meta={`Created ${dayjs(notebook.inserted_at).fromNow()}`}
      actions={
        <>
          {cellCount !== undefined && (
            <Badge className="w-fit">
              {cellCount} {cellCount === 1 ? 'CELL' : 'CELLS'}
            </Badge>
          )}
          <ButtonTooltip
            variant="text"
            className="w-7 h-7 px-1.5"
            icon={<AiIconAnimation size={16} loading={isCreating} />}
            disabled={isEmpty}
            onClick={() => analyzeNotebook({ id: notebook.id, name: notebook.name })}
            aria-label="Analyze"
            tooltip={{
              content: {
                text: isEmpty ? 'Add a cell to the notebook to analyze it' : 'Analyze',
              },
            }}
          />
        </>
      }
    />
  )
}

function EmptyState({ onCreateNotebook }: { onCreateNotebook: () => void }) {
  return (
    <div className="h-64 flex flex-col items-center justify-center rounded-sm border-2 border-dashed p-16">
      <h4>Create a notebook</h4>
      <p className="text-sm text-foreground-light mb-4">
        Save queries and notes together to revisit and share
      </p>
      <Button iconRight={<Plus size={14} />} onClick={onCreateNotebook}>
        Create your first notebook
      </Button>
    </div>
  )
}
