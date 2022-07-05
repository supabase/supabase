import useSWR, { mutate } from 'swr'
import { get } from 'lib/common/fetch'
import { Member } from 'types'
import { API_URL } from 'lib/constants'

export function useOrganizationDetail(slug: string) {
  // Get org members
  const url = `${API_URL}/props/org/${slug}`
  const { data, error } = useSWR<any>(url, get)
  let { members, products } = data ?? []

  // Get pending invite users
  const pendingInviteUrl = `${API_URL}/organizations/${slug}/members/invite`
  const { data: inviteData, error: inviteError } = useSWR<any>(pendingInviteUrl, get)

  if (data && inviteData && inviteData.length > 0) {
    // remap invite data to look like existing members data
    const invitedMembers = inviteData.map((x: any) => ({
      is_owner: false,
      invited_at: x.invited_at,
      invited_id: x.invited_id,
      profile: {
        // Use the first letter of the email to allow for member list sorting
        username: x.invited_email.slice(0, 1),
        primary_email: x.invited_email,
      },
    }))

    members = [...members, ...invitedMembers]
  }

  const anyError = data?.error || error || inviteError

  function mutateOrgMembers(updatedMembers: Member[], revalidate?: boolean) {
    mutate(url, { members: updatedMembers }, revalidate ?? true)
    mutate(pendingInviteUrl, {}, revalidate ?? true)
  }

  return {
    members: members as Member[],
    products,
    isLoading: !anyError && !data,
    isError: !!anyError,
    mutateOrgMembers,
  }
}
