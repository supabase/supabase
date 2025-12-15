import { openai } from '@ai-sdk/openai'
import { Eval } from 'braintrust'
import { stripIndent } from 'common-tags'
import {
  AssistantEvalCase,
  criteriaMetScorer,
  sqlSimilarityScorer,
  textIncludesScorer,
  toolUsageScorer,
} from 'lib/ai/evals/scorer'
import { generateAssistantResponse } from 'lib/ai/generate-assistant-response'
import { getMockTools } from 'lib/ai/tools/mock-tools'
import assert from 'node:assert'

assert(process.env.BRAINTRUST_PROJECT_ID, 'BRAINTRUST_PROJECT_ID is not set')
assert(process.env.OPENAI_API_KEY, 'OPENAI_API_KEY is not set')

Eval('Assistant', {
  projectId: process.env.BRAINTRUST_PROJECT_ID,
  data: () => {
    return [
      {
        input: 'Hello!',
        expected: { textIncludes: 'Hi' },
        metadata: { category: ['other'] },
      },
      {
        input: 'How do I implement IP address rate limiting?',
        expected: { requiredTools: ['search_docs'] },
        metadata: { category: ['general_help'] },
      },
      {
        input: 'Check if my project is having issues right now and tell me what to fix first.',
        expected: {
          requiredTools: ['get_advisors', 'get_logs'],
          criteria: 'Response reflects there are RLS issues to fix.',
        },
        metadata: { category: ['debugging', 'rls_policies'] },
      },
      {
        input: 'Create a new table "foods" with columns for "name" and "color"',
        expected: {
          sqlQuery: stripIndent`CREATE TABLE IF NOT EXISTS public.foods ( id bigserial PRIMARY KEY, name text NOT NULL, color text );`,
        },
        metadata: { category: ['sql_generation', 'schema_design'] },
      },
    ] satisfies AssistantEvalCase[]
  },
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
  scores: [toolUsageScorer, sqlSimilarityScorer, criteriaMetScorer, textIncludesScorer],
})
