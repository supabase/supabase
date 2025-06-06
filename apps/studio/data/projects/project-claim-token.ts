import { handleError, post } from 'data/fetchers'

export type CreateClaimTokenVariables = {
  projectRef: string
  organizationSlug?: string
}

export async function createClaimToken({ projectRef }: CreateClaimTokenVariables) {
  const { data, error } = await post('/v1/projects/{ref}/claim-token', {
    params: { path: { ref: projectRef } },
  })

  if (error) handleError(error)
  return data
}
