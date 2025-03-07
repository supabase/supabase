import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { components } from 'api-types'
import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import { edgeFunctionsKeys } from './keys'

export type EdgeFunctionsDeployVariables = {
  projectRef: string
  metadata: components['schemas']['FunctionDeployMetadata']
  files: { name: string; content: string }[]
}

export async function deployEdgeFunction({
  projectRef,
  metadata,
  files,
}: EdgeFunctionsDeployVariables) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await post(`/v1/projects/{ref}/functions/deploy`, {
    params: { path: { ref: projectRef }, query: { slug: metadata.name } },
    body: {
      file: files as any,
      metadata,
    },
    bodySerializer(body) {
      const formData = new FormData()

      formData.append('metadata', JSON.stringify(body.metadata))

      body.file.forEach((f: any) => {
        const file = f as { name: string; content: string }
        const blob = new Blob([file.content], { type: 'text/plain' })
        formData.append('file', blob, file.name)
      })

      return formData
    },
  })

  if (error) handleError(error)
  return data
}

type EdgeFunctionsDeployData = Awaited<ReturnType<typeof deployEdgeFunction>>

export const useEdgeFunctionDeployMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<EdgeFunctionsDeployData, ResponseError, EdgeFunctionsDeployVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<EdgeFunctionsDeployData, ResponseError, EdgeFunctionsDeployVariables>(
    (vars) => deployEdgeFunction(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(edgeFunctionsKeys.list(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to deploy edge function: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
