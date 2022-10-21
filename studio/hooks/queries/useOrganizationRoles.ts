import useSWR from 'swr'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { Role } from 'types'

// [Joshen] Putting roles in a hook for now for simplicity
// Unless we plan to support CRUD on roles i think it can stay as a hook
// otherwise, best to shift it to a store. If we do shift it, have it in the
// App store to prevent confusion with PG roles

export function useOrganizationRoles(slug?: string) {
  const url = `${API_URL}/organizations/${slug}/roles`
  const { data, error } = useSWR<any>(slug ? url : null, get)
  const anyError = data?.error || error

  return {
    roles: anyError ? [] : (data as Role[]),
    error: anyError,
    isLoading: !anyError && !data,
    isError: !!anyError,
  }
}
