import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import type { components } from 'data/api'
import { del, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { privilegeKeys } from './keys'

export type ColumnPrivilegesRevoke = components['schemas']['RevokeColumnPrivilegesBody']

export type ColumnPrivilegesRevokeVariables = {
  projectRef: string
  connectionString?: string
  revokes: ColumnPrivilegesRevoke[]
}

export async function revokeColumnPrivileges({
  projectRef,
  connectionString,
  revokes,
}: ColumnPrivilegesRevokeVariables) {
  const headers = new Headers()
  if (connectionString) headers.set('x-connection-encrypted', connectionString)

  const { data, error } = await del('/platform/pg-meta/{ref}/column-privileges', {
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

type ColumnPrivilegesRevokeData = Awaited<ReturnType<typeof revokeColumnPrivileges>>

export const useColumnPrivilegesRevokeMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<ColumnPrivilegesRevokeData, ResponseError, ColumnPrivilegesRevokeVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<ColumnPrivilegesRevokeData, ResponseError, ColumnPrivilegesRevokeVariables>(
    (vars) => revokeColumnPrivileges(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables

        await Promise.all([
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
