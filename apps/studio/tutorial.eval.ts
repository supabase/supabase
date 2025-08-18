import { Eval } from 'braintrust'
import { LevenshteinScorer } from 'autoevals'

Eval('Say Hi Bot', {
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
  scores: [LevenshteinScorer],
})
