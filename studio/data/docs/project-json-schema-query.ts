import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { useCallback } from 'react'
import { docsKeys } from './keys'

export type ProjectJsonSchemaVariables = {
  projectRef?: string
  swaggerUrl?: string
  apiKey?: string
}

export type ProjectJsonSchemaResponse = any

export async function getProjectJsonSchema(
  { projectRef, swaggerUrl, apiKey }: ProjectJsonSchemaVariables,
  signal?: AbortSignal
) {
  if (!projectRef) {
    throw new Error('projectRef is required')
  }
  if (!swaggerUrl) {
    throw new Error('id is required')
  }

  let headers: {
    [key: string]: string | undefined
  } = { apikey: apiKey }
  if ((apiKey?.length ?? 0) > 40) headers['Authorization'] = `Bearer ${apiKey}`

  const response = await get(swaggerUrl, {
    signal,
    headers,
    credentials: 'omit',
  })
  if (response.error) {
    throw response.error
  }

  return response as ProjectJsonSchemaResponse
}

export type ProjectJsonSchemaData = Awaited<ReturnType<typeof getProjectJsonSchema>>
export type ProjectJsonSchemaError = unknown

export const useProjectJsonSchemaQuery = <TData = ProjectJsonSchemaData>(
  { projectRef, swaggerUrl, apiKey }: ProjectJsonSchemaVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<ProjectJsonSchemaData, ProjectJsonSchemaError, TData> = {}
) =>
  useQuery<ProjectJsonSchemaData, ProjectJsonSchemaError, TData>(
    docsKeys.jsonSchema(projectRef, swaggerUrl, apiKey),
    ({ signal }) => getProjectJsonSchema({ projectRef, swaggerUrl, apiKey }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined' && typeof swaggerUrl !== 'undefined',
      ...options,
    }
  )

export const useProjectJsonSchemaPrefetch = ({
  projectRef,
  swaggerUrl,
  apiKey,
}: ProjectJsonSchemaVariables) => {
  const client = useQueryClient()

  return useCallback(() => {
    if (projectRef && swaggerUrl) {
      client.prefetchQuery(docsKeys.jsonSchema(projectRef, swaggerUrl, apiKey), ({ signal }) =>
        getProjectJsonSchema({ projectRef, swaggerUrl, apiKey }, signal)
      )
    }
  }, [projectRef, swaggerUrl])
}
