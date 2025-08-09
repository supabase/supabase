import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, put } from 'data/fetchers'
import type { ResponseError } from 'types'
import { databaseKeys } from './keys'

export type MigrationUpsertVariables = {
  projectRef: string
  query: string
  name?: string
  idempotencyKey?: string
}

export async function upsertMigration({
  projectRef,
  query,
  name,
  idempotencyKey,
}: MigrationUpsertVariables) {
  const headers: Record<string, string> = {}
  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey
  }

  const body: { query: string; name?: string } = { query }
  if (name) {
    body.name = name
  }

  const { data, error } = await put('/v1/projects/{ref}/database/migrations', {
    params: { path: { ref: projectRef } },
    body,
    headers,
  })

  if (error) handleError(error)
  return data
}

type MigrationUpsertData = Awaited<ReturnType<typeof upsertMigration>>

export const useMigrationUpsertMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<MigrationUpsertData, ResponseError, MigrationUpsertVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<MigrationUpsertData, ResponseError, MigrationUpsertVariables>(
    (vars) => upsertMigration(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(databaseKeys.migrations(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to upsert migration: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
