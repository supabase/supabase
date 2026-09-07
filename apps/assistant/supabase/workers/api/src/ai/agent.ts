import { defineAgent } from '@supabase/agent-runtime'
import type { AgentToolPolicy } from '@supabase/agent-runtime'

import { buildAssistantContextMessages, NO_SCHEMA_ACCESS_MESSAGE } from './assistant-context'
import { messagesIncludeLogsSnippets } from './assistant-message-metadata'
import { prepareMessagesForModel } from './generate-assistant-response.utils'
import { CHAT_PROMPT, GENERAL_PROMPT, LIMITATIONS_PROMPT, SECURITY_PROMPT } from './prompts'
import { assistantSkills } from './skills'
import { getTools } from './tools'
import { assistantToolPolicies } from './tools/tool-policies'

type AssistantContext = Omit<Parameters<typeof getTools>[0], 'signal'> & {
  chatName?: string
  getSchemas?: () => Promise<string>
}

const permissions: Record<string, AgentToolPolicy<AssistantContext>> = Object.fromEntries(
  Object.entries(assistantToolPolicies).map(
    ([name, policy]): [string, AgentToolPolicy<AssistantContext>] => [
      name,
      {
        visible: (context: AssistantContext) =>
          !['escalate_to_human', 'resolve_support_conversation'].includes(name) ||
          context.supportMode === true,
        canExecute: (context: AssistantContext, call) =>
          policy.canExecute?.(context.aiOptInLevel, call) ?? true,
        needsApproval:
          typeof policy.needsApproval === 'function'
            ? (context: AssistantContext, call) =>
                typeof policy.needsApproval === 'function' &&
                policy.needsApproval(context.aiOptInLevel, call)
            : policy.needsApproval,
        ...(Object.hasOwn(policy, 'deniedOutput') ? { deniedOutput: policy.deniedOutput } : {}),
        modelOutput: (output, context: AssistantContext, call) =>
          policy.modelOutput ? policy.modelOutput(output, context.aiOptInLevel, call) : output,
        modelError: policy.modelError
          ? (error, context: AssistantContext, call) =>
              policy.modelError!(error, context.aiOptInLevel, call)
          : undefined,
      },
    ]
  )
)

/** Studio is one HTTP consumer of this application-owned agent. */
export const assistantAgent = defineAgent<AssistantContext>({
  name: 'supabase-assistant',
  instructions: [GENERAL_PROMPT, CHAT_PROMPT, SECURITY_PROMPT, LIMITATIONS_PROMPT].join('\n\n'),
  maxSteps: 10,
  permissions,
  skills: assistantSkills,
  // Keep the integration's existing tool name and { name } input contract.
  skillToolName: 'load_knowledge',
  tools: (context, { abortSignal }) => getTools({ ...context, signal: abortSignal }),
  prepareMessages: (messages, context) => prepareMessagesForModel(messages, context.aiOptInLevel),
  contextMessages: async (context, messages) =>
    buildAssistantContextMessages({
      projectRef: context.projectRef,
      chatName: context.chatName,
      supportMode: context.supportMode,
      includesLogsSnippets: messagesIncludeLogsSnippets(messages),
      schemasString: context.getSchemas ? await context.getSchemas() : NO_SCHEMA_ACCESS_MESSAGE,
    }),
})
