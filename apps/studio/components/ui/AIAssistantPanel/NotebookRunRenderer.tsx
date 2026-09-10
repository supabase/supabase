import { useParams } from 'common'
import { Loader2 } from 'lucide-react'
import { Button, cn } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { CodeBlock } from 'ui-patterns/CodeBlock'

import { AssistantNotebookPreview } from './AssistantNotebookPreview'
import { toAssistantQueryResult } from './AssistantQueryCell.utils'
import { Confirm } from './Confirm'
import type { ConfirmFooterApprovalState } from './Confirm.utils'
import { runNotebookInputSchema } from './Message.utils'
import { AlertError } from '@/components/ui/AlertError'
import { useNotebookQuery } from '@/data/content/notebooks/notebook-query'
import { toWireNotebook } from '@/data/content/notebooks/notebook-schema'
import { notebookRunOutputSchema } from '@/lib/ai/tools/notebook-run-output'

export type NotebookRunState =
  | 'input-available'
  | 'approval-requested'
  | 'approval-responded'
  | 'output-denied'
  | 'output-available'
  | 'output-error'

export interface NotebookRunRendererProps {
  state: NotebookRunState
  input: unknown
  output: unknown
  confirmState?: ConfirmFooterApprovalState
  onApprove?: () => void
  onDeny?: () => void
}

export const NotebookRunRenderer = ({
  state,
  input,
  output,
  confirmState,
  onApprove,
  onDeny,
}: NotebookRunRendererProps) => {
  const { ref } = useParams()
  const parsedInput = runNotebookInputSchema.safeParse(input)
  const {
    data: notebook,
    isLoading,
    isError,
    error,
  } = useNotebookQuery(
    { projectRef: ref, id: parsedInput.success ? parsedInput.data.id : undefined },
    { enabled: parsedInput.success }
  )

  if (!parsedInput.success) {
    return (
      <Confirm
        className="my-4"
        state={confirmState}
        message="Assistant wants to run a notebook"
        denyOnly
        onCancel={onDeny}
      >
        <div className="flex flex-col gap-2 p-3">
          <Admonition
            type="warning"
            title="Couldn't render this notebook run"
            description="The assistant's input didn't match the expected shape. You can review the raw input below."
          />
          <CodeBlock
            language="json"
            value={JSON.stringify(input, null, 2)}
            hideLineNumbers
            className="text-xs"
            wrapperClassName="max-h-56"
          />
        </div>
      </Confirm>
    )
  }

  const loadingStatus = (
    <div
      aria-live="polite"
      className={cn(
        isLoading
          ? 'my-4 rounded-lg border bg-surface-75 heading-meta h-9 px-3 text-foreground-light flex items-center gap-2'
          : 'sr-only'
      )}
    >
      {isLoading && (
        <>
          <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" />
          Loading notebook...
        </>
      )}
    </div>
  )

  if (isLoading) {
    return <>{loadingStatus}</>
  }

  if (isError || !notebook) {
    const loadError = <AlertError error={error} subject="Failed to load notebook" />

    if (confirmState === 'approval-requested') {
      return (
        <>
          {loadingStatus}
          <Confirm
            className="my-4"
            state={confirmState}
            message="Assistant wants to run a notebook"
            denyOnly
            onCancel={onDeny}
          >
            <div className="p-3">{loadError}</div>
          </Confirm>
        </>
      )
    }

    return (
      <>
        {loadingStatus}
        <div className="my-4 flex flex-col gap-2">
          {loadError}
          {confirmState !== undefined && (
            <Button variant="outline" size="tiny" className="w-fit" disabled onClick={onDeny}>
              Skip
            </Button>
          )}
        </div>
      </>
    )
  }

  const entries = toWireNotebook(notebook.content).cells.map((cell) => ({
    _tag: 'unchanged' as const,
    cell,
  }))
  const parsedOutput = notebookRunOutputSchema.safeParse(output)
  const isHistoricalRun = state === 'output-available' || state === 'output-error'
  const referencedUpdatedAt =
    state === 'output-available' && parsedOutput.success
      ? parsedOutput.data.updated_at
      : parsedInput.data.expected_updated_at
  const hasNotebookChanged = notebook.updated_at !== referencedUpdatedAt
  const results = parsedOutput.success
    ? Object.fromEntries(
        parsedOutput.data.cells.map((cell) => [
          cell.cell_id,
          cell.status === 'error'
            ? { error: { message: cell.error?.message ?? 'Failed to run query' } }
            : (toAssistantQueryResult(cell.rows ?? []) ?? { rows: [] }),
        ])
      )
    : undefined

  return (
    <>
      {loadingStatus}
      <Confirm
        className="my-4"
        state={confirmState}
        message={`Assistant wants to run "${notebook.name}"`}
        cancelLabel="Skip"
        confirmLabel="Run notebook"
        confirmLabelLoading="Running..."
        successMessage="Notebook executed"
        errorMessage="Failed to run notebook"
        deniedMessage="Skipped notebook run"
        onCancel={onDeny}
        onConfirm={onApprove}
      >
        {hasNotebookChanged && (
          <div className="px-2 pt-2">
            <Admonition
              type="warning"
              title={
                isHistoricalRun
                  ? 'Notebook changed since this run'
                  : 'Notebook changed since the Assistant read it'
              }
              description={
                isHistoricalRun
                  ? 'This preview shows the current notebook. Its cells may not match the saved results from this run.'
                  : 'Review the current cells below. The run will be rejected until the Assistant reads the latest notebook version.'
              }
            />
          </div>
        )}
        <AssistantNotebookPreview
          entries={entries}
          mode="run"
          title={notebook.name}
          results={state === 'output-available' ? results : undefined}
        />
      </Confirm>
    </>
  )
}
