import { openai } from '@ai-sdk/openai'
import { Factuality } from 'autoevals'
import { Eval } from 'braintrust'
import { generateAssistantResponse } from 'lib/ai/generate-assistant-response'
import assert from 'node:assert'

assert(process.env.BRAINTRUST_PROJECT_ID, 'BRAINTRUST_PROJECT_ID is not set')
assert(process.env.OPENAI_API_KEY, 'OPENAI_API_KEY is not set')

Eval('Assistant', {
  projectId: process.env.BRAINTRUST_PROJECT_ID,
  data: () => {
    return [
      {
        input: 'Hello!',
        expected: 'Hello, world!',
      },
    ]
  },
  task: async (input) => {
    const result = await generateAssistantResponse({
      model: openai('gpt-5'),
      messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: input }] }],
      tools: {},
    })

    const text = await result.text
    return text
  },
  scores: [Factuality],
})
