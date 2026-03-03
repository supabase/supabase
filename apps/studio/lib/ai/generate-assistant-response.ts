import * as ai from 'ai'
import {
  convertToModelMessages,
  isToolUIPart,
  stepCountIs,
  type LanguageModel,
  type ModelMessage,
  type ToolSet,
  type UIMessage,
} from 'ai'
import { traced, wrapAISDK, type Span } from 'braintrust'
import { source } from 'common-tags'
import type { AiOptInLevel } from 'hooks/misc/useOrgOptedIntoAi'
import { IS_TRACING_ENABLED } from 'lib/ai/braintrust-logger'
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

const { streamText: tracedStreamText } = wrapAISDK(ai)

export async function generateAssistantResponse({
  messages: rawMessages,
  model,
  tools,
  aiOptInLevel = 'schema',
  getSchemas,
  projectRef,
  chatId,
  chatName,
  isHipaaEnabled,
  userId,
  orgId,
  planId,
  promptProviderOptions,
  providerOptions,
  requestedModel,
  abortSignal,
  onSpanCreated,
}: {
  messages: UIMessage[]
  model: LanguageModel
  tools: ToolSet
  aiOptInLevel?: AiOptInLevel
  getSchemas?: () => Promise<string>
  projectRef?: string
  chatId?: string
  chatName?: string
  isHipaaEnabled?: boolean
  userId?: string
  orgId?: number
  planId?: string
  requestedModel?: string
  promptProviderOptions?: Record<string, any>
  providerOptions?: Record<string, any>
  abortSignal?: AbortSignal
  onSpanCreated?: (spanId: string) => void
}) {
  const shouldTrace = IS_TRACING_ENABLED && !isHipaaEnabled

  const run = async (span?: Span) => {
    if (span) {
      onSpanCreated?.(span.id)
    }

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

    const schemasString =
      aiOptInLevel !== 'disabled' && getSchemas
        ? await traced(async () => getSchemas(), { name: 'getSchemas', type: 'function' })
        : "You don't have access to any schemas."

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
    const hasProjectContext =
      projectRef || chatName || schemasString !== "You don't have access to any schemas."

    const assistantContent = hasProjectContext
      ? `The user's current project is ${projectRef || 'unknown'}. Their available schemas are: ${schemasString}. The current chat name is: ${chatName || 'unnamed'}.`
      : undefined

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

    const streamTextFn = shouldTrace ? tracedStreamText : ai.streamText

    const streamTextArgs = {
      model,
      stopWhen: stepCountIs(5),
      messages: coreMessages,
      ...(providerOptions && { providerOptions }),
      tools,
      ...(abortSignal && { abortSignal }),
      onFinish: ({ steps }) => {
        for (const step of steps) {
          for (const toolCall of step.toolCalls) {
            if (toolCall.toolName === 'rename_chat') {
              const { newName } = toolCall.input as { newName: string }
              span?.log({ metadata: { chatName: newName } })
            }
          }
        }
      },
    } satisfies Parameters<typeof ai.streamText>[0]

    const lastUserMessage = rawMessages.findLast((m) => m.role === 'user')
    const lastUserText = lastUserMessage?.parts
      ?.filter((p): p is { type: 'text'; text: string } => p.type === 'text')
      .map((p) => p.text)
      .join('\n')

    span?.log({
      input: lastUserText,
      metadata: {
        projectRef,
        chatId,
        chatName,
        aiOptInLevel,
        userId,
        orgId,
        planId,
        requestedModel,
        gitBranch: process.env.VERCEL_GIT_COMMIT_REF,
        environment: process.env.NEXT_PUBLIC_ENVIRONMENT,
      },
    })

    return streamTextFn(streamTextArgs)
  }

  if (shouldTrace) {
    return traced(run, { type: 'function', name: 'generateAssistantResponse' })
  }

  return run()
}
