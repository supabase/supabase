import type { ModelMessage } from 'ai'
import { stripIndent } from 'common-tags'

import {
  CHAT_PROMPT,
  EDGE_FUNCTION_PROMPT,
  GENERAL_PROMPT,
  LIMITATIONS_PROMPT,
  PG_BEST_PRACTICES,
  RLS_PROMPT,
  SECURITY_PROMPT,
} from 'lib/ai/prompts'

type ProviderOptions = Record<string, any> | undefined

/**
 * Builds a system prompt for AI Assitant threads.
 *
 * Do not include dynamic data in the prompt, or it will not be cached.
 */
export function buildSystemPrompt({
  includeLimitations = false,
}: {
  includeLimitations?: boolean
}) {
  return stripIndent`
    ${GENERAL_PROMPT}
    ${CHAT_PROMPT}
    ${PG_BEST_PRACTICES}
    ${RLS_PROMPT}
    ${EDGE_FUNCTION_PROMPT}
    ${SECURITY_PROMPT}
    ${includeLimitations ? LIMITATIONS_PROMPT : ''}
  `
}

export function buildAssistantContextContent({
  projectRef,
  schemasString,
  chatName,
}: {
  projectRef: string
  schemasString: string
  chatName: string
}) {
  return `The user's current project is ${projectRef}. Their available schemas are: ${schemasString}. The current chat name is: ${chatName}.`
}

export function buildCoreMessagesForEval({
  projectRef,
  chatName,
  input,
  promptProviderOptions,
  includeLimitations = false,
}: {
  projectRef: string
  chatName: string
  input: string
  promptProviderOptions: ProviderOptions
  includeLimitations?: boolean
}): ModelMessage[] {
  const system = buildSystemPrompt({ includeLimitations })
  const schemasString = "You don't have access to any schemas."

  return [
    {
      role: 'system',
      content: system,
      ...(promptProviderOptions && { providerOptions: promptProviderOptions }),
    },
    {
      role: 'assistant',
      content: buildAssistantContextContent({ projectRef, schemasString, chatName }),
    },
    { role: 'user', content: input },
  ]
}

export function buildCoreMessagesForChat({
  projectRef,
  chatName,
  schemasString,
  userMessages,
  promptProviderOptions,
  includeLimitations = true,
}: {
  projectRef: string
  chatName: string
  schemasString: string
  userMessages: Array<ModelMessage>
  promptProviderOptions: ProviderOptions
  includeLimitations?: boolean
}): ModelMessage[] {
  const system = buildSystemPrompt({ includeLimitations })

  return [
    {
      role: 'system',
      content: system,
      ...(promptProviderOptions && { providerOptions: promptProviderOptions }),
    },
    {
      role: 'assistant',
      content: buildAssistantContextContent({ projectRef, schemasString, chatName }),
    },
    ...userMessages,
  ]
}
