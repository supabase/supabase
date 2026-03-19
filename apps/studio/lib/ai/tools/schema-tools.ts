import { tool } from 'ai'
import { getDatabasePolicies } from 'data/database-policies/database-policies-query'
import { executeSql } from 'data/sql/execute-sql-query'
import { z } from 'zod'
import { IS_PLATFORM } from 'common'
import { executeQuery } from 'lib/api/self-hosted/query'

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
  list_all_tables_and_columns: tool({
    description:
      'Get a compact summary of all tables and their columns in the specified schemas. Useful for getting an overview of a large database without hitting token limits.',
    inputSchema: z.object({
      schemas: z
        .array(z.string())
        .describe('The schema names to get the overview for (e.g. ["public"])'),
    }),
    execute: async ({ schemas }) => {
      const sql = `
        SELECT
          table_name,
          array_agg(column_name::text ORDER BY ordinal_position) as columns
        FROM information_schema.columns
        WHERE table_schema = ANY($1)
        GROUP BY table_name
        ORDER BY table_name;
      `

      const { result } = await executeSql(
        {
          projectRef,
          connectionString,
          sql: {
            name: 'list_all_tables_and_columns',
            text: sql,
            values: [schemas],
          },
        },
        undefined,
        {
          'Content-Type': 'application/json',
          ...(authorization && { Authorization: authorization }),
        },
        IS_PLATFORM ? undefined : executeQuery
      )

      if (!result || result.length === 0) {
        return 'No tables found in the specified schemas.'
      }

      return result
        .map((row: any) => `${row.table_name}(${row.columns.join(', ')})`)
        .join('\n')
    },
  }),
})
