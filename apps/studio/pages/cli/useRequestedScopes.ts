import { useRouter } from 'next/router'

import { parseRequestedScopes } from './auth.utils'

export function useRequestedScopes() {
  const { query } = useRouter()
  return parseRequestedScopes(query.scopes)
}
