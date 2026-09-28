import { useRouter } from 'next/router'

import { parseRequestedCommand, parseRequestedScopes } from './auth.utils'

export function useRequestedScopes() {
  const { query } = useRouter()
  const { scopes, unknown } = parseRequestedScopes(query.scopes)
  const command = parseRequestedCommand(query.command)
  return { scopes, unknown, command }
}
