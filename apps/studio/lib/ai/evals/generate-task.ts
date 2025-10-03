import { generateText, stepCountIs, type ModelMessage, type ToolSet } from 'ai'

import { buildCoreMessagesForEval } from 'lib/ai/engine/messages'
import { getModel } from 'lib/ai/model'
import { getRenderingTools } from 'lib/ai/tools/rendering-tools'
import { getEvalMockTools } from './mock-tools'

type GenerateTaskOptions = {
  projectRef?: string
  chatName?: string
  isLimited?: boolean
}

/**
 * Mirrors the generate-v4 flow for task generation, but returns a simple text result
 * using generateText instead of streamText.
 */
export async function generateTask(input: string, opts: GenerateTaskOptions = {}) {
  const { projectRef = 'eval-project', chatName = 'RLS', isLimited = false } = opts

  const {
    model,
    error: modelError,
    promptProviderOptions,
    providerOptions,
  } = await getModel({
    provider: 'openai',
    model: 'gpt-5',
    routingKey: projectRef,
    isLimited,
  })

  if (modelError || !model) {
    throw modelError ?? new Error('Model unavailable')
  }

  const coreMessages: Array<ModelMessage> = buildCoreMessagesForEval({
    projectRef,
    chatName,
    input,
    promptProviderOptions,
  })

  // Deterministic tools for evals: always include rendering tools + mocked MCP/platform tools
  let tools: ToolSet = {
    ...getRenderingTools(),
    ...getEvalMockTools(),
  }

  const { steps } = await generateText({
    model,
    messages: coreMessages,
    stopWhen: stepCountIs(5),
    ...(providerOptions && { providerOptions }),
    tools,
  })

  const result = steps
    .map((step) => {
      const toolResults = step.toolResults
        ?.filter((tr) =>
          [
            'deploy_edge_function',
            'execute_sql',
            'list_policies',
            'list_tables',
            'list_edge_functions',
            'list_extensions',
            'get_logs',
            'get_advisors',
            'search_docs',
          ].includes(tr.toolName)
        )
        .map((result) => JSON.stringify({ tool: result.toolName, input: result.input }))
        .join('\n')

      const text = step.text
      return `${text}\n${toolResults}`
    })
    .join('\n')

  return result
}
