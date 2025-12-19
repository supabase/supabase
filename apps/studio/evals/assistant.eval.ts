import { openai } from '@ai-sdk/openai'
import { Eval } from 'braintrust'
import { generateAssistantResponse } from 'lib/ai/generate-assistant-response'
import { getMockTools } from 'lib/ai/tools/mock-tools'
import assert from 'node:assert'
import { dataset } from './dataset'
import {
  completenessScorer,
  concisenessScorer,
  helpfulnessScorer,
  sqlSyntaxScorer,
  toolUsageScorer,
} from './scorer'

assert(process.env.BRAINTRUST_PROJECT_ID, 'BRAINTRUST_PROJECT_ID is not set')
assert(process.env.OPENAI_API_KEY, 'OPENAI_API_KEY is not set')

Eval('Assistant', {
  projectId: process.env.BRAINTRUST_PROJECT_ID,
  data: () => dataset,
  task: async (input) => {
    const result = await generateAssistantResponse({
      model: openai('gpt-5-mini'),
      messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: input }] }],
      tools: await getMockTools(),
    })

    // `result.toolCalls` only shows the last step, instead aggregate tools across all steps
    const steps = await result.steps

    const stepsSerialized = steps
      .map((step) => {
        const toolCalls = step.toolCalls
          ?.map((call) => JSON.stringify({ tool: call.toolName, input: call.input }))
          .join('\n')

        const text = step.text
        return toolCalls ? `${text}\n${toolCalls}` : text
      })
      .join('\n')

    const toolNames = steps.flatMap((step) => step.toolCalls.map((call) => call.toolName))

    const sqlQueries: string[] = []
    const docs: string[] = []

    for (const step of steps) {
      for (const call of step.toolCalls) {
        if (call.toolName === 'execute_sql') {
          sqlQueries.push(call.input.sql)
        }
        if (call.toolName === 'search_docs') {
          const result = step.toolResults.at(0)
          const searchDocsText = result?.output?.content?.at(0)?.text
          if (typeof searchDocsText !== 'string') {
            continue // invalid or missing search_docs text
          }

          docs.push(searchDocsText)
        }
      }
    }

    return {
      stepsSerialized,
      toolNames,
      sqlQueries,
      docs,
    }
  },
  scores: [
    toolUsageScorer,
    sqlSyntaxScorer,
    helpfulnessScorer,
    concisenessScorer,
    completenessScorer,
  ],
})
