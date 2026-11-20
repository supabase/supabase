import { queryOptions } from '@tanstack/react-query'

import { get } from './fetchWrappers'

const organizationKeys = {
  list: () => ['organizations'] as const,
}

async function getOrganizations(signal?: AbortSignal) {
  // The generated api response in api.d.ts is typed as OrganizationResponseV1
  // but the actual response should be typed as OrganizationResponse.
  const { data, error } = await get('/platform/organizations', { signal })
  if (error) throw error
  return data
}

export type OrganizationsData = Awaited<ReturnType<typeof getOrganizations>>

export const organizationsQueryOptions = (
  { enabled = true }: { enabled?: boolean } = { enabled: true }
) => {
  return queryOptions({
    queryKey: organizationKeys.list(),
    queryFn: ({ signal }) => getOrganizations(signal),
    enabled,
  })
}
