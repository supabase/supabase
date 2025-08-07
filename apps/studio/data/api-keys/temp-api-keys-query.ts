import { handleError, post } from 'data/fetchers'

interface getTemporaryAPIKeyVariables {
  projectRef?: string
}

export async function getTemporaryAPIKey(
  { projectRef }: getTemporaryAPIKeyVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await post('/platform/projects/{ref}/api-keys/temporary', {
    params: {
      path: { ref: projectRef },
      query: { authorization_exp: '300', claims: JSON.stringify({ role: 'service_role' }) },
    },
    signal,
  })

  if (error) handleError(error)
  return data
}

type TemporaryAPIKeyData = Awaited<ReturnType<typeof getTemporaryAPIKey>>

// export const useLegacyAPIKeysStatusQuery = <TData = LegacyAPIKeysStatusData>(
//   { projectRef }: getTemporaryAPIKeyVariables,
//   { enabled, ...options }: UseQueryOptions<LegacyAPIKeysStatusData, ResponseError, TData> = {}
// ) =>
//   useQuery<LegacyAPIKeysStatusData, ResponseError, TData>(
//     apiKeysKeys.status(projectRef),
//     ({ signal }) => getTemporaryAPIKey({ projectRef }, signal),
//     {
//       enabled: IS_PLATFORM && enabled && !!projectRef,
//       ...options,
//     }
//   )
