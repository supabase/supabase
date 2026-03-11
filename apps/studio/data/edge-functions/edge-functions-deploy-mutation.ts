import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { components } from 'api-types'
import {
  getFallbackEntrypointPath,
  getFallbackImportMapPath,
  getStaticPatterns,
} from 'components/interfaces/EdgeFunctions/EdgeFunctions.utils'
import { handleError, post } from 'data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { edgeFunctionsKeys } from './keys'

type EdgeFunctionsDeployBodyMetadata = components['schemas']['FunctionDeployBody']['metadata']
type EdgeFunctionsDeployVariables = {
  projectRef: string
  slug: string
  metadata: Partial<EdgeFunctionsDeployBodyMetadata>
  files: { name: string; content: string }[]
}

export async function deployEdgeFunction({
  projectRef,
  slug,
  metadata: _metadata,
  files,
}: EdgeFunctionsDeployVariables) {
  if (!projectRef) throw new Error('projectRef is required')

  // [Joshen] Consolidating this logic in the RQ since these values need to be set if they're not
  // provided from the callee, and their fallback values depends on the files provided
  const metadata = { ..._metadata }
  if (!_metadata.entrypoint_path) metadata.entrypoint_path = getFallbackEntrypointPath(files)
  if (!_metadata.import_map_path) metadata.import_map_path = getFallbackImportMapPath(files)
  if (!_metadata.static_patterns) metadata.static_patterns = getStaticPatterns(files)

  const { data, error } = await post(`/v1/projects/{ref}/functions/deploy`, {
    params: { path: { ref: projectRef }, query: { slug: slug } },
    body: {
      file: files as any,
      metadata: metadata as EdgeFunctionsDeployBodyMetadata,
    },
    bodySerializer(body) {
      const formData = new FormData()

      formData.append('metadata', JSON.stringify(body.metadata))

      body?.file?.forEach((f: any) => {
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
  UseCustomMutationOptions<EdgeFunctionsDeployData, ResponseError, EdgeFunctionsDeployVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<EdgeFunctionsDeployData, ResponseError, EdgeFunctionsDeployVariables>({
    mutationFn: (vars) => deployEdgeFunction(vars),
    async onSuccess(data, variables, context) {
      const { projectRef, slug } = variables
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: edgeFunctionsKeys.list(projectRef) }),
        queryClient.invalidateQueries({ queryKey: edgeFunctionsKeys.detail(projectRef, slug) }),
        queryClient.invalidateQueries({ queryKey: edgeFunctionsKeys.body(projectRef, slug) }),
      ])
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
  })
}
