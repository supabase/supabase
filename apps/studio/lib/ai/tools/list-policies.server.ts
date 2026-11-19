import pgMeta from '@supabase/pg-meta'
import { stripIndent } from 'common-tags'

import { contract } from './list-policies'
import { toolFromContract } from './tool-from-contract'
import { runPgMetaQuery } from './tool-sql.server'
import type { ToolFactory } from './types'

export const createTool: ToolFactory<typeof contract> = (ctx) => {
  return toolFromContract(contract, ctx, async ({ schemas }, { abortSignal }) => {
    const data = await runPgMetaQuery(
      ctx,
      pgMeta.policies.list({ includedSchemas: schemas }),
      abortSignal
    )

    return data
      .map(
        (policy) => stripIndent`
              Policy Name: "${policy.name}"
              Table: "${policy.table}"
              Action: ${policy.action}
              Roles: ${policy.roles.join(', ')}
              Command: ${policy.command}
              Definition: ${policy.definition}
              ${policy.check ? `Check: ${policy.check}` : ''}
            `
      )
      .join('\n')
  })
}
