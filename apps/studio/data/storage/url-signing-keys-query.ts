import { queryOptions } from '@tanstack/react-query'

import { storageKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
import { IS_PLATFORM } from '@/lib/constants'
import type { ResponseError } from '@/types'

export type UrlSigningKeysVariables = { projectRef?: string }
export type UrlSigningKeysError = ResponseError

async function getUrlSigningKeys({ projectRef }: UrlSigningKeysVariables, signal?: AbortSignal) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get('/platform/storage/{ref}/jwks', {
    params: { path: { ref: projectRef } },
    signal,
  })

  if (error) handleError(error)
  return data.data
}

export type UrlSigningKeysData = Awaited<ReturnType<typeof getUrlSigningKeys>>
export type UrlSigningKey = UrlSigningKeysData[number]

export const urlSigningKeysQueryOptions = ({ projectRef }: UrlSigningKeysVariables) =>
  queryOptions({
    queryKey: storageKeys.urlSigningKeys(projectRef),
    queryFn: ({ signal }) => getUrlSigningKeys({ projectRef }, signal),
    enabled: IS_PLATFORM && typeof projectRef !== 'undefined',
  })
