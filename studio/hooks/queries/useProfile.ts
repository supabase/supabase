import useSWR, { mutate } from 'swr'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { User } from 'types'

export function useProfile(returning?: 'minimal') {
  let url = `${API_URL}/profile`

  if (returning) {
    const query = new URLSearchParams({ returning }).toString()
    url = `${url}?${query}`
  }

  const { data, error } = useSWR<any>(url, get, { loadingTimeout: 10000 })
  const anyError = data?.error || error

  function mutateProfile(updatedUser: User, revalidate?: boolean) {
    mutate(
      url,
      {
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
      },
      revalidate ?? true
    )
  }

  return {
    profile: anyError ? undefined : data,
    isLoading: !anyError && !data,
    isError: !!anyError,
    error: anyError,
    mutateProfile,
  }
}
