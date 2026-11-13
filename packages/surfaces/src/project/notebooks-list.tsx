import { NotebookIcon, StarIcon } from 'lucide-react'
import { useRef, useState, type ReactNode } from 'react'
import { Button, Card } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

import { errorMessage, type AskAgent, type Loadable } from '../common'
import type { NotebookSummary, Project } from '../contract'

export interface NotebooksListProps {
  project: Project
  /** The host's read of the project's saved notebooks. `idle` when the connection has none. */
  notebooks: Loadable<NotebookSummary[]>
  /** Asks the host to load the notebooks again. Omit to hide Refresh. */
  onRefresh?: () => void
  /** Asks the agent to run a notebook and summarize it. Omit when the host cannot; Run is disabled. */
  onAsk?: AskAgent
}

const updatedFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })

function updatedLabel(updatedAt: string) {
  const date = new Date(updatedAt)
  return Number.isNaN(date.getTime()) ? undefined : `Updated ${updatedFormat.format(date)}`
}

function NotebookRow({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode
  title?: string
  description: string
  action?: ReactNode
}) {
  return (
    <li className="flex min-h-14 items-center gap-3 border-b border-muted px-4 py-3 last:border-b-0">
      {icon && <span className="flex shrink-0 text-foreground-light">{icon}</span>}
      <span className="flex min-w-0 flex-1 flex-col">
        {title && <span className="truncate text-sm text-foreground">{title}</span>}
        <span className="truncate text-xs text-foreground-light">{description}</span>
      </span>
      {action}
    </li>
  )
}

/**
 * A project's saved notebooks. Run asks the agent to run one and summarize its results; the
 * view never runs SQL itself. Renders on its own, e.g. in a chat panel, or within Home.
 */
export function NotebooksList({ project, notebooks, onRefresh, onAsk }: NotebooksListProps) {
  const [sendingId, setSendingId] = useState<string>()
  const [sendResult, setSendResult] = useState<
    { status: 'sent' } | { status: 'error'; message: string }
  >()
  const isSending = useRef(false)
  const isLoading = notebooks.status === 'loading'
  const canRun = !!onAsk && sendingId === undefined
  // Favorites first, then the most recently updated.
  const sorted =
    notebooks.status === 'success'
      ? [...notebooks.data].sort(
          (a, b) =>
            Number(b.favorite) - Number(a.favorite) || b.updated_at.localeCompare(a.updated_at)
        )
      : []

  async function handleRun(notebook: NotebookSummary) {
    if (!onAsk || isSending.current) return
    isSending.current = true
    setSendingId(notebook.id)
    setSendResult(undefined)
    try {
      await onAsk({
        type: 'run-notebook',
        project,
        notebook: { id: notebook.id, name: notebook.name },
      })
      setSendResult({ status: 'sent' })
    } catch (error) {
      setSendResult({ status: 'error', message: errorMessage(error) })
    } finally {
      isSending.current = false
      setSendingId(undefined)
    }
  }

  return (
    <section aria-labelledby="notebooks-title" aria-busy={isLoading} className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h3 id="notebooks-title" className="text-sm text-foreground">
          Notebooks
        </h3>
        <div className="flex items-center gap-2">
          {/* Always rendered so the confirmation is announced. */}
          <p role="status" className="text-xs text-foreground-lighter">
            {sendResult?.status === 'sent' ? 'Sent to chat.' : ''}
          </p>
          {onRefresh && (
            <Button variant="text" size="tiny" disabled={isLoading} onClick={onRefresh}>
              Refresh
            </Button>
          )}
        </div>
      </div>
      <Card>
        <ul>
          {notebooks.status === 'loading' && <NotebookRow description="Loading notebooks…" />}
          {notebooks.status === 'idle' && (
            <NotebookRow description="Notebooks are not available on this connection." />
          )}
          {notebooks.status === 'error' && (
            <NotebookRow title="Notebooks are unavailable" description={notebooks.message} />
          )}
          {notebooks.status === 'success' && notebooks.data.length === 0 && (
            <NotebookRow
              title="No notebooks yet"
              description="Notebooks saved for this project in Studio appear here."
            />
          )}
          {notebooks.status === 'success' &&
            sorted.map((notebook) => (
              <NotebookRow
                key={notebook.id}
                icon={
                  notebook.favorite ? (
                    <StarIcon size={16} aria-label="Favorite" />
                  ) : (
                    <NotebookIcon size={16} aria-hidden="true" />
                  )
                }
                title={notebook.name}
                description={
                  notebook.description || updatedLabel(notebook.updated_at) || 'Saved notebook'
                }
                action={
                  <Button
                    variant="default"
                    size="tiny"
                    disabled={!canRun}
                    loading={sendingId === notebook.id}
                    aria-label={`Run ${notebook.name}`}
                    aria-description="Ask the agent to run this notebook and summarize the results."
                    onClick={() => void handleRun(notebook)}
                  >
                    Run
                  </Button>
                }
              />
            ))}
        </ul>
      </Card>
      {sendResult?.status === 'error' && (
        <Admonition
          type="destructive"
          title="Failed to send to chat"
          description={sendResult.message}
        />
      )}
    </section>
  )
}
