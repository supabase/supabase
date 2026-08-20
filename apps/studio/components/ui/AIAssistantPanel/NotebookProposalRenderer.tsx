import { useParams } from 'common'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Button, cn } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { CodeBlock } from 'ui-patterns/CodeBlock'

import { ConfirmFooter } from './Confirm'
import {
  createNotebookInputSchema,
  notebookToolOutputSchema,
  updateNotebookInputSchema,
} from './Message.utils'
import { NotebookPreview } from '@/components/interfaces/Explorer/NotebookPreview/NotebookPreview'
import { AlertError } from '@/components/ui/AlertError'
import {
  deriveNotebookDiff,
  describeNotebookOperationError,
  type NotebookCellDiffEntry,
} from '@/data/content/notebooks/notebook-operations'
import { useNotebookQuery } from '@/data/content/notebooks/notebook-query'
import { toWireNotebook } from '@/data/content/notebooks/notebook-schema'

export type NotebookProposalMode = 'create' | 'update'

// input-streaming and output-error are handled by the caller before this component is
// rendered — see MessagePartCreateNotebook / MessagePartUpdateNotebook in Message.Parts.tsx.
export type NotebookProposalState =
  | 'input-available'
  | 'approval-requested'
  | 'approval-responded'
  | 'output-denied'
  | 'output-available'

export interface NotebookProposalRendererProps {
  mode: NotebookProposalMode
  state: NotebookProposalState
  input: unknown
  output: unknown
  onApprove?: () => void
  onDeny?: () => void
}

type NotebookProposalStepProps = Omit<NotebookProposalRendererProps, 'mode' | 'output'>

const MODE_COPY = {
  create: {
    confirmMessage: 'Assistant wants to create this notebook',
    confirmLabel: 'Create',
    confirmLabelLoading: 'Creating...',
    skippedLabel: 'Skipped notebook creation',
    outputLabel: 'Notebook created',
  },
  update: {
    confirmMessage: 'Assistant wants to update this notebook',
    confirmLabel: 'Apply changes',
    confirmLabelLoading: 'Applying changes...',
    skippedLabel: 'Skipped notebook update',
    outputLabel: 'Notebook updated',
  },
} as const

/**
 * Renders the create/update notebook tool across all approval states. Owns input parsing
 * (via the shared `agentNotebookSchema` / `notebookOperationsSchema`), the update-mode diff
 * fetch, and the `expected_updated_at` version check.
 */
export const NotebookProposalRenderer = (props: NotebookProposalRendererProps) => {
  const { mode, state, output } = props

  if (state === 'output-denied') {
    return (
      <p className="text-xs text-foreground-lighter my-2 px-4">{MODE_COPY[mode].skippedLabel}</p>
    )
  }

  if (state === 'output-available') {
    return <NotebookOutputSummary mode={mode} output={output} />
  }

  const { input, onApprove, onDeny } = props
  return mode === 'create' ? (
    <CreateNotebookProposal state={state} input={input} onApprove={onApprove} onDeny={onDeny} />
  ) : (
    <UpdateNotebookProposal state={state} input={input} onApprove={onApprove} onDeny={onDeny} />
  )
}

function NotebookOutputSummary({ mode, output }: { mode: NotebookProposalMode; output: unknown }) {
  const { ref } = useParams()
  const parsedOutput = notebookToolOutputSchema.safeParse(output)
  const label = MODE_COPY[mode].outputLabel

  return (
    <div className="flex items-center justify-between gap-2 my-2 mx-4 px-3 py-1.5 text-sm border rounded-md bg-surface-75">
      <span className="text-foreground-light truncate">
        {parsedOutput.success ? `${label}: ${parsedOutput.data.name}` : label}
      </span>
      {parsedOutput.success && ref && (
        <Button asChild variant="default" size="tiny">
          <Link href={`/project/${ref}/explorer/notebook/${parsedOutput.data.id}`}>
            Open notebook
          </Link>
        </Button>
      )}
    </div>
  )
}

interface NotebookConfirmFooterProps {
  mode: NotebookProposalMode
  state: NotebookProposalState
  message?: string
  confirmLabel?: string
  confirmLabelLoading?: string
  extraLoading?: boolean
  onApprove?: () => void
  onDeny?: () => void
}

/**
 * `ConfirmFooter` now ships bare so the `Confirm` card can own the frame, so this renderer
 * supplies its own flush-under-block border. The block above still has to square off its
 * bottom corners and the two must not be gapped apart.
 */
const GLUED_TO_FOOTER = 'rounded-b-none'
const FLUSH_UNDER_BLOCK = 'border border-t-0 rounded-b-lg'

function hasConfirmFooter(state: NotebookProposalState) {
  return state === 'approval-requested' || state === 'approval-responded'
}

