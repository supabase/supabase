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
      name: 'uuid_generate_v4()',
      value: 'uuid_generate_v4()',
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
