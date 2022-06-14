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
  const {data: inviteData, error: inviteError} = useSWR<any>(pendingInviteUrl, get)


  if (data && inviteData) {
    // remap invite data to look like existing members data
    const reMappedInvitedata = inviteData.map((x: any) => (
      {is_owner: false, invited_at: x.invited_at, invited_id: x.invited_id, profile: {username: '', primary_email: x.invited_email}}
    ))

    members = [...members, ...reMappedInvitedata]
  }

  const anyError = data?.error || error || inviteError

  function mutateOrgMembers(updatedMembers: Member[], revalidate?: boolean) {
    mutate(url, { members: updatedMembers }, revalidate ?? true)
  }

  console.log('all members', members)

return {
    members: members as Member[],
    products,
    isLoading: !anyError && !data,
    isError: !!anyError,
    mutateOrgMembers,
  }
}
