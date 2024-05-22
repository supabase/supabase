import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { openApiKeys } from './keys'

export type OpenAPISpecVariables = {
  projectRef?: string
}

export type OpenAPISpecResponse = {
  data: any
  tables: any[]
  functions: any[]
}

export async function getOpenAPISpec({ projectRef }: OpenAPISpecVariables, signal?: AbortSignal) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get(`/platform/projects/{ref}/api/rest`, {
    params: { path: { ref: projectRef } },
    signal,
  })

  if (error) handleError(error)

  const tables = data.definitions
    ? Object.entries(data.definitions).map(([key, table]: any) => ({
        ...table,
        name: key,
        fields: Object.entries(table.properties || {}).map(([key, field]: any) => ({
          ...field,
          name: key,
        })),
      }))
    : []

  const functions = data.paths
    ? Object.entries(data.paths)
        .map(([path, value]: any) => ({
          ...value,
          path,
          name: path.replace('/rpc/', ''),
        }))
        .filter((x) => x.path.includes('/rpc'))
        .sort((a, b) => a.name.localeCompare(b.name))
    : []

  return { data: data, tables, functions }
}

export type OpenAPISpecData = Awaited<OpenAPISpecResponse>
export type OpenAPISpecError = ResponseError

export const useOpenAPISpecQuery = <TData = OpenAPISpecData>(
  { projectRef }: OpenAPISpecVariables,
  { enabled = true, ...options }: UseQueryOptions<OpenAPISpecData, OpenAPISpecError, TData> = {}
) =>
  useQuery<OpenAPISpecData, OpenAPISpecError, TData>(
    openApiKeys.apiSpec(projectRef),
    ({ signal }) => getOpenAPISpec({ projectRef }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )
