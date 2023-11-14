import { Dictionary } from 'components/grid'
import { Suggestion } from './ColumnEditor.types'

const defaultTimeBasedExpressions: Suggestion[] = [
  {
    name: 'now()',
    value: 'now()',
    description: 'Returns the current date and time',
  },
  {
    name: "(now() at time zone 'utc')",
    value: "(now() at time zone 'utc')",
    description: 'Returns the current date and time based on the specified timezone',
  },
]

const defaultTextBasedValues: Suggestion[] = [
  {
    name: 'Set as NULL',
    value: null,
    description: 'Set the default value as NULL value',
  },
  {
    name: 'Set as empty string',
    value: '',
    description: 'Set the default value as an empty string',
  },
]

// [Joshen] For now this is a curate mapping, ideally we could look into
// using meta-store's extensions to generate this partially on top of vanilla expressions
export const typeExpressionSuggestions: Dictionary<Suggestion[]> = {
  uuid: [
    {
      name: 'auth.uid()',
      value: 'auth.uid()',
      description: "Returns the user's ID when rows are added or updated through the API",
    },
    {
      name: 'gen_random_uuid()',
      value: 'gen_random_uuid()',
      description: 'Generates a version 4 UUID',
    },
  ],
  time: [...defaultTimeBasedExpressions],
  timetz: [...defaultTimeBasedExpressions],
  timestamp: [...defaultTimeBasedExpressions],
  timestamptz: [...defaultTimeBasedExpressions],
  text: [...defaultTextBasedValues],
  varchar: [...defaultTextBasedValues],
}
