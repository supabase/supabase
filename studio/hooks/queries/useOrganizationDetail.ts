import useSWR, { mutate } from 'swr'
import { get } from 'lib/common/fetch'
import { Member } from 'types'
import { API_URL } from 'lib/constants'

export function useOrganizationDetail(slug: string) {
  const url = `${API_URL}/props/org/${slug}?member_roles`
  const { data, error } = useSWR<any>(url, get)
  const members = data?.members ?? []
  const anyError = data?.error || error

  function mutateOrgMembers(updatedMembers: Member[], revalidate?: boolean) {
    mutate(url, { members: updatedMembers }, revalidate ?? true)
  }

  return {
    members: members as Member[],
    isLoading: !anyError && !data,
    isError: !!anyError,
    mutateOrgMembers,
  }
}
