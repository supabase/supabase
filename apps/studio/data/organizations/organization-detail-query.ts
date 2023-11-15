import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { Member, ResponseError } from 'types'
import { organizationKeys } from './keys'

export type OrganizationDetailVariables = {
  slug?: string
}

export type OrganizationDetailResponse = {
  members: Member[]
}

export async function getOrganizationDetail(
  { slug }: OrganizationDetailVariables,
  signal?: AbortSignal
) {
  if (!slug) {
    throw new Error('slug is required')
  }

  let [data, inviteData] = await Promise.all([
    get(`${API_URL}/organizations/${slug}/members?member_roles`, {
      signal,
    }),
    get(`${API_URL}/organizations/${slug}/members/invite`, {
      signal,
    }),
  ])
  if (data.error) {
    throw data.error
  }
  if (inviteData.error) {
    throw inviteData.error
  }

  if (data && inviteData && inviteData.length > 0) {
    // Remap invite data to look like existing members data
    const invitedMembers = inviteData.map((x: any) => {
      const member = {
        is_owner: false,
        invited_at: x.invited_at,
        invited_id: x.invited_id,
        username: x.invited_email.slice(0, 1),
        primary_email: x.invited_email,
      }
      return { ...member, role_ids: [x.role_id] }
    })

    data = [...data, ...invitedMembers]
  }

  return { members: data } as OrganizationDetailResponse
}

export type OrganizationDetailData = Awaited<ReturnType<typeof getOrganizationDetail>>
export type OrganizationDetailError = ResponseError

export const useOrganizationDetailQuery = <TData = OrganizationDetailData>(
  { slug }: OrganizationDetailVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<OrganizationDetailData, OrganizationDetailError, TData> = {}
) =>
  useQuery<OrganizationDetailData, OrganizationDetailError, TData>(
    organizationKeys.detail(slug),
    ({ signal }) => getOrganizationDetail({ slug }, signal),
    {
      enabled: enabled && typeof slug !== 'undefined',
      ...options,
    }
  )
