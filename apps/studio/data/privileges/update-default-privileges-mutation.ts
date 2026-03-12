import { useMutation } from '@tanstack/react-query'
import { executeSql } from 'data/sql/execute-sql-query'
import { toast } from 'sonner'
import type { UseCustomMutationOptions } from 'types'

import type { ConnectionVars } from '../common.types'
import { buildDefaultPrivilegesSql } from './privileges.sql'

export type UpdateDefaultPrivilegesVariables = ConnectionVars & {
  granted: boolean
}

export async function updateDefaultPrivileges({
  projectRef,
  connectionString,
  granted,
}: UpdateDefaultPrivilegesVariables): Promise<void> {
  if (!projectRef) throw new Error('projectRef is required')

  const sql = buildDefaultPrivilegesSql(granted ? 'grant' : 'revoke')

  await executeSql({
    projectRef,
    connectionString,
    sql,
    queryKey: ['update-default-privileges'],
  })
}

type UpdateDefaultPrivilegesData = Awaited<ReturnType<typeof updateDefaultPrivileges>>

export const useUpdateDefaultPrivilegesMutation = ({
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<UpdateDefaultPrivilegesData, Error, UpdateDefaultPrivilegesVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<UpdateDefaultPrivilegesData, Error, UpdateDefaultPrivilegesVariables>({
    mutationFn: (vars: UpdateDefaultPrivilegesVariables) => updateDefaultPrivileges(vars),
    onError(error: Error) {
      toast.error(`Failed to update default privileges: ${error.message}`)
    },
    ...(onError ? { onError } : {}),
    ...options,
  })
}
