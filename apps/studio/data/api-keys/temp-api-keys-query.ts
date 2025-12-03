import { handleError, post } from 'data/fetchers'

interface getTemporaryAPIKeyVariables {
  projectRef?: string
  /** In seconds, max: 3600 (an hour) */
  expiry?: number
}

// Used in storage explorer, realtime inspector and OAuth Server apps.
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
