import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import useSWR from 'swr'

export function usePermissions2(returning?: 'minimal') {
  let url = `${API_URL}/profile/permissions`

  if (returning) {
    const query = new URLSearchParams({ returning }).toString()
    url = `${url}?${query}`
  }

  const { data: data, error } = useSWR<any>(url, get, {
    loadingTimeout: 10000,
  })
  const anyError = data?.error || error

  return {
    permissions: anyError ? undefined : data,
    isLoading: !anyError && !data,
    isError: !!anyError,
  }
}
