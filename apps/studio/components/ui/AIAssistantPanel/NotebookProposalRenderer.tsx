import { useParams } from 'common'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { type PropsWithChildren, type ReactNode } from 'react'
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

export type NotebookProposalState =
  | 'input-available'
  | 'approval-requested'
  | 'approval-responded'
  | 'output-denied'
  | 'output-available'
  | 'output-error'

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

type NotebookProposalStepProps = Omit<
  NotebookProposalRendererProps,
  'mode' | 'output' | 'state'
> & {
  footerAction?: ReactNode
}

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
  const { ref } = useParams()
  const { mode, state, input, output, confirmState, onApprove, onDeny } = props
  const parsedOutput = notebookToolOutputSchema.safeParse(output)
  const footerAction =
    state === 'output-available' && parsedOutput.success && ref ? (
      <Button asChild variant="default" size="tiny">
        <Link href={`/project/${ref}/explorer/notebook/${parsedOutput.data.id}`}>
          Open notebook
        </Link>
      </Button>
    ) : undefined

  return mode === 'create' ? (
    <CreateNotebookProposal
      input={input}
      confirmState={confirmState}
      footerAction={footerAction}
      onApprove={onApprove}
      onDeny={onDeny}
    />
  ) : (
    <UpdateNotebookProposal
      input={input}
      confirmState={confirmState}
      footerAction={footerAction}
      onApprove={onApprove}
      onDeny={onDeny}
    />
  )
}

interface NotebookConfirmProps {
  mode: NotebookProposalMode
  confirmState?: ConfirmFooterApprovalState
  message?: string
  confirmLabel?: string
  confirmLabelLoading?: string
  extraLoading?: boolean
  denyOnly?: boolean
  footerAction?: ReactNode
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
  denyOnly,
  footerAction,
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
      successMessage={copy.outputLabel}
      errorMessage={`Failed to ${mode} notebook`}
      deniedMessage={`Skipped notebook ${mode === 'create' ? 'creation' : 'update'}`}
      footerAction={footerAction}
      extraLoading={extraLoading}
      denyOnly={denyOnly}
      onCancel={onDeny}
      onConfirm={denyOnly ? undefined : onApprove}
    >
      {children}
    </Confirm>
  )
}

function NotebookParseFailure({
  mode,
  confirmState,
  input,
  onDeny,
}: Pick<NotebookProposalRendererProps, 'mode' | 'confirmState' | 'input' | 'onDeny'>) {
  return (
    <NotebookConfirm mode={mode} confirmState={confirmState} denyOnly onDeny={onDeny}>
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
  footerAction,
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
      footerAction={footerAction}
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
  footerAction,
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

  const diff = deriveNotebookDiff(toWireNotebook(notebook.content), parsedInput.data.operations)

  if (!diff.success) {
    return (
      <NotebookConfirm
        mode="update"
        confirmState={confirmState}
        message={`Assistant wants to update "${notebook.name}"`}
        denyOnly
        onDeny={onDeny}
      >
        <div className="p-3">
          <Admonition
            type="warning"
            title="This update can't be applied as written"
            description={describeNotebookOperationError(diff.error)}
          />
        </div>
      </NotebookConfirm>
    )
  }

  return (
    <NotebookConfirm
      mode="update"
      confirmState={confirmState}
      footerAction={footerAction}
      message={`Assistant wants to update "${notebook.name}"`}
      onApprove={onApprove}
      onDeny={onDeny}
    >
      <AssistantNotebookPreview entries={diff.entries} mode="update" title={notebook.name} />
    </NotebookConfirm>
  )
}
