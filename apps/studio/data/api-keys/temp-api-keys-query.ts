import { handleError, post } from 'data/fetchers'

interface getTemporaryAPIKeyVariables {
  projectRef?: string
  /** In seconds, max: 3600 (an hour) */
  expiry?: number
}

// [Joshen] This one specifically shouldn't need a useQuery hook since the expiry is meant to be short lived
// Used in storage explorer and realtime inspector.
export async function getTemporaryAPIKey(
  { projectRef, expiry = 300 }: getTemporaryAPIKeyVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await post('/platform/projects/{ref}/api-keys/temporary', {
    params: {
      path: { ref: projectRef },
      query: {
        authorization_exp: expiry.toString(),
        claims: JSON.stringify({ role: 'service_role' }),
      },
    },
    signal,
  })

  if (error) handleError(error)
  return data
}
