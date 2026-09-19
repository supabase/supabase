export type ConfirmFooterApprovalState =
  | 'approval-requested'
  | 'approval-responded'
  | 'success'
  | 'error'
  | 'denied'

/** Sent with Skip so the model sees a user choice, not the SDK default "Tool execution denied." */
export const USER_SKIPPED_TOOL_REASON = 'The user skipped this action.'

export type ToolApprovalFields = {
  id?: string
  approved?: boolean
  /** AI SDK v7: automatic policy decisions must not get a confirm footer or response. */
  isAutomatic?: boolean
}

/**
 * Whether the confirm bar should render, and whether it is loading or in a terminal state.
 * Driven by the AI SDK tool approval state; any other state hides the bar.
 */
export function getConfirmFooterBar(state?: ConfirmFooterApprovalState): {
  show: boolean
  isLoading: boolean
  outcome?: 'success' | 'error' | 'denied'
} {
  if (state === 'approval-requested') return { show: true, isLoading: false }
  if (state === 'approval-responded') return { show: true, isLoading: true }
  if (state === 'success' || state === 'error' || state === 'denied') {
    return { show: true, isLoading: false, outcome: state }
  }
  return { show: false, isLoading: false }
}

/**
 * Maps a tool part onto the confirm footer. Follows the AI SDK `useChat` rule:
 * interactive Approve/Deny only for `approval-requested` when `!approval.isAutomatic`.
 * `approval-responded` keeps a loading morph after a manual approve. Completed manual
 * approvals stay visible as a terminal outcome; automatic decisions never get a footer.
 *
 * @see https://ai-sdk.dev/docs/agents/tool-approvals
 */
export function getManualToolApprovalConfirmState({
  state,
  approval,
}: {
  state: string
  approval?: ToolApprovalFields
}): ConfirmFooterApprovalState | undefined {
  if (approval?.isAutomatic) return undefined
  if (state === 'approval-requested') return 'approval-requested'
  if (state === 'approval-responded' && approval?.approved !== false) return 'approval-responded'
  if (state === 'output-available' && approval?.approved === true) return 'success'
  if (state === 'output-error' && approval?.approved === true) return 'error'
  if (state === 'output-denied' && approval?.approved === false) return 'denied'
  return undefined
}

export function getManualToolApprovalId({
  state,
  approval,
}: {
  state: string
  approval?: ToolApprovalFields
}): string | undefined {
  if (state !== 'approval-requested' || approval?.isAutomatic) return undefined
  return approval?.id
}

export function getManualToolApprovalHandlers({
  state,
  approval,
  addToolApprovalResponse,
}: {
  state: string
  approval?: ToolApprovalFields
  addToolApprovalResponse?: (args: {
    id: string
    approved: boolean
    reason?: string
  }) => void | PromiseLike<void>
}): {
  confirmState?: ConfirmFooterApprovalState
  onApprove?: () => void
  onDeny?: () => void
  /** Deny with a specific reason instead of USER_SKIPPED_TOOL_REASON, e.g. for an automatic
   *  denial that should tell the model what went wrong rather than that the user skipped it. */
  denyWithReason?: (reason: string) => void
} {
  const confirmState = getManualToolApprovalConfirmState({ state, approval })
  const approvalId = getManualToolApprovalId({ state, approval })
  if (!approvalId) return { confirmState }

  return {
    confirmState,
    onApprove: () => addToolApprovalResponse?.({ id: approvalId, approved: true }),
    onDeny: () =>
      addToolApprovalResponse?.({
        id: approvalId,
        approved: false,
        reason: USER_SKIPPED_TOOL_REASON,
      }),
    denyWithReason: (reason: string) =>
      addToolApprovalResponse?.({ id: approvalId, approved: false, reason }),
  }
}
