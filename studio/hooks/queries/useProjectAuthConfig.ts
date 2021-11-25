import useSWR, { mutate } from 'swr'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'

export function useProjectAuthConfig(ref: string) {
  const url = `${API_URL}/auth/${ref}/config`
  const { data, error } = useSWR<any>(url, get)
  const anyError = data?.error || error

  function mutateAuthConfig(updatedConfig: any, revalidate?: boolean) {
    mutate(url, { ...updatedConfig }, revalidate ?? true)
  }

  return {
    config: anyError ? undefined : data,
    error: anyError,
    isLoading: !anyError && !data,
    isError: !!anyError,
    mutateAuthConfig,
  }
}
