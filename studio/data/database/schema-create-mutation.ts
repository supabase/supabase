import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { post } from 'data/fetchers'
import { ResponseError } from 'types'
import { databaseKeys } from './keys'

export type SchemaCreateVariables = {
  name: string
  projectRef?: string
  connectionString?: string
}

export async function createSchema({ name, projectRef, connectionString }: SchemaCreateVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!connectionString) throw new Error('Connection string is required')

  let headers = new Headers()
  headers.set('x-connection-encrypted', connectionString)

  const { data, error } = await post('/platform/pg-meta/{ref}/schemas', {
    params: {
      header: { 'x-connection-encrypted': connectionString },
      path: { ref: projectRef },
    },
    body: { name, owner: 'postgres' },
    headers: Object.fromEntries(headers),
  })

  if (error) throw error
  return data
}

type SchemaCreateData = Awaited<ReturnType<typeof createSchema>>

export const useSchemaCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<SchemaCreateData, ResponseError, SchemaCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<SchemaCreateData, ResponseError, SchemaCreateVariables>(
    (vars) => createSchema(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(databaseKeys.schemaList(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to create schema: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