/** The footer morphs (label + disabled) across approval-requested/approval-responded and is absent otherwise. */
function NotebookConfirmFooter({
  mode,
  state,
  message,
  confirmLabel,
  confirmLabelLoading,
  extraLoading = false,
  onApprove,
  onDeny,
}: NotebookConfirmFooterProps) {
  if (!hasConfirmFooter(state)) return null

  const copy = MODE_COPY[mode]
  const isApprovalRequested = state === 'approval-requested'

  return (
    <ConfirmFooter
      className={FLUSH_UNDER_BLOCK}
      message={message ?? copy.confirmMessage}
      cancelLabel="Skip"
      confirmLabel={confirmLabel ?? copy.confirmLabel}
      confirmLabelLoading={confirmLabelLoading ?? copy.confirmLabelLoading}
      isLoading={!isApprovalRequested || extraLoading}
      onCancel={isApprovalRequested ? onDeny : undefined}
      onConfirm={isApprovalRequested ? onApprove : undefined}
    />
  )
}

function NotebookParseFailure({
  mode,
  state,
  input,
  onApprove,
  onDeny,
}: Pick<NotebookProposalRendererProps, 'mode' | 'state' | 'input' | 'onApprove' | 'onDeny'>) {
  return (
    <div className="w-auto overflow-x-hidden my-4 flex flex-col gap-2">
      <Admonition
        type="warning"
        title="Couldn't render a preview for this notebook"
        description="The assistant's proposed input didn't match the expected shape. You can still review the raw input below."
      />
      <CodeBlock
        language="json"
        value={JSON.stringify(input, null, 2)}
        hideLineNumbers
        className="text-xs"
        wrapperClassName="max-h-56"
      />
      <NotebookConfirmFooter mode={mode} state={state} onApprove={onApprove} onDeny={onDeny} />
    </div>
  )
}

function CreateNotebookProposal({ state, input, onApprove, onDeny }: NotebookProposalStepProps) {
  const parsedInput = createNotebookInputSchema.safeParse(input)

  if (!parsedInput.success) {
    return (
      <NotebookParseFailure
        mode="create"
        state={state}
        input={input}
        onApprove={onApprove}
        onDeny={onDeny}
      />
    )
  }

  const entries: NotebookCellDiffEntry[] = parsedInput.data.content.cells.map(
    (cell, operationIndex) => ({
      _tag: 'added',
      cell,
      operationIndex,
    })
  )

  return (
    <div className="w-auto overflow-x-hidden my-4 flex flex-col">
      <NotebookPreview
        entries={entries}
        mode="create"
        title={parsedInput.data.name}
        className={cn(hasConfirmFooter(state) && GLUED_TO_FOOTER)}
      />
      <NotebookConfirmFooter mode="create" state={state} onApprove={onApprove} onDeny={onDeny} />
    </div>
  )
}

function UpdateNotebookProposal({ state, input, onApprove, onDeny }: NotebookProposalStepProps) {
  const { ref } = useParams()
  const parsedInput = updateNotebookInputSchema.safeParse(input)

  const {
    data: notebook,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useNotebookQuery(
    { projectRef: ref, id: parsedInput.success ? parsedInput.data.id : undefined },
    { enabled: parsedInput.success }
  )

  if (!parsedInput.success) {
    return (
      <NotebookParseFailure
        mode="update"
        state={state}
        input={input}
        onApprove={onApprove}
        onDeny={onDeny}
      />
    )
  }

  if (isLoading) {
    return (
      <div className="my-4 mx-4 rounded-lg border bg-surface-75 heading-meta h-9 px-3 text-foreground-light flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading notebook...
      </div>
    )
  }

  if (isError || !notebook) {
    return (
      <div className="w-auto overflow-x-hidden my-4 flex flex-col gap-2">
        <AlertError error={error} subject="Failed to load notebook" />
        {(state === 'approval-requested' || state === 'approval-responded') && (
          <Button
            variant="outline"
            size="tiny"
            className="w-fit"
            disabled={state === 'approval-responded'}
            onClick={onDeny}
          >
            Skip
          </Button>
        )}
      </div>
    )
  }

  const isStale = notebook.updated_at !== parsedInput.data.expected_updated_at

  if (isStale) {
    return (
      <div className="w-auto overflow-x-hidden my-4 flex flex-col">
        <Admonition
          type="warning"
          title="This notebook changed since the assistant planned this update"
          description={`"${notebook.name}" was updated after the assistant read it. Refresh to see the latest version before deciding.`}
          className={cn(hasConfirmFooter(state) && GLUED_TO_FOOTER)}
        />
        <NotebookConfirmFooter
          mode="update"
          state={state}
          confirmLabel="Refresh"
          confirmLabelLoading="Refreshing..."
          extraLoading={isFetching}
          onDeny={onDeny}
          onApprove={() => refetch()}
        />
      </div>
    )
  }

  const diff = deriveNotebookDiff(toWireNotebook(notebook.content), parsedInput.data.operations)

  return (
    <div className="w-auto overflow-x-hidden my-4 flex flex-col">
      {diff.success ? (
        <NotebookPreview
          entries={diff.entries}
          mode="update"
          title={notebook.name}
          className={cn(hasConfirmFooter(state) && GLUED_TO_FOOTER)}
        />
      ) : (
        <Admonition
          type="warning"
          title="This update can't be applied as written"
          description={describeNotebookOperationError(diff.error)}
          className={cn(hasConfirmFooter(state) && GLUED_TO_FOOTER)}
        />
      )}
      <NotebookConfirmFooter
        mode="update"
        state={state}
        message={`Assistant wants to update "${notebook.name}"`}
        onApprove={onApprove}
        onDeny={onDeny}
      />
    </div>
  )
}
