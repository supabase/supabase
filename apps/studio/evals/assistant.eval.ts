import { openai } from '@ai-sdk/openai'
import { Eval } from 'braintrust'
import { AssertionScorer } from 'lib/ai/evals/scorer'
import { generateAssistantResponse } from 'lib/ai/generate-assistant-response'
import { getMockTools } from 'lib/ai/tools'
import assert from 'node:assert'

assert(process.env.BRAINTRUST_PROJECT_ID, 'BRAINTRUST_PROJECT_ID is not set')
assert(process.env.OPENAI_API_KEY, 'OPENAI_API_KEY is not set')

Eval('Assistant', {
  projectId: process.env.BRAINTRUST_PROJECT_ID,
  data: () => {
    return [
      {
        input: 'Hello!',
        expected: [{ type: 'text_includes' as const, substring: 'Hi' }],
      },
      {
        input: 'How do I implement IP address rate limiting? Use search_docs.',
        expected: [{ type: 'tools_include' as const, tool: 'search_docs' }],
      },
    ]
  },
  task: async (input) => {
    const result = await generateAssistantResponse({
      model: openai('gpt-5-mini'),
      messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: input }] }],
      tools: await getMockTools(),
    })

    const text = await result.text
    const toolCalls = await result.toolCalls

    return {
      text: text,
      tools: toolCalls.map((call) => call.toolName),
    }
  },
  scores: [AssertionScorer],
})
