import { openai } from '@ai-sdk/openai'
import { Eval } from 'braintrust'
import { Assertion, AssertionScorer } from 'lib/ai/evals/scorer'
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
        expected: [{ type: 'text_includes', substring: 'Hi' }],
      },
      {
        input: 'How do I implement IP address rate limiting? Use search_docs.',
        expected: [{ type: 'tools_include', tool: 'search_docs' }],
      },
    ] satisfies Array<{ input: string; expected: Assertion[] }>
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

    return {
      text: textLastStep,
      tools: toolNamesAllStepsFlattened,
    }
  },
  scores: [AssertionScorer],
})
