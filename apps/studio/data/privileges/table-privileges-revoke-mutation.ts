import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { components } from 'data/api'
import { del, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { privilegeKeys } from './keys'

export type TablePrivilegesRevoke = components['schemas']['RevokeTablePrivilegesBody']

export type TablePrivilegesRevokeVariables = {
  projectRef: string
  connectionString?: string
  revokes: TablePrivilegesRevoke[]
}

export async function revokeTablePrivileges({
  projectRef,
  connectionString,
  revokes,
}: TablePrivilegesRevokeVariables) {
  const headers = new Headers()
  if (connectionString) headers.set('x-connection-encrypted', connectionString)

  const { data, error } = await del('/platform/pg-meta/{ref}/table-privileges', {
    params: {
      path: { ref: projectRef },
      // this is needed to satisfy the typescript, but it doesn't pass the actual header
      header: { 'x-connection-encrypted': connectionString! },
    },
    body: revokes,
    headers,
  })

  if (error) handleError(error)
  return data
}

type TablePrivilegesRevokeData = Awaited<ReturnType<typeof revokeTablePrivileges>>

export const useTablePrivilegesRevokeMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<TablePrivilegesRevokeData, ResponseError, TablePrivilegesRevokeVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<TablePrivilegesRevokeData, ResponseError, TablePrivilegesRevokeVariables>(
    (vars) => revokeTablePrivileges(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables

        await Promise.all([
          queryClient.invalidateQueries(privilegeKeys.tablePrivilegesList(projectRef)),
          queryClient.invalidateQueries(privilegeKeys.columnPrivilegesList(projectRef)),
        ])

        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to mutate: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
