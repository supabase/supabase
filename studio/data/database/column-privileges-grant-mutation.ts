import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { post } from 'data/fetchers'
import { ResponseError } from 'types'
import { databaseKeys } from './keys'

export type Grant = {
  column_id: string
  grantee: string
  privilege_type: 'ALL' | 'SELECT' | 'INSERT' | 'UPDATE' | 'REFERENCES'
}

export type ColumnPrivilegesGrantVariables = {
  projectRef: string
  connectionString?: string
  grants: Grant[]
}

export async function grantColumnPrivileges({
  projectRef,
  connectionString,
  grants,
}: ColumnPrivilegesGrantVariables) {
  const headers = new Headers()
  if (connectionString) {
    headers.set('x-connection-encrypted', connectionString)
  }

  const { data, error } = await post('/platform/pg-meta/{ref}/column-privileges', {
    params: {
      path: {
        ref: projectRef,
      },
      // this is needed to satisfy the typescript, but it doesn't pass the actual header
      header: {
        'x-connection-encrypted': connectionString!,
      },
    },
    body: [grants] as any,
  })
  if (error) {
    throw error
  }

  return data
}

type ColumnPrivilegesGrantData = Awaited<ReturnType<typeof grantColumnPrivileges>>

export const useColumnPrivilegesGrantMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<ColumnPrivilegesGrantData, ResponseError, ColumnPrivilegesGrantVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<ColumnPrivilegesGrantData, ResponseError, ColumnPrivilegesGrantVariables>(
    (vars) => grantColumnPrivileges(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables

        await Promise.all([queryClient.invalidateQueries(databaseKeys.privilegesList(projectRef))])

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
