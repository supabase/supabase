import type { PostgresTable } from '@supabase/postgres-meta'
import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { components } from 'data/api'
import { handleError, patch } from 'data/fetchers'
import { lintKeys } from 'data/lint/keys'
import { tableEditorKeys } from 'data/table-editor/keys'
import type { ResponseError } from 'types'
import { tableKeys } from './keys'

export type UpdateTableBody = components['schemas']['UpdateTableBody']

export type TableUpdateVariables = {
  projectRef: string
  connectionString?: string
  id: number
  schema: string
  payload: UpdateTableBody
}

export async function updateTable({
  projectRef,
  connectionString,
  id,
  payload,
}: TableUpdateVariables) {
  let headers = new Headers()
  if (connectionString) headers.set('x-connection-encrypted', connectionString)

  const { data, error } = await patch('/platform/pg-meta/{ref}/tables', {
    params: {
      header: { 'x-connection-encrypted': connectionString! },
      path: { ref: projectRef },
      query: { id },
    },
    body: payload,
    headers,
  })

  if (error) handleError(error)

  // [Alaister] we have to manually cast the data to PostgresTable
  // because the API types are slightly wrong
  return data as PostgresTable
}

type TableUpdateData = Awaited<ReturnType<typeof updateTable>>

export const useTableUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<TableUpdateData, ResponseError, TableUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<TableUpdateData, ResponseError, TableUpdateVariables>(
    (vars) => updateTable(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef, schema, id } = variables
        await Promise.all([
          queryClient.invalidateQueries(tableEditorKeys.tableEditor(projectRef, id)),
          queryClient.invalidateQueries(tableKeys.list(projectRef, schema)),
          queryClient.invalidateQueries(lintKeys.lint(projectRef)),
        ])
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to update database table: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
