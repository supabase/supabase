import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import { docsKeys } from './keys'

export type ProjectJsonSchemaVariables = {
  projectRef?: string
}

export type ProjectJsonSchemaResponse = any

export async function getProjectJsonSchema(
  { projectRef }: ProjectJsonSchemaVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get('/platform/projects/{ref}/api/rest', {
    params: { path: { ref: projectRef } },
    signal,
  })

  if (error) handleError(error)
  return data
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
