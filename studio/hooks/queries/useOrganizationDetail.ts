import useSWR, { mutate } from 'swr'

import { Member } from 'types'
import { API_URL } from 'lib/constants'
import { get } from 'lib/common/fetch'

export function useOrganizationDetail(slug: string) {
  // Get org members
  const url = `${API_URL}/organizations/${slug}/members?member_roles`

  const { data, error } = useSWR<any>(slug ? url : null, get)
  let members = data

  // Get pending invite users
  const pendingInviteUrl = `${API_URL}/organizations/${slug}/members/invite`
  const { data: inviteData, error: inviteError } = useSWR<any>(slug ? pendingInviteUrl : null, get)

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

    members = [...members, ...invitedMembers]
  }

  const anyError = data?.error || error || inviteError

  function mutateOrgMembers(updatedMembers: Member[], revalidate?: boolean) {
    mutate(url, [...updatedMembers], revalidate ?? true)
    mutate(pendingInviteUrl, {}, revalidate ?? true)
  }

  return {
    members: members as Member[],
    isLoading: !anyError && !data,
    isError: !!anyError,
    mutateOrgMembers,
  }
}
