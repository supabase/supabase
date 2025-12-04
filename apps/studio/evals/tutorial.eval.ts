import { Eval } from 'braintrust'
import { Levenshtein } from 'autoevals'
import assert from 'node:assert'

assert(process.env.BRAINTRUST_PROJECT_ID, 'BRAINTRUST_PROJECT_ID is not set')

Eval('Tutorial', {
  projectId: process.env.BRAINTRUST_PROJECT_ID,
  data: () => {
    return [
      {
        input: 'Foo',
        expected: 'Hi Foo',
      },
      {
        input: 'Bar',
        expected: 'Hello Bar',
      },
    ] // Replace with your eval dataset
  },
  task: async (input) => {
    return 'Hi ' + input // Replace with your LLM call
  },
  scores: [Levenshtein],
})
