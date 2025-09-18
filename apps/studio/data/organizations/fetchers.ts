// [Joshen] These are being placed separately as they're also being used in the API
// which we should avoid mixing client side and server side logic (main problem was importing of react query)

import { components } from 'api-types'
import { get, handleError } from 'data/fetchers'
import { MANAGED_BY, ManagedBy } from 'lib/constants'
import { Organization } from 'types'

export type OrganizationBase = components['schemas']['OrganizationResponse']

function getManagedBy(org: OrganizationBase): ManagedBy {
  switch (org.billing_partner) {
    case 'vercel_marketplace':
      return MANAGED_BY.VERCEL_MARKETPLACE
    // TODO(ignacio): Uncomment this when we've deployed the AWS Marketplace new slug
    // case 'aws_marketplace':
    // return MANAGED_BY.AWS_MARKETPLACE
    case 'aws':
      return MANAGED_BY.AWS_MARKETPLACE
    default:
      return MANAGED_BY.SUPABASE
  }
}

export function castOrganizationResponseToOrganization(org: OrganizationBase): Organization {
  return {
    ...org,
    billing_email: org.billing_email ?? 'Unknown',
    managed_by: getManagedBy(org),
    partner_id: org.slug.startsWith('vercel_') ? org.slug.replace('vercel_', '') : undefined,
  }
}

export async function getOrganizations({
  signal,
  headers,
}: {
  signal?: AbortSignal
  headers?: Record<string, string>
}): Promise<Organization[]> {
  const { data, error } = await get('/platform/organizations', { signal, headers })

  if (error) handleError(error)
  if (!Array.isArray(data)) return []

  return data
    .map(castOrganizationResponseToOrganization)
    .sort((a, b) => a.name.localeCompare(b.name))
}
