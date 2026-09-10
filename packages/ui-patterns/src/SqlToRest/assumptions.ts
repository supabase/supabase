import { EmbeddedTarget, flattenTargets } from '@supabase/sql-to-rest'

import type { ResultBundle } from './util'

export type Assumption = {
  id: string
  condition: (result: ResultBundle) => boolean
  assumptions: (result: ResultBundle) => string[]
}

export const assumptions: Assumption[] = [
  {
    id: 'join-assumptions',
    condition: ({ statement }) =>
      // Show this if there is at least one resource embedding
      statement.targets.some((target) => target.type === 'embedded-target'),
    assumptions: ({ statement }) => {
      const flattenedTargets = flattenTargets(statement.targets)

      const embeddedTargets = flattenedTargets.filter(
        (target): target is EmbeddedTarget => target.type === 'embedded-target'
      )

      return embeddedTargets.map(
        (t) =>
          `There is a [foreign key](https://postgrest.org/en/latest/references/api/resource_embedding.html#foreign-key-joins) relationship between \`${t.joinedColumns.left.relation}.${t.joinedColumns.left.column}\` and \`${t.joinedColumns.right.relation}.${t.joinedColumns.right.column}\``
      )
    },
  },
]
