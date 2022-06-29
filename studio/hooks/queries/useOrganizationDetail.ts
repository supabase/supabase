import useSWR, { mutate } from 'swr'
import { get } from 'lib/common/fetch'
import { Member } from 'types'
import { API_URL } from 'lib/constants'

export function useOrganizationDetail(slug: string) {
  const url = `${API_URL}/props/org/${slug}`
  const { data, error } = useSWR<any>(url, get)
  const { members, products } = data ?? []
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
