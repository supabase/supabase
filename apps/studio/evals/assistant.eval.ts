import { openai } from '@ai-sdk/openai'
import { Eval } from 'braintrust'
import {
  criteriaMetScorer,
  sqlSimilarityScorer,
  sqlSyntaxScorer,
  textIncludesScorer,
  toolUsageScorer,
} from './scorer'
import { generateAssistantResponse } from 'lib/ai/generate-assistant-response'
import { getMockTools } from 'lib/ai/tools/mock-tools'
import assert from 'node:assert'
import { dataset } from './dataset'

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

    const textLastStep = await result.text

    // `result.toolCalls` only shows the last step, instead aggregate tools across all steps
    const steps = await result.steps
    const toolNamesAllStepsFlattened = steps.flatMap((step) =>
      step.toolCalls.map((call) => call.toolName)
    )

    const sqlQueries: string[] = []

    for (const step of steps) {
      for (const call of step.toolCalls) {
        if (call.toolName === 'execute_sql') {
          sqlQueries.push(call.input.sql)
        }
      }
    }

    return {
      text: textLastStep,
      tools: toolNamesAllStepsFlattened,
      sqlQueries,
    }
  },
  scores: [
    toolUsageScorer,
    sqlSimilarityScorer,
    sqlSyntaxScorer,
    criteriaMetScorer,
    textIncludesScorer,
  ],
})
