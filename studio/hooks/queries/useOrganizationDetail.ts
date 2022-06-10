import useSWR, { mutate } from 'swr'
import { get } from 'lib/common/fetch'
import { Member } from 'types'
import { API_URL } from 'lib/constants'

export function useOrganizationDetail(slug: string) {
  const url = `${API_URL}/props/org/${slug}`
  const { data, error } = useSWR<any>(url, get)
  let { members, products } = data ?? []
  if (data) {

    members = [...members,
      {
        id: 200,
        is_owner: false,
        profile: {
          id: 98, username: 'supaterry', primary_email: 'terry@supabase.io', expired: true
        }
      },
    {
      id: 201,
      is_owner: false,
      profile: {
        id: 99, username: 'timapple', primary_email: 'tim@apple.com', expired: true
      }
    },
  ]
}
  const anyError = data?.error || error

  function mutateOrgMembers(updatedMembers: Member[], revalidate?: boolean) {
    mutate(url, { members: updatedMembers }, revalidate ?? true)
  }

  return {
    members: members as Member[],
    products,
    isLoading: !anyError && !data,
    isError: !!anyError,
    mutateOrgMembers,
  }
}
