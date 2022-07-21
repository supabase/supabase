import useSWR from 'swr'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { Role } from 'types'

export function useOrganizationRoles(slug: string) {
  const url = `${API_URL}/organizations/${slug}/roles`
  const { data, error } = useSWR<any>(url, get)
  const anyError = data?.error || error

  return {
    roles: anyError ? [] : (data as Role[]),
    error: anyError,
    isLoading: !anyError && !data,
    isError: !!anyError,
  }
}
