import { useParams } from 'common'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useEffectEvent, type PropsWithChildren, type ReactNode } from 'react'
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
  updateNotebookToolOutputSchema,
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
  /** Denies with a specific reason instead of a generic "user skipped" — used to auto-deny
   *  an update that can't be applied as written so the model sees why and can retry. */
  denyWithReason?: (reason: string) => void
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
  const { mode, state, input, output, confirmState, onApprove, onDeny, denyWithReason } = props
  const parsedOutput = notebookToolOutputSchema.safeParse(output)
  const footerAction =
    state === 'output-available' && parsedOutput.success && ref ? (
      <Button asChild variant="default" size="tiny">
        <Link href={`/project/${ref}/explorer/notebook/${parsedOutput.data.id}`}>
          Open notebook
        </Link>
      </Button>
    ) : undefined

  const proposal =
    mode === 'create' ? (
      <CreateNotebookProposal
        input={input}
        confirmState={confirmState}
        footerAction={confirmState === undefined ? undefined : footerAction}
        onApprove={onApprove}
        onDeny={onDeny}
      />
    ) : (
      <UpdateNotebookProposal
        input={input}
        state={state}
        output={output}
        confirmState={confirmState}
        footerAction={confirmState === undefined ? undefined : footerAction}
        onApprove={onApprove}
        onDeny={onDeny}
        denyWithReason={denyWithReason}
      />
    )

  return (
    <>
      {proposal}
      {confirmState === undefined && footerAction}
    </>
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

const TERMINAL_CONFIRM_STATES: ConfirmFooterApprovalState[] = ['success', 'error', 'denied']

/**
 * An update whose operations don't apply to the notebook as currently loaded
 * (e.g. an operation targets a cell id that no longer exists). There's nothing
 * for the user to decide here, so instead of asking them to Skip, deny
 * automatically with the specific reason — same text `update_notebook`'s
 * server-side execute() would throw for the same failure — so the model sees
 * why and can retry (e.g. re-fetch and reissue) without the user's involvement.
 *
 * For a terminal `confirmState` (the decision already happened), re-deriving
 * against live content is just for display, and "can't be applied as written"
 * is inaccurate — nothing is being applied anymore. Instead, state that the
 * notebook has changed since, so the preview can't be reconstructed.
 */
function UnapplyableNotebookUpdateNotice({
  notebookName,
  reason,
  confirmState,
  footerAction,
  onDeny,
  denyWithReason,
}: {
  notebookName: string
  reason: string
  confirmState?: ConfirmFooterApprovalState
  footerAction?: ReactNode
  onDeny?: () => void
  denyWithReason?: (reason: string) => void
}) {
  const onUnapplyable = useEffectEvent(() => {
    denyWithReason?.(reason)
  })

  useEffect(() => {
    if (confirmState === 'approval-requested') onUnapplyable()
  }, [confirmState])

  const isTerminal = confirmState !== undefined && TERMINAL_CONFIRM_STATES.includes(confirmState)

  return (
    <NotebookConfirm
      mode="update"
      confirmState={confirmState}
      footerAction={footerAction}
      message={`Assistant wants to update "${notebookName}"`}
      denyOnly
      onDeny={() => (denyWithReason ? denyWithReason(reason) : onDeny?.())}
    >
      <div className="p-3">
        {isTerminal ? (
          <Admonition
            type="warning"
            title="Preview unavailable"
            description="This notebook has changed since, so the preview can't be reconstructed."
          />
        ) : (
          <Admonition
            type="warning"
            title="This update can't be applied as written"
            description={reason}
          />
        )}
      </div>
    </NotebookConfirm>
  )
}

function UpdateNotebookProposal({
  input,
  state,
  output,
  confirmState,
  footerAction,
  onApprove,
  onDeny,
  denyWithReason,
}: NotebookProposalStepProps & { state: NotebookProposalState; output: unknown }) {
  const { ref } = useParams()
  const parsedInput = updateNotebookInputSchema.safeParse(input)
  const isCompleted = state === 'output-available'

  const {
    data: notebook,
    isLoading,
    isError,
    error,
  } = useNotebookQuery(
    { projectRef: ref, id: parsedInput.success ? parsedInput.data.id : undefined },
    { enabled: parsedInput.success && !isCompleted }
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

  if (isCompleted) {
    const parsedOutput = updateNotebookToolOutputSchema.safeParse(output)
    const notebookName = parsedOutput.success ? parsedOutput.data.name : undefined
    const previousContent = parsedOutput.success ? parsedOutput.data.previous_content : undefined
    const diff = previousContent
      ? deriveNotebookDiff(previousContent, parsedInput.data.operations)
      : undefined

    if (diff?.success) {
      return (
        <NotebookConfirm
          mode="update"
          confirmState={confirmState}
          footerAction={footerAction}
          message={`Assistant wants to update "${notebookName}"`}
          onApprove={onApprove}
          onDeny={onDeny}
        >
          <AssistantNotebookPreview entries={diff.entries} mode="update" title={notebookName} />
        </NotebookConfirm>
      )
    }

    return (
      <NotebookConfirm
        mode="update"
        confirmState={confirmState}
        footerAction={footerAction}
        onApprove={onApprove}
        onDeny={onDeny}
      >
        <div className="p-3 text-sm text-foreground-light truncate">
          {notebookName ? `Notebook updated: ${notebookName}` : MODE_COPY.update.outputLabel}
        </div>
      </NotebookConfirm>
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
      <UnapplyableNotebookUpdateNotice
        notebookName={notebook.name}
        reason={describeNotebookOperationError(diff.error)}
        confirmState={confirmState}
        footerAction={footerAction}
        onDeny={onDeny}
        denyWithReason={denyWithReason}
      />
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
