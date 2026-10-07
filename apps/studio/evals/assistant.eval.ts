import assert from 'node:assert'
import { readUIMessageStream, toUIMessageStream, type UIMessage } from 'ai'
import { Eval } from 'braintrust'

import { dataset } from './dataset'
import { applyOptInDecision, joinTranscripts } from './opt-in-replay'
import {
  completenessScorer,
  concisenessScorer,
  correctnessScorer,
  docsFaithfulnessScorer,
  goalCompletionScorer,
  knowledgeUsageScorer,
  safetyScorer,
  toolUsageScorer,
  urlValidityScorer,
} from './scorer'
import { sqlIdentifierQuotingScorer, sqlSyntaxScorer } from './scorer-wasm'
import { buildTranscript } from './transcript'
import type { AiOptInLevel } from '@/hooks/misc/useOrgOptedIntoAi'
import { generateAssistantResponse } from '@/lib/ai/generate-assistant-response'
import { getModel } from '@/lib/ai/model'
import { DEFAULT_ASSISTANT_BASE_MODEL_ID, getAssistantModelEntry } from '@/lib/ai/model.utils'
import { filterToolsByOptInLevel } from '@/lib/ai/tool-filter'
import { getMockTools } from '@/lib/ai/tools/mock-tools'

assert(process.env.BRAINTRUST_PROJECT_ID, 'BRAINTRUST_PROJECT_ID is not set')
assert(process.env.OPENAI_API_KEY, 'OPENAI_API_KEY is not set')

Eval('Assistant', {
  projectId: process.env.BRAINTRUST_PROJECT_ID,
  trialCount: process.env.CI ? 3 : 1,
  // Braintrust defaults to unbounded concurrency (every case × trial runs in parallel
  // in one process), so memory scales linearly with dataset size. Left uncapped, this
  // OOMs the CI runner once the dataset grows large enough — cap it so the suite keeps
  // scaling safely instead of racing the runner's heap ceiling.
  maxConcurrency: 10,
  data: () => dataset,
  task: async (input) => {
    const modelEntry = getAssistantModelEntry(DEFAULT_ASSISTANT_BASE_MODEL_ID)
    const modelResponse = await getModel({ provider: 'openai', modelEntry })
    if (modelResponse.error) throw modelResponse.error

    const { aiOptInLevel, optInDecision } = input
    assert(!optInDecision || aiOptInLevel, 'optInDecision needs aiOptInLevel')

    const userMessage: UIMessage = {
      id: '1',
      role: 'user',
      parts: [{ type: 'text', text: input.prompt }],
    }

    const run = async (messages: UIMessage[], level: AiOptInLevel | undefined) => {
      const mockTools = await getMockTools(
        input.mockTables ? { list_tables: input.mockTables } : undefined,
        level
      )
      return generateAssistantResponse({
        ...modelResponse.modelParams,
        isExplorerEnabled: true,
        ...(level && { aiOptInLevel: level }),
        messages,
        tools: level ? filterToolsByOptInLevel(mockTools, level) : mockTools,
      })
    }

    const results = [await run([userMessage], aiOptInLevel)]

    if (optInDecision && aiOptInLevel) {
      // Same two requests as production: the approval pauses the turn, then the answered
      // approval resumes it at the level the user saved.
      let assistantMessage: UIMessage | undefined
      for await (const message of readUIMessageStream({
        stream: toUIMessageStream({ stream: results[0].stream }),
      })) {
        assistantMessage = message
      }
      const resumed =
        assistantMessage && applyOptInDecision(assistantMessage, optInDecision, aiOptInLevel)
      if (resumed) results.push(await run([userMessage, resumed.message], resumed.level))
    }

    const finishReason = await results[results.length - 1].finishReason
    const [first, second] = await Promise.all(
      results.map(async (result) => buildTranscript(input.prompt, await result.steps))
    )
    const transcript =
      second && optInDecision ? joinTranscripts(first, second, optInDecision) : first
    return { finishReason, transcript }
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
    safetyScorer,
    urlValidityScorer,
  ],
})
