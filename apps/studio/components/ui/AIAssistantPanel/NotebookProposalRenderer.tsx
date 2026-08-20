import { useParams } from 'common'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { type PropsWithChildren } from 'react'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { CodeBlock } from 'ui-patterns/CodeBlock'

import { AssistantNotebookPreview } from './AssistantNotebookPreview'
import { Confirm } from './Confirm'
import { type ConfirmFooterApprovalState } from './Confirm.utils'
import {
  createNotebookInputSchema,
  notebookToolOutputSchema,
  updateNotebookInputSchema,
} from './Message.utils'
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
// rendered — see MessagePartNotebookProposal in Message.Parts.tsx.
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
  /** Result of `getManualToolApprovalConfirmState`. Drives the Confirm footer. */
  confirmState?: ConfirmFooterApprovalState
  onApprove?: () => void
  onDeny?: () => void
}

type NotebookProposalStepProps = Omit<NotebookProposalRendererProps, 'mode' | 'output' | 'state'>

const MODE_COPY = {
  create: {
    confirmMessage: 'Assistant wants to create this notebook',
    confirmLabel: 'Create',
    confirmLabelLoading: 'Creating...',
    outputLabel: 'Notebook created',
  },
  update: {
    confirmMessage: 'Assistant wants to update this notebook',
    confirmLabel: 'Apply changes',
    confirmLabelLoading: 'Applying changes...',
    outputLabel: 'Notebook updated',
  },
} as const

/**
 * Renders the create/update notebook tool across all approval states. Owns input parsing
 * (via the shared `agentNotebookSchema` / `notebookOperationsSchema`), the update-mode diff
 * fetch, and the `expected_updated_at` version check. Wraps the preview in `Confirm` the
 * same way `AssistantQueryCell` wraps `QueryEditor`.
 */
export const NotebookProposalRenderer = (props: NotebookProposalRendererProps) => {
  const { mode, state, output } = props

  if (state === 'output-available') {
    return <NotebookOutputSummary mode={mode} output={output} />
  }

  const { input, confirmState, onApprove, onDeny } = props
  return mode === 'create' ? (
    <CreateNotebookProposal
      input={input}
      confirmState={confirmState}
      onApprove={onApprove}
      onDeny={onDeny}
    />
  ) : (
    <UpdateNotebookProposal
      input={input}
      confirmState={confirmState}
      onApprove={onApprove}
      onDeny={onDeny}
    />
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

interface NotebookConfirmProps {
  mode: NotebookProposalMode
  confirmState?: ConfirmFooterApprovalState
  message?: string
  confirmLabel?: string
  confirmLabelLoading?: string
  extraLoading?: boolean
  onApprove?: () => void
  onDeny?: () => void
}

/** Confirm card around a notebook preview, matching AssistantQueryCell / EdgeFunctionRenderer. */
function NotebookConfirm({
  mode,
  confirmState,
  message,
  confirmLabel,
  confirmLabelLoading,
  extraLoading,
  onApprove,
  onDeny,
  children,
}: PropsWithChildren<NotebookConfirmProps>) {
  const copy = MODE_COPY[mode]

  return (
    <Confirm
      className="my-4"
      state={confirmState}
      message={message ?? copy.confirmMessage}
      cancelLabel="Skip"
      confirmLabel={confirmLabel ?? copy.confirmLabel}
      confirmLabelLoading={confirmLabelLoading ?? copy.confirmLabelLoading}
      extraLoading={extraLoading}
      onCancel={onDeny}
      onConfirm={onApprove}
    >
      {children}
    </Confirm>
  )
}

function NotebookParseFailure({
  mode,
  confirmState,
  input,
  onApprove,
  onDeny,
}: Pick<
  NotebookProposalRendererProps,
  'mode' | 'confirmState' | 'input' | 'onApprove' | 'onDeny'
>) {
  return (
    <NotebookConfirm mode={mode} confirmState={confirmState} onApprove={onApprove} onDeny={onDeny}>
      <div className="flex flex-col gap-2 p-3">
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
      </div>
    </NotebookConfirm>
  )
}

function CreateNotebookProposal({
  input,
  confirmState,
  onApprove,
  onDeny,
}: NotebookProposalStepProps) {
  const parsedInput = createNotebookInputSchema.safeParse(input)

  if (!parsedInput.success) {
    return (
      <NotebookParseFailure
        mode="create"
        confirmState={confirmState}
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
    <NotebookConfirm
      mode="create"
      confirmState={confirmState}
      onApprove={onApprove}
      onDeny={onDeny}
    >
      <AssistantNotebookPreview entries={entries} mode="create" title={parsedInput.data.name} />
    </NotebookConfirm>
  )
}

function UpdateNotebookProposal({
  input,
  confirmState,
  onApprove,
  onDeny,
}: NotebookProposalStepProps) {
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
        confirmState={confirmState}
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
        {confirmState !== undefined && (
          <Button
            variant="outline"
            size="tiny"
            className="w-fit"
            disabled={confirmState !== 'approval-requested'}
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
      <NotebookConfirm
        mode="update"
        confirmState={confirmState}
        confirmLabel="Refresh"
        confirmLabelLoading="Refreshing..."
        extraLoading={isFetching}
        onDeny={onDeny}
        onApprove={() => refetch()}
      >
        <div className="p-3">
          <Admonition
            type="warning"
            title="This notebook changed since the assistant planned this update"
            description={`"${notebook.name}" was updated after the assistant read it. Refresh to see the latest version before deciding.`}
          />
        </div>
      </NotebookConfirm>
    )
  }

  const diff = deriveNotebookDiff(toWireNotebook(notebook.content), parsedInput.data.operations)

  return (
    <NotebookConfirm
      mode="update"
      confirmState={confirmState}
      message={`Assistant wants to update "${notebook.name}"`}
      onApprove={onApprove}
      onDeny={onDeny}
    >
      {diff.success ? (
        <AssistantNotebookPreview entries={diff.entries} mode="update" title={notebook.name} />
      ) : (
        <div className="p-3">
          <Admonition
            type="warning"
            title="This update can't be applied as written"
            description={describeNotebookOperationError(diff.error)}
          />
        </div>
      )}
    </NotebookConfirm>
  )
}
