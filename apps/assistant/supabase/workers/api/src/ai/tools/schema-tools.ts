import { tool } from 'ai'
import { z } from 'zod'

import { pgMeta } from '../pg-meta.ts'
import type { ManagementApi } from './project-tools'
import { asQueryRows, validSchemaNames } from './schema-tools.utils'

export const getSchemaTools = ({ managementApi }: { managementApi: ManagementApi }) => ({
  list_policies: tool({
    description: 'Get existing RLS policies for a given schema',
    inputSchema: z.object({
      schemas: z.array(z.string()).describe('The schema names to get the policies for'),
    }),
    execute: async ({ schemas }) => {
      const valid = validSchemaNames(schemas)
      if (valid.length === 0) {
        return 'No valid schema names provided.'
      }

      const { sql } = pgMeta.policies.list({ includedSchemas: valid })
      const output = await managementApi.runQuery(sql, { readOnly: true })
      const data = asQueryRows(output)

      return data
        .map((policy) => {
          const roles = Array.isArray(policy.roles)
            ? policy.roles.join(', ')
            : typeof policy.roles === 'string'
              ? policy.roles
              : ''
          const check = policy.check ?? policy.with_check
          return `
              Policy Name: "${policy.name ?? policy.policyname}"
              Action: ${policy.action ?? policy.permissive}
              Roles: ${roles}
              Command: ${policy.command ?? policy.cmd}
              Definition: ${policy.definition ?? policy.qual ?? ''}
              ${check ? `Check: ${check}` : ''}
            `
        })
        .join('\n')
    },
  }),
})
