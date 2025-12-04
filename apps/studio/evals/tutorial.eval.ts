import { Eval } from 'braintrust'
import { Levenshtein } from 'autoevals'

Eval(
  'Say Hi Bot', // Replace with your project name
  {
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
  }
)
