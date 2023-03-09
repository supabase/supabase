import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { useCallback } from 'react'
import { docsKeys } from './keys'

export type ProjectJsonSchemaVariables = {
  projectRef?: string
}

export type ProjectJsonSchemaResponse = any

export async function getProjectJsonSchema(
  { projectRef }: ProjectJsonSchemaVariables,
  signal?: AbortSignal
) {
  if (!projectRef) {
    throw new Error('projectRef is required')
  }

  const url = `${API_URL}/projects/${projectRef}/api/rest`
  const response = await get(url, { signal })
  if (response.error) throw response.error
  return response as ProjectJsonSchemaResponse
}

export type ProjectJsonSchemaData = Awaited<ReturnType<typeof getProjectJsonSchema>>
export type ProjectJsonSchemaError = unknown

export const useProjectJsonSchemaQuery = <TData = ProjectJsonSchemaData>(
  { projectRef }: ProjectJsonSchemaVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<ProjectJsonSchemaData, ProjectJsonSchemaError, TData> = {}
) =>
  useQuery<ProjectJsonSchemaData, ProjectJsonSchemaError, TData>(
    docsKeys.jsonSchema(projectRef),
    ({ signal }) => getProjectJsonSchema({ projectRef }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )

export const useProjectJsonSchemaPrefetch = ({ projectRef }: ProjectJsonSchemaVariables) => {
  const client = useQueryClient()

  return useCallback(() => {
    if (projectRef) {
      client.prefetchQuery(docsKeys.jsonSchema(projectRef), ({ signal }) =>
        getProjectJsonSchema({ projectRef }, signal)
      )
    }
  }, [projectRef])
}
