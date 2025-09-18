// import { components } from 'api-types'
// import { get, handleError } from 'data/fetchers'
// import { MANAGED_BY, ManagedBy, OPT_IN_TAGS } from 'lib/constants'
// import { Organization } from 'types'
//
// [Joshen] If this works, we need to clean up

export type AiOptInLevel = 'disabled' | 'schema' | 'schema_and_log' | 'schema_and_log_and_data'

// type OrganizationBase = components['schemas']['OrganizationResponse']

// function getManagedBy(org: OrganizationBase): ManagedBy {
//   switch (org.billing_partner) {
//     case 'vercel_marketplace':
//       return MANAGED_BY.VERCEL_MARKETPLACE
//     // TODO(ignacio): Uncomment this when we've deployed the AWS Marketplace new slug
//     // case 'aws_marketplace':
//     // return MANAGED_BY.AWS_MARKETPLACE
//     case 'aws':
//       return MANAGED_BY.AWS_MARKETPLACE
//     default:
//       return MANAGED_BY.SUPABASE
//   }
// }
//
// function castOrganizationResponseToOrganization(org: OrganizationBase): Organization {
//   return {
//     ...org,
//     billing_email: org.billing_email ?? 'Unknown',
//     managed_by: getManagedBy(org),
//     partner_id: org.slug.startsWith('vercel_') ? org.slug.replace('vercel_', '') : undefined,
//   }
// }
//
// async function getOrganizations({
//   signal,
//   headers,
// }: {
//   signal?: AbortSignal
//   headers?: Record<string, string>
// }): Promise<Organization[]> {
//   const { data, error } = await get('/platform/organizations', { signal, headers })
//
//   if (error) handleError(error)
//   if (!Array.isArray(data)) return []
//
//   return data
//     .map(castOrganizationResponseToOrganization)
//     .sort((a, b) => a.name.localeCompare(b.name))
// }
//
// async function getProjects({
//   signal,
//   headers,
// }: {
//   signal?: AbortSignal
//   headers?: Record<string, string>
// }) {
//   const { data, error } = await get('/platform/projects', { signal, headers })
//
//   if (error) handleError(error)
//   // The /platform/projects endpoint has a v2 which is activated by passing a {version: '2'} header. The v1 API returns
//   // all projects while the v2 returns paginated list of projects. Wrapping the v1 API response into a
//   // { projects: ProjectInfo[] } is intentional to be forward compatible with the structure of v2 for easier migration.
//   return { projects: data }
// }
//
// const getAiOptInLevel = (tags: string[] | undefined): AiOptInLevel => {
//   const hasSql = tags?.includes(OPT_IN_TAGS.AI_SQL)
//   const hasData = tags?.includes(OPT_IN_TAGS.AI_DATA)
//   const hasLog = tags?.includes(OPT_IN_TAGS.AI_LOG)
//
//   if (hasData) {
//     return 'schema_and_log_and_data'
//   } else if (hasLog) {
//     return 'schema_and_log'
//   } else if (hasSql) {
//     return 'schema'
//   } else {
//     return 'disabled'
//   }
// }
//
export const getOrgAIDetails = async ({
  orgSlug,
  authorization,
  projectRef,
}: {
  orgSlug: string
  authorization: string
  projectRef: string
}) => {
  return {
    aiOptInLevel: 'disabled',
    isLimited: false,
  }
}
