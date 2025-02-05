import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, constructHeaders } from 'data/fetchers'
import { API_URL } from 'lib/constants'
import type { ResponseError } from 'types'
import { edgeFunctionsKeys } from './keys'

export type EdgeFunctionsDeployVariables = {
  projectRef: string
  metadata: {
    entrypoint_path?: string
    import_map_path?: string
    name?: string
    static_patterns?: string[]
    verify_jwt?: boolean
  }
  files: { name: string; content: string }[]
}

export async function deployEdgeFunction({
  projectRef,
  metadata,
  files,
}: EdgeFunctionsDeployVariables) {
  if (!projectRef) throw new Error('projectRef is required')

  const formData = new FormData()
  formData.append('metadata', JSON.stringify(metadata))

  files.forEach((file) => {
    const blob = new Blob([file.content], { type: 'text/plain' })
    formData.append('file', blob, file.name)
  })

  const response = await fetch(
    `${API_URL?.replace('/platform', '')}/v1/projects/${projectRef}/functions/deploy?slug=${metadata.name}`,
    {
      method: 'POST',
      body: formData,
      headers: await constructHeaders(),
      credentials: 'include',
      referrerPolicy: 'no-referrer-when-downgrade',
    }
  )

  const result = await response.json()
  if (response.ok) {
    return result
  }

  result.code = response.status
  result.requestId = response.headers.get('X-Request-Id')
  handleError(result)
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
        await Promise.all([queryClient.invalidateQueries(edgeFunctionsKeys.list(projectRef))])
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
