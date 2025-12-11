import { openai } from '@ai-sdk/openai'
import { Eval } from 'braintrust'
import { Assertion, createAssertionScorer } from 'lib/ai/evals/scorer'
import { generateAssistantResponse } from 'lib/ai/generate-assistant-response'
import { getMockTools } from 'lib/ai/tools/mock-tools'
import assert from 'node:assert'

assert(process.env.BRAINTRUST_PROJECT_ID, 'BRAINTRUST_PROJECT_ID is not set')
assert(process.env.OPENAI_API_KEY, 'OPENAI_API_KEY is not set')

type MockToolName = keyof Awaited<ReturnType<typeof getMockTools>>
type EvalAssertion = Assertion<MockToolName>

const AssertionScorer = createAssertionScorer<MockToolName>()

Eval('Assistant', {
  projectId: process.env.BRAINTRUST_PROJECT_ID,
  data: () => {
    return [
      {
        input: 'Hello!',
        expected: [{ type: 'text_includes', substring: 'Hi' }],
      },
      {
        input: 'How do I implement IP address rate limiting?',
        expected: [{ type: 'tools_include', tool: 'search_docs' }],
      },
      {
        input: 'Check if my project is having issues right now and tell me what to fix first.',
        expected: [
          { type: 'tools_include', tool: 'get_advisors' },
          { type: 'tools_include', tool: 'get_logs' },
          { type: 'llm_criteria_met', criteria: 'Response reflects there are RLS issues to fix.' },
        ],
      },
    ] satisfies Array<{ input: string; expected: EvalAssertion[] }>
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
