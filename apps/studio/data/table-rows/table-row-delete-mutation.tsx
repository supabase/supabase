import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { Query } from 'components/grid/query/Query'
import type { SupaRow } from 'components/grid/types'
import { Markdown } from 'components/interfaces/Markdown'
import { DocsButton } from 'components/ui/DocsButton'
import { executeSql } from 'data/sql/execute-sql-query'
import { Entity } from 'data/table-editor/table-editor-types'
import { ImpersonationRole, wrapWithRoleImpersonation } from 'lib/role-impersonation'
import { isRoleImpersonationEnabled } from 'state/role-impersonation-state'
import type { ResponseError } from 'types'
import { tableRowKeys } from './keys'
import { getPrimaryKeys } from './utils'

export type TableRowDeleteVariables = {
  projectRef: string
  connectionString?: string
  table: Entity
  rows: SupaRow[]
  impersonatedRole?: ImpersonationRole
}

export function getTableRowDeleteSql({
  table,
  rows,
}: Pick<TableRowDeleteVariables, 'table' | 'rows'>) {
  const { primaryKeys, error } = getPrimaryKeys({ table })
  if (error) throw error

  let queryChains = new Query().from(table.name, table.schema ?? undefined).delete()
  primaryKeys?.forEach((key) => {
    const primaryKeyValues = rows.map((x) => x[key])
    queryChains = queryChains.filter(key, 'in', primaryKeyValues)
  })

  return queryChains.toSql()
}

export async function deleteTableRow({
  projectRef,
  connectionString,
  table,
  rows,
  impersonatedRole,
}: TableRowDeleteVariables) {
  const sql = wrapWithRoleImpersonation(getTableRowDeleteSql({ table, rows }), {
    projectRef,
    role: impersonatedRole,
  })

  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql,
    isRoleImpersonationEnabled: isRoleImpersonationEnabled(impersonatedRole),
  })

  return result
}

type TableRowDeleteData = Awaited<ReturnType<typeof deleteTableRow>>

export const useTableRowDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<TableRowDeleteData, ResponseError, TableRowDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<TableRowDeleteData, ResponseError, TableRowDeleteVariables>(
    (vars) => deleteTableRow(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef, table } = variables
        await queryClient.invalidateQueries(tableRowKeys.tableRowsAndCount(projectRef, table.id))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          const { table, rows } = variables
          const isPkError = data.message.includes('Please add a primary key column')
          const isFkError = data.message.includes('violates foreign key constraint')
          const isMultipleRows = rows.length > 1

          if (isFkError) {
            const sourceTable = table.name
            const referencingTable = data.message.split('on table ')[2].replaceAll('"', '')
            const fkName = data.message
              .split('foreign key constraint')[1]
              .split('on table')[0]
              .replaceAll('"', '')
            const initialMessage = isMultipleRows
              ? `Unable to delete rows as one of them is currently referenced by a foreign key constraint from the table \`${referencingTable}\`.`
              : `Unable to delete row as it is currently referenced by a foreign key constraint from the table \`${referencingTable}\`.`
            const resolutionCTA = `Set an on delete behavior on the foreign key relation \`${fkName}\` in the \`${referencingTable}\` table to automatically respond when row(s) are being deleted in the \`${sourceTable}\` table.`

            toast(initialMessage, {
              description: <Markdown content={resolutionCTA} className="[&>p]:m-0" />,
              action: (
                <div className="w-full flex gap-x-2 !mx-0 mt-3">
                  {/* [Joshen] Ideally we also are able to add this CTA but we can't guarantee this info without an on-demand fetch */}
                  {/* <Button asChild key="cta-1" type="default">
                    <Link href={`/project/${projectRef}/editor`}>
                      View "{referencingTable}" table
                    </Link>
                  </Button> */}
                  <DocsButton href="https://supabase.com/docs/guides/database/postgres/cascade-deletes" />
                </div>
              ),
            })
          } else if (isPkError) {
            toast('Unable to delete row(s) as table has no primary keys', {
              description: (
                <div>
                  <p className="text-sm text-foreground-light">
                    Add a primary key column to your table first to serve as a unique identifier for
                    each row before updating or deleting the row.
                  </p>
                  <div className="mt-3">
                    <DocsButton href="https://supabase.com/docs/guides/database/tables#primary-keys" />
                  </div>
                </div>
              ),
            })
          } else {
            toast.error(`Failed to delete table row: ${data.message}`)
          }
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
