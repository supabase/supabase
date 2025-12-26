import * as ai from 'ai'
import {
  convertToModelMessages,
  isToolUIPart,
  type LanguageModel,
  type ModelMessage,
  stepCountIs,
  type ToolSet,
  type UIMessage,
} from 'ai'
import { wrapAISDK } from 'braintrust'
import { source } from 'common-tags'

import type { AiOptInLevel } from 'hooks/misc/useOrgOptedIntoAi'
import {
  CHAT_PROMPT,
  EDGE_FUNCTION_PROMPT,
  GENERAL_PROMPT,
  LIMITATIONS_PROMPT,
  PG_BEST_PRACTICES,
  REALTIME_PROMPT,
  RLS_PROMPT,
  SECURITY_PROMPT,
} from 'lib/ai/prompts'
import { sanitizeMessagePart } from 'lib/ai/tools/tool-sanitizer'
import { getActiveIncidents, type IncidentInfo } from 'lib/api/incident-status'

const { streamText } = wrapAISDK(ai)

/**
 * Fetches active incidents and formats them into a context string for the AI.
 * Returns an empty string if there are no incidents or if fetching fails.
 */
async function getIncidentContext(): Promise<string> {
  try {
    const incidents = await getActiveIncidents()

    if (incidents.length === 0) {
      return ''
    }

    const incidentSummaries = incidents
      .map((incident: IncidentInfo) => `"${incident.name}" (status: ${incident.status})`)
      .join(', ')

    const isPlural = incidents.length > 1
    return `IMPORTANT: There ${isPlural ? 'are' : 'is'} currently ${incidents.length} active incident${isPlural ? 's' : ''} on Supabase's infrastructure: ${incidentSummaries}. If the user is asking about issues that may be related to these incidents, inform them about the ongoing incident(s) and direct them to https://status.supabase.com for real-time updates.`
  } catch (error) {
    // Silently fail - don't block AI responses if incident fetch fails
    console.warn('Failed to fetch incident status for AI context:', error)
    return ''
  }
}

export async function generateAssistantResponse({
  messages: rawMessages,
  model,
  tools,
  aiOptInLevel = 'schema',
  getSchemas,
  projectRef,
  chatName,
  promptProviderOptions,
  providerOptions,
  abortSignal,
}: {
  messages: UIMessage[]
  model: LanguageModel
  tools: ToolSet
  aiOptInLevel?: AiOptInLevel
  getSchemas?: () => Promise<string>
  projectRef?: string
  chatName?: string
  promptProviderOptions?: Record<string, any>
  providerOptions?: Record<string, any>
  abortSignal?: AbortSignal
}) {
  // Only returns last 7 messages
  // Filters out tools with invalid states
  // Filters out tool outputs based on opt-in level using renderingToolOutputParser
  const messages = (rawMessages || []).slice(-7).map((msg) => {
    if (msg && msg.role === 'assistant' && 'results' in msg) {
      const cleanedMsg = { ...msg }
      delete cleanedMsg.results
      return cleanedMsg
    }
    if (msg && msg.role === 'assistant' && msg.parts) {
      const cleanedParts = msg.parts
        .filter((part) => {
          if (isToolUIPart(part)) {
            const invalidStates = ['input-streaming', 'input-available', 'output-error']
            return !invalidStates.includes(part.state)
          }
          return true
        })
        .map((part) => {
          return sanitizeMessagePart(part, aiOptInLevel)
        })
      return { ...msg, parts: cleanedParts }
    }
    return msg
  })

  // Fetch schemas and incident context in parallel
  const [schemasString, incidentContext] = await Promise.all([
    aiOptInLevel !== 'disabled' && getSchemas
      ? getSchemas()
      : Promise.resolve("You don't have access to any schemas."),
    getIncidentContext(),
  ])

  // Important: do not use dynamic content in the system prompt or Bedrock will not cache it
  const system = source`
    ${GENERAL_PROMPT}
    ${CHAT_PROMPT}
    ${PG_BEST_PRACTICES}
    ${RLS_PROMPT}
    ${EDGE_FUNCTION_PROMPT}
    ${REALTIME_PROMPT}
    ${SECURITY_PROMPT}
    ${LIMITATIONS_PROMPT}
  `

  // Note: these must be of type `CoreMessage` to prevent AI SDK from stripping `providerOptions`
  // https://github.com/vercel/ai/blob/81ef2511311e8af34d75e37fc8204a82e775e8c3/packages/ai/core/prompt/standardize-prompt.ts#L83-L88
  const baseContext =
    projectRef || chatName || schemasString !== "You don't have access to any schemas."
      ? `The user's current project is ${projectRef || 'unknown'}. Their available schemas are: ${schemasString}. The current chat name is: ${chatName || 'unnamed'}.`
      : undefined

  const assistantContent = [baseContext, incidentContext].filter(Boolean).join(' ') || undefined

  const coreMessages: ModelMessage[] = [
    {
      role: 'system',
      content: system,
      ...(promptProviderOptions && {
        providerOptions: promptProviderOptions,
      }),
    },
    ...(assistantContent
      ? [
          {
            role: 'assistant' as const,
            // Add any dynamic context here
            content: assistantContent,
          },
        ]
      : []),
    ...convertToModelMessages(messages),
  ]

  return streamText({
    model,
    stopWhen: stepCountIs(5),
    messages: coreMessages,
    ...(providerOptions && { providerOptions }),
    tools,
    ...(abortSignal && { abortSignal }),
  })
}
