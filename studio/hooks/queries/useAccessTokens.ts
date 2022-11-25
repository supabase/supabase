import useSWR, { mutate } from 'swr'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'

export interface AccessToken {
  id: number
  token_alias: string
  name: string
  created_at: number
}

export interface NewAccessToken extends AccessToken {
  token: string
}

export function useAccessTokens() {
  const url = `${API_URL}/profile/access-tokens`
  let { data, error } = useSWR<any>(url, get)
  const anyError = data?.error || error

  function mutateNewToken(newToken: AccessToken, revalidate?: boolean) {
    mutate(url, (data: AccessToken[]) => [...(data || []), newToken], revalidate ?? true)
  }

  function mutateDeleteToken(tokenId: number, revalidate?: boolean) {
    mutate(
      url,
      (data: AccessToken[]) => data.filter((x: AccessToken) => x.id === tokenId),
      revalidate ?? true
    )
  }

  return {
    tokens: anyError ? undefined : (data as AccessToken[]),
    isLoading: !anyError && !data,
    isError: !!anyError,
    mutateNewToken,
    mutateDeleteToken,
  }
}
