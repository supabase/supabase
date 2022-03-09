import useSWR, { mutate } from 'swr'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'

export interface AccessToken {
  id: number
  alias: string
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

  // FOR DEBUG ONLY
  if (data && data.length === 0) {
    data = [
      {
        id: 1,
        alias: 'sbp_exWf......zvHs',
        name: 'Test Token 1',
        created_at: 1646813699,
      },
      {
        id: 2,
        alias: 'sbp_j4Wy......dfPO',
        name: 'Test Token 2',
        created_at: 1600311111,
      },
    ]
  }
  // END

  function mutateNewToken(newToken: AccessToken, revalidate?: boolean) {
    mutate(url, (data: any) => [...data, newToken], revalidate ?? true)
  }

  return {
    tokens: data as AccessToken[],
    isLoading: !anyError && !data,
    isError: !!anyError,
    mutateNewToken,
  }
}
