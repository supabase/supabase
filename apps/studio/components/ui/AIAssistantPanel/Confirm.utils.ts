export type ConfirmFooterApprovalState = 'approval-requested' | 'approval-responded'

/** Sent with Skip so the model sees a user choice, not the SDK default "Tool execution denied." */
export const USER_SKIPPED_TOOL_REASON = 'The user skipped this action.'

export type ToolApprovalFields = {
  id?: string
  approved?: boolean
  /** AI SDK v7: automatic policy decisions must not get a confirm footer or response. */
  isAutomatic?: boolean
}

/**
 * Whether the confirm bar should render, and whether it is in the post-approve loading
 * morph. Driven by the AI SDK tool approval state; any other state hides the bar.
 */
export function getConfirmFooterBar(state?: string): { show: boolean; isLoading: boolean } {
  if (state === 'approval-requested') return { show: true, isLoading: false }
  if (state === 'approval-responded') return { show: true, isLoading: true }
  return { show: false, isLoading: false }
}

/**
 * Maps a tool part onto the confirm footer. Follows the AI SDK `useChat` rule:
 * interactive Approve/Deny only for `approval-requested` when `!approval.isAutomatic`.
 * `approval-responded` keeps a loading morph after a manual approve; denials and
 * automatic decisions hide the bar.
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
  }
}
