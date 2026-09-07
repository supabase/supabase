import {
  convertToModelMessages,
  isStepCount,
  isToolUIPart,
  streamText,
  type LanguageModel,
  type ModelMessage,
  type ToolSet,
  type UIMessage,
} from 'ai'

import { createSkillCatalog, type AgentSkill } from './skills'
import {
  composeTools,
  sanitizeToolErrorForModel,
  sanitizeToolOutputForModel,
  withToolPolicy,
  type AgentToolPolicy,
} from './tools'

type MaybePromise<T> = T | Promise<T>

export type AgentToolResources = {
  tools: ToolSet
  close?: () => MaybePromise<void>
}

/** Context is supplied by the application after authentication, never by the model. */
export type AgentDefinition<Context> = {
  name: string
  instructions: string
  maxSteps?: number
  skills?: readonly AgentSkill[]
  skillToolName?: string
  permissions?: Record<string, AgentToolPolicy<Context>>
  tools?: (
    context: Context,
    options: { abortSignal: AbortSignal }
  ) => MaybePromise<AgentToolResources>
  prepareMessages?: (messages: UIMessage[], context: Context) => MaybePromise<UIMessage[]>
  contextMessages?: (context: Context, messages: UIMessage[]) => MaybePromise<ModelMessage[]>
}

export type AgentStreamOptions = {
  messages: UIMessage[]
  model: LanguageModel
  reasoning?: Parameters<typeof streamText>[0]['reasoning']
  providerOptions?: Parameters<typeof streamText>[0]['providerOptions']
}

export type AgentSession = {
  tools: ToolSet
  close: () => Promise<void>
  stream: (options: AgentStreamOptions) => Promise<ReturnType<typeof streamText>>
}

export type Agent<Context> = {
  name: string
  prepare: (options: { context: Context; abortSignal?: AbortSignal }) => Promise<AgentSession>
}

/** Define once; prepare a fresh session for each authenticated turn. */
export function defineAgent<Context>(definition: AgentDefinition<Context>): Agent<Context> {
  const maxSteps = definition.maxSteps ?? 10
  if (!definition.name.trim()) throw new Error('Agent name is required.')
  if (!Number.isSafeInteger(maxSteps) || maxSteps < 1)
    throw new Error('Agent maxSteps must be a positive integer.')

  const catalog = definition.skills?.length ? createSkillCatalog(definition.skills) : undefined
  const skillToolName = definition.skillToolName ?? 'load_skill'
  const instructions = [definition.instructions, catalog?.instructions(skillToolName)]
    .filter(Boolean)
    .join('\n\n')

  return {
    name: definition.name,
    async prepare({ context, abortSignal }: { context: Context; abortSignal?: AbortSignal }) {
      const controller = new AbortController()
      const signal = abortSignal
        ? AbortSignal.any([abortSignal, controller.signal])
        : controller.signal
      signal.throwIfAborted()
      const resources = (await definition.tools?.(context, { abortSignal: signal })) ?? {
        tools: {},
      }
      let closing: Promise<void> | undefined
      const close = () => {
        if (!closing) {
          signal.removeEventListener('abort', onAbort)
          // Assign before invoking cleanup: closing can itself cause an abort.
          closing = Promise.resolve().then(() => resources.close?.())
          controller.abort()
        }
        return closing
      }
      const onAbort = () => {
        // The transport awaits close() and handles cleanup failures.
        void close().catch(() => {})
      }
      signal.addEventListener('abort', onAbort, { once: true })
      try {
        signal.throwIfAborted()
        const composed = composeTools({
          base: resources.tools,
          extensions: catalog ? [{ [skillToolName]: catalog.tool }] : [],
        })
        const tools = definition.permissions
          ? withToolPolicy(composed, { context, policies: definition.permissions })
          : composed
        let hasStarted = false
        return {
          tools,
          close,
          async stream(options: AgentStreamOptions) {
            if (hasStarted) throw new Error('Prepare a new agent session for each turn.')
            hasStarted = true
            try {
              signal.throwIfAborted()
              const preparedMessages = definition.prepareMessages
                ? await definition.prepareMessages(options.messages, context)
                : options.messages
              const messages = await Promise.all(
                preparedMessages.map(async (message) => ({
                  ...message,
                  parts: await Promise.all(
                    message.parts.map(async (part) => {
                      if (!definition.permissions || !isToolUIPart(part)) return part
                      const name = part.type === 'dynamic-tool' ? part.toolName : part.type.slice(5)
                      const projection = {
                        context,
                        policies: definition.permissions,
                        input: part.input,
                        toolCallId: part.toolCallId,
                      }
                      // AI SDK handles errors before toModelOutput, so error privacy
                      // must be applied to every historical failure before conversion.
                      if (part.state === 'output-error')
                        return {
                          ...part,
                          errorText: await sanitizeToolErrorForModel(
                            name,
                            part.errorText,
                            projection
                          ),
                        }
                      if (part.state !== 'output-available' || Object.hasOwn(tools, name))
                        return part
                      // Missing tools have no SDK converter, but retain their current
                      // execution and sharing policy even when discovery is unavailable.
                      return {
                        ...part,
                        output: await sanitizeToolOutputForModel(name, part.output, projection),
                      }
                    })
                  ),
                }))
              )
              const contextMessages = (await definition.contextMessages?.(context, messages)) ?? []
              const modelMessages = await convertToModelMessages(messages, { tools })
              signal.throwIfAborted()
              return streamText({
                model: options.model,
                instructions,
                messages: [...contextMessages, ...modelMessages],
                tools,
                stopWhen: isStepCount(maxSteps),
                abortSignal: signal,
                ...(options.reasoning && { reasoning: options.reasoning }),
                ...(options.providerOptions && { providerOptions: options.providerOptions }),
              })
            } catch (error) {
              await close()
              throw error
            }
          },
        }
      } catch (error) {
        await close()
        throw error
      }
    },
  }
}
