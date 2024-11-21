import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import { ResponseError } from 'types'
import { contentKeys } from './keys'

export async function getContentById(
  { projectRef, id, ids }: { projectRef?: string; id?: string; ids?: string[] },
  signal?: AbortSignal
) {
  if (typeof projectRef === 'undefined') throw new Error('projectRef is required')
  if (typeof id === 'undefined' && !ids?.length) throw new Error('Content ID or IDs are required')

  console.log('getting snippets!!', ids)

  if (ids?.length) {
    // Fetch multiple items in parallel
    const promises = ids.map((id) =>
      get('/platform/projects/{ref}/content/item/{id}', {
        params: { path: { ref: projectRef, id } },
        signal,
      })
    )

    const results = await Promise.all(promises)
    const errors = results.filter((r) => r.error)
    console.log('getting snippets!!', errors)

    if (errors.length) throw handleError(errors[0].error)

    return results.map((r) => r.data)
  }

  const { data, error } = await get('/platform/projects/{ref}/content/item/{id}', {
    params: { path: { ref: projectRef, id } },
    signal,
  })

  if (error) throw handleError(error)
  return data
}

export type ContentIdData = Awaited<ReturnType<typeof getContentById>>
export type ContentIdError = ResponseError

export const useContentIdQuery = <TData = ContentIdData>(
  { projectRef, id, ids }: { projectRef?: string; id?: string; ids?: string[] },
  { enabled = true, ...options }: UseQueryOptions<ContentIdData, ContentIdError, TData> = {}
) => {
  console.log('getting snippets!', ids)
  return useQuery<ContentIdData, ContentIdError, TData>(
    contentKeys.resource(projectRef, id ?? ids?.join(',')),
    ({ signal }) => getContentById({ projectRef, id, ids }, signal),
    {
      enabled:
        enabled &&
        typeof projectRef !== 'undefined' &&
        (typeof id !== 'undefined' || ids?.length > 0),
      ...options,
    }
  )
}
