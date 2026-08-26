import type { OAuthGrant } from '@supabase/supabase-js'
import { useCallback, useEffect, useState } from 'react'

import { createClient } from '@/registry/default/clients/tanstack/lib/supabase/client'

// A grant is the user's own record of an OAuth client they authorized. Revoking
// one deletes that client's sessions and invalidates its refresh tokens.
const useOAuthGrants = () => {
  const [grants, setGrants] = useState<OAuthGrant[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [revokingClientId, setRevokingClientId] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const loadGrants = async () => {
      const supabase = createClient()
      const { data, error } = await supabase.auth.oauth.listGrants()
      if (!active) return

      if (error) setError(error.message)
      else setGrants(data)
    }

    void loadGrants()
    return () => {
      active = false
    }
  }, [])

  const revoke = useCallback(async (clientId: string) => {
    setRevokingClientId(clientId)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.oauth.revokeGrant({ clientId })
    setRevokingClientId(null)

    if (error) {
      setError(error.message)
      return
    }

    setGrants((current) => current?.filter((grant) => grant.client.id !== clientId) ?? null)
  }, [])

  return {
    grants,
    error,
    isLoading: grants === null && error === null,
    revokingClientId,
    revoke,
  }
}

type UseOAuthGrantsReturn = ReturnType<typeof useOAuthGrants>

export { useOAuthGrants, type OAuthGrant, type UseOAuthGrantsReturn }
