import useSWR from 'swr'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'

export interface MemberWithFreeProjectLimit {
  free_project_limit: number
  primary_email: string
  username: string
}

export function useFreeProjectLimitCheck(slug?: string) {
  const url = `${API_URL}/organizations/${slug}/members/reached-free-project-limit`
  const { data, error } = useSWR<any>(slug ? url : null, get)
  const anyError = data?.error || error

  return {
    membersExceededLimit: anyError ? undefined : (data as MemberWithFreeProjectLimit[]),
    error: anyError,
    isLoading: !anyError && !data,
    isError: !!anyError,
  }
}
