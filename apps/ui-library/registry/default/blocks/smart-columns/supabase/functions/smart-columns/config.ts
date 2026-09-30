import type { SmartTable } from './schema.ts'

// Each table also needs the smart_columns trigger. After deploying a change, run
// select smart_columns.backfill('<table>'); Jev is only asked again about outputs
// whose inputs or instructions changed.
export const tables: SmartTable[] = [
  {
    table: 'public.feedback',
    // Only these columns are sent to Jev.
    inputs: ['title', 'body'],
    // type, instructions, and criteria are Jev's question fields: https://docs.typesafe.ai/primitives
    columns: {
      category: {
        type: 'choice',
        instructions: 'What kind of feedback is this?',
        criteria: {
          bug: 'Something does not work as expected',
          feature: 'A request for new or improved functionality',
          praise: 'Positive feedback without a request',
          other: 'None of the other categories fits',
        },
      },
      needs_response: {
        type: 'noul',
        instructions: 'Is the author asking for help or a reply?',
      },
      severity: {
        type: 'score',
        instructions: 'How much does the reported problem affect use of the product?',
        criteria: [
          'No problem reported, or cosmetic only',
          'A feature is impaired, but a workaround exists',
          'An essential task is blocked with no workaround',
        ],
      },
    },
  },
]

// Pin the model so a new release does not silently change your answers.
export const model = 'jev-1.13.0'
