import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { projectKeys } from './keys'

export type GenerateTypesVariables = { slug?: string, ref?: string; included_schemas?: string }

export async function generateTypes(
  { slug, ref, included_schemas }: GenerateTypesVariables,
  signal?: AbortSignal
) {
  if (!slug) throw new Error('Organization slug is required')
  if (!ref) throw new Error('Project ref is required')

  const { data, error } = await get(`/platform/organizations/{slug}/projects/{ref}/types/typescript`, {
    params: { path: { slug, ref }, query: { included_schemas } },
    signal,
  })

  if (error) handleError(error)
  return data
}

export type GenerateTypesData = Awaited<ReturnType<typeof generateTypes>>
export type GenerateTypesError = ResponseError

export const useGenerateTypesQuery = <TData = GenerateTypesData>(
  { slug, ref, included_schemas }: GenerateTypesVariables,
  { enabled = true, ...options }: UseQueryOptions<GenerateTypesData, GenerateTypesError, TData> = {}
) =>
  useQuery<GenerateTypesData, GenerateTypesError, TData>(
    projectKeys.types(slug, ref),
    ({ signal }) => generateTypes({ slug, ref, included_schemas }, signal),
    { enabled: enabled && typeof ref !== 'undefined' && typeof slug !== 'undefined', ...options }
  )
