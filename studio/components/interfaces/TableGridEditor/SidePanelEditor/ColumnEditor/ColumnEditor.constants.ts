import { Dictionary } from '@supabase/grid'
import { Suggestion } from './ColumnEditor.types'

const defaultTimeBasedExpressions: Suggestion[] = [
  {
    name: 'now()',
    description: 'Returns the current date and time',
  },
  {
    name: "(now() at time zone 'utc')",
    description: 'Returns the current date and time based on the specified timezone',
  },
]

// [Joshen] For now this is a curate mapping, ideally we could look into
// using meta-store's extensions to generate this partially on top of vanilla expressions
export const typeExpressionSuggestions: Dictionary<Suggestion[]> = {
  uuid: [
    {
      name: 'uuid_generate_v4()',
      description: 'Generates a version 4 UUID',
    },
  ],
  time: [...defaultTimeBasedExpressions],
  timetz: [...defaultTimeBasedExpressions],
  timestamp: [...defaultTimeBasedExpressions],
  timestamptz: [...defaultTimeBasedExpressions],
}
