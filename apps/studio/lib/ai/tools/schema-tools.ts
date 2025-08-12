import { tool } from 'ai'
import { getDatabasePolicies } from 'data/database-policies/database-policies-query'
import { z } from 'zod'

export const getSchemaTools = ({
  projectRef,
  connectionString,
  authorization,
}: {
  projectRef: string
  connectionString: string
  authorization?: string
}) => ({
  list_policies: tool({
    description: 'Get existing RLS policies for a given schema',
    inputSchema: z.object({
      schemas: z.array(z.string()).describe('The schema names to get the policies for'),
    }),
    execute: async ({ schemas }) => {
      const data = await getDatabasePolicies(
        {
          projectRef,
          connectionString,
          schema: schemas?.join(','),
        },
        undefined,
        {
          'Content-Type': 'application/json',
          ...(authorization && { Authorization: authorization }),
        }
      )

      const formattedPolicies = data
        .map(
          (policy) => `
              Policy Name: "${policy.name}"
              Action: ${policy.action}
              Roles: ${policy.roles.join(', ')}
              Command: ${policy.command}
              Definition: ${policy.definition}
              ${policy.check ? `Check: ${policy.check}` : ''}
            `
        )
        .join('\n')

      return formattedPolicies
    },
  }),
})
