import assert from 'node:assert'
import { Eval } from 'braintrust'

import { dataset } from './dataset'
import { buildAssistantEvalOutput } from './output'
import {
  completenessScorer,
  concisenessScorer,
  correctnessScorer,
  docsFaithfulnessScorer,
  goalCompletionScorer,
  knowledgeUsageScorer,
  toolUsageScorer,
  urlValidityScorer,
} from './scorer'
import { sqlIdentifierQuotingScorer, sqlSyntaxScorer } from './scorer-wasm'
import { generateAssistantResponse } from '@/lib/ai/generate-assistant-response'
import { getModel } from '@/lib/ai/model'
import { DEFAULT_ASSISTANT_BASE_MODEL_ID, getAssistantModelEntry } from '@/lib/ai/model.utils'
import { getMockTools } from '@/lib/ai/tools/mock-tools'

assert(process.env.BRAINTRUST_PROJECT_ID, 'BRAINTRUST_PROJECT_ID is not set')
assert(process.env.OPENAI_API_KEY, 'OPENAI_API_KEY is not set')

Eval('Assistant', {
  projectId: process.env.BRAINTRUST_PROJECT_ID,
  trialCount: process.env.CI ? 3 : 1,
  data: () => dataset,
  task: async (input) => {
    const modelEntry = getAssistantModelEntry(DEFAULT_ASSISTANT_BASE_MODEL_ID)
    const modelResponse = await getModel({ provider: 'openai', modelEntry })
    if (modelResponse.error) throw modelResponse.error

    const result = await generateAssistantResponse({
      ...modelResponse.modelParams,
      messages: [
        {
          id: '1',
          role: 'user',
          parts: [{ type: 'text', text: input.prompt }],
        },
      ],
      tools: await getMockTools(input.mockTables ? { list_tables: input.mockTables } : undefined),
    })

    // `result.toolCalls` only shows the last step, instead aggregate tools across all steps
    const [finishReason, steps] = await Promise.all([result.finishReason, result.steps])

    return buildAssistantEvalOutput(finishReason, steps)
  },
  scores: [
    toolUsageScorer,
    knowledgeUsageScorer,
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
