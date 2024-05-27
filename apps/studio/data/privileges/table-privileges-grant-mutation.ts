import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import type { components } from 'data/api'
import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import { privilegeKeys } from './keys'

export type TablePrivilegesGrant = components['schemas']['GrantTablePrivilegesBody']

export type TablePrivilegesGrantVariables = {
  projectRef: string
  connectionString?: string
  grants: TablePrivilegesGrant[]
}

export async function grantTablePrivileges({
  projectRef,
  connectionString,
  grants,
}: TablePrivilegesGrantVariables) {
  const headers = new Headers()
  if (connectionString) headers.set('x-connection-encrypted', connectionString)

  const { data, error } = await post('/platform/pg-meta/{ref}/table-privileges', {
    params: {
      path: { ref: projectRef },
      // this is needed to satisfy the typescript, but it doesn't pass the actual header
      header: { 'x-connection-encrypted': connectionString! },
    },
    body: grants,
    headers,
  })

  if (error) handleError(error)
  return data
}

type TablePrivilegesGrantData = Awaited<ReturnType<typeof grantTablePrivileges>>

export const useTablePrivilegesGrantMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<TablePrivilegesGrantData, ResponseError, TablePrivilegesGrantVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<TablePrivilegesGrantData, ResponseError, TablePrivilegesGrantVariables>(
    (vars) => grantTablePrivileges(vars),
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
