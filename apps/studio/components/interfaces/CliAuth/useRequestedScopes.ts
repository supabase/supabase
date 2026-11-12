import { useRouter } from 'next/router'

import { parseRequestedScopes } from './CliAuth.utils'

export function useRequestedScopes() {
  const { query } = useRouter()
  return parseRequestedScopes(query.scopes)
}
