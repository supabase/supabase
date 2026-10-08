import type { UIMessage } from 'ai'

import type { OptInDecision } from './scorer'
import type { Transcript } from './transcript'
import { USER_SKIPPED_TOOL_REASON } from '@/components/ui/AIAssistantPanel/Confirm.utils'
import type { AiOptInLevel } from '@/hooks/misc/useOrgOptedIntoAi'
import { storedUpdateOptInLevelInputSchema } from '@/lib/ai/tool-filter'

const TOOL_PART_TYPE = 'tool-update_opt_in_level'

/**
 * Answers the pending `update_opt_in_level` approval the way the card would.
 * Returns the history to resume with and the level the next request runs at, or null
 * when the model never asked.
 *
 * accept          → approved, level becomes the requested one
 * skip            → denied with the Skip reason, level unchanged
 * { chooses: L }  → approved after the user saved L, whatever was requested
 */
export function applyOptInDecision(
  message: UIMessage,
  decision: OptInDecision,
  currentLevel: AiOptInLevel
): {
  message: UIMessage
  level: AiOptInLevel
  deniedToolCalls: Array<{ toolName: string; input: unknown }>
} | null {
  let level = currentLevel
  let isResolved = false
  const deniedToolCalls: Array<{ toolName: string; input: unknown }> = []

  const parts = message.parts.map((part): UIMessage['parts'][number] => {
    if (part.type !== TOOL_PART_TYPE || part.state !== 'approval-requested' || !part.approval) {
      return part
    }

    isResolved = true
    const requestedLevel = storedUpdateOptInLevelInputSchema.safeParse(part.input).data
      ?.requiredLevel
    const isApproved = decision !== 'skip'
    if (!isApproved) deniedToolCalls.push({ toolName: 'update_opt_in_level', input: part.input })
    if (decision === 'accept') level = requestedLevel ?? currentLevel
    if (typeof decision === 'object') level = decision.chooses

    return {
      type: TOOL_PART_TYPE,
      toolCallId: part.toolCallId,
      state: 'approval-responded' as const,
      input: part.input,
      approval: {
        id: part.approval.id,
        approved: isApproved,
        ...(!isApproved && { reason: USER_SKIPPED_TOOL_REASON }),
      },
    }
  })

  return isResolved ? { message: { ...message, parts }, level, deniedToolCalls } : null
}

function describeDecision(decision: OptInDecision) {
  if (decision === 'accept') return 'accepted the request'
  if (decision === 'skip') return 'skipped the request'
  return `saved the ${decision.chooses} level`
}

/**
 * Joins the transcripts of the two requests with a marker, so a judge can tell the original
 * request from anything the Assistant does after the user answered.
 */
export function joinTranscripts(first: Transcript, second: Transcript, decision: OptInDecision) {
  const marker = `[user ${describeDecision(decision)}]`
  const join = (a: string | null, b: string | null) =>
    [a, marker, b].filter((part) => part !== null).join('\n')
  return {
    currentUserInput: first.currentUserInput,
    priorConversation: first.priorConversation,
    lastAssistantTurn: join(first.lastAssistantTurn, second.lastAssistantTurn),
    lastAssistantTurnWithToolInputs: join(
      first.lastAssistantTurnWithToolInputs,
      second.lastAssistantTurnWithToolInputs
    ),
  }
}
