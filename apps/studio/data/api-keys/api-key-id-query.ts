import { get, handleError } from '@/data/fetchers'

export interface APIKeyVariables {
  projectRef?: string
  id?: string
  reveal: boolean
}

export async function getAPIKeysById(
  { projectRef, id, reveal }: APIKeyVariables,
  signal?: AbortSignal
) {
  if (typeof projectRef === 'undefined') throw new Error('projectRef is required')
  if (typeof id === 'undefined') throw new Error('Content ID is required')

  const { data, error } = await get('/v1/projects/{ref}/api-keys/{id}', {
    params: {
      path: { ref: projectRef, id },
      query: { reveal },
    },
    signal,
  })

  if (error) {
    handleError(error)
  }

  return data
}

export type APIKeyIdData = Awaited<ReturnType<typeof getAPIKeysById>>
