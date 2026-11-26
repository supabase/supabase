import { get, handleError } from '@/data/fetchers'
import type { GrantFor } from '@/lib/grants'

export type APIKeyGrant = GrantFor<'get', '/v1/projects/{ref}/api-keys/{id}'>
export type RevealedAPIKeyGrant = GrantFor<'get', '/v1/projects/{ref}/api-keys/{id}', 'reveal'>

export interface APIKeyVariables {
  projectRef?: string
  id?: string
  /** A `reveal` grant returns the full secret; a plain grant returns the masked key. */
  grant: APIKeyGrant | RevealedAPIKeyGrant
}

/** The wrapper sets the `reveal` query param from the grant's variant. */
export async function getAPIKeysById(
  { projectRef, id, grant }: APIKeyVariables,
  signal?: AbortSignal
) {
  if (typeof projectRef === 'undefined') throw new Error('projectRef is required')
  if (typeof id === 'undefined') throw new Error('Content ID is required')

  const { data, error } = await get('/v1/projects/{ref}/api-keys/{id}', {
    params: { path: { ref: projectRef, id } },
    signal,
    grant,
  })

  if (error) {
    // Called directly by useRevealedSecret, not through a query
    handleError(error, { reportImmediately: true })
  }

  return data
}

export type APIKeyIdData = Awaited<ReturnType<typeof getAPIKeysById>>
