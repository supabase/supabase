/** Identity and input come from the stored pending call, never from browser claims. */
export type AgentApprovalResponse = {
  readonly messageId: string
  readonly approvalId: string
  readonly toolName: string
  readonly toolCallId: string
  readonly input: unknown
  readonly approved: boolean
  readonly reason?: string
}

export type CanRespondToAgentApproval<TContext> = (
  context: TContext,
  response: AgentApprovalResponse
) => boolean | Promise<boolean>

export class AgentApprovalAuthorizationError extends Error {
  readonly code = 'approval_forbidden'

  constructor() {
    super('You do not have permission to respond to this approval request.')
    this.name = 'AgentApprovalAuthorizationError'
  }
}

/** Call only after validating the response against the canonical pending approval. */
export async function authorizeAgentApprovalResponse<TContext>(
  response: AgentApprovalResponse,
  options: { context: TContext; canRespondToApproval?: CanRespondToAgentApproval<TContext> }
): Promise<void> {
  // The caller still enforces conversation ownership when no additional policy is configured.
  if (!options.canRespondToApproval) return
  let canRespond = false
  try {
    canRespond =
      (await options.canRespondToApproval(options.context, structuredClone(response))) === true
  } catch {
    // Never expose policy errors or interpret an unavailable policy as permission.
  }
  if (!canRespond) throw new AgentApprovalAuthorizationError()
}
