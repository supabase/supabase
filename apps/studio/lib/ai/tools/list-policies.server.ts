import { stripIndent } from 'common-tags'

import { getAuthHeaders } from './auth-headers'
import { contract } from './list-policies'
import { toolFromContract } from './tool-from-contract'
import type { ToolFactory } from './types'
import { getDatabasePolicies } from '@/data/database-policies/database-policies-query'

export const createTool: ToolFactory<typeof contract> = (ctx) => {
  const { projectRef, connectionString } = ctx
  const authHeaders = getAuthHeaders(ctx.authorization)

  return toolFromContract(contract, ctx, async ({ schemas }, { abortSignal }) => {
    const data = await getDatabasePolicies(
      { projectRef, connectionString, schemas },
      abortSignal,
      authHeaders
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
