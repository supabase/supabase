import { get, handleError, unguarded } from '@/data/fetchers'

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
      query: { reveal: reveal ? 'true' : 'false' },
    },
    signal,
    grant: unguarded.migrating,
  })

  if (error) {
    // Called directly by useRevealedSecret, not through a query
    handleError(error, { reportImmediately: true })
  }

  return data
}

export type APIKeyIdData = Awaited<ReturnType<typeof getAPIKeysById>>
