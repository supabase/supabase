import assert from 'node:assert'
import { openai } from '@ai-sdk/openai'
import { Eval } from 'braintrust'
import { generateAssistantResponse } from 'lib/ai/generate-assistant-response'
import { getMockTools } from 'lib/ai/tools/mock-tools'

import { dataset } from './dataset'
import { buildAssistantEvalOutput } from './output'
import {
  completenessScorer,
  concisenessScorer,
  correctnessScorer,
  docsFaithfulnessScorer,
  goalCompletionScorer,
  toolUsageScorer,
  urlValidityScorer,
} from './scorer'
import { sqlIdentifierQuotingScorer, sqlSyntaxScorer } from './scorer-wasm'

assert(process.env.BRAINTRUST_PROJECT_ID, 'BRAINTRUST_PROJECT_ID is not set')
assert(process.env.OPENAI_API_KEY, 'OPENAI_API_KEY is not set')

Eval('Assistant', {
  projectId: process.env.BRAINTRUST_PROJECT_ID,
  trialCount: process.env.CI ? 3 : 1,
  data: () => dataset,
  task: async (input) => {
    const result = await generateAssistantResponse({
      model: openai('gpt-5-mini'),
      messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: input.prompt }] }],
      tools: await getMockTools(input.mockTables ? { list_tables: input.mockTables } : undefined),
    })

    // `result.toolCalls` only shows the last step, instead aggregate tools across all steps
    const [finishReason, steps] = await Promise.all([result.finishReason, result.steps])

    return buildAssistantEvalOutput(finishReason, steps)
  },
  scores: [
    toolUsageScorer,
    sqlSyntaxScorer,
    sqlIdentifierQuotingScorer,
    goalCompletionScorer,
    concisenessScorer,
    completenessScorer,
    docsFaithfulnessScorer,
    correctnessScorer,
    urlValidityScorer,
  ],
})
