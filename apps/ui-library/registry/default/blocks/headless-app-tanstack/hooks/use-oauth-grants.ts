import type { OAuthGrant } from '@supabase/supabase-js'
import { useCallback, useEffect, useRef, useState } from 'react'

import { createClient } from '@/registry/default/clients/tanstack/lib/supabase/client'

// Revocation invalidates refresh tokens. Already-issued access tokens can still
// be accepted by the MCP server until they expire.
const useOAuthGrants = () => {
  const [grants, setGrants] = useState<OAuthGrant[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [revokingClientId, setRevokingClientId] = useState<string | null>(null)
  const mounted = useRef(false)
  const requestId = useRef(0)
  const isRevoking = useRef(false)

  const refresh = useCallback(async () => {
    if (!mounted.current || isRevoking.current) return
    const id = ++requestId.current
    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await createClient().auth.oauth.listGrants()
      if (error) throw error
      if (mounted.current && id === requestId.current) setGrants(data)
    } catch (error) {
      if (mounted.current && id === requestId.current) {
        setError(
          `Unable to load connected agents. ${error instanceof Error ? error.message : 'Try refreshing the list.'}`
        )
      }
    } finally {
      if (mounted.current && id === requestId.current) setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    mounted.current = true
    const onFocus = () => void refresh()
    void refresh()
    window.addEventListener('focus', onFocus)
    return () => {
      mounted.current = false
      window.removeEventListener('focus', onFocus)
    }
  }, [refresh])

  const revoke = useCallback(async (clientId: string) => {
    if (!mounted.current || isRevoking.current) return
    isRevoking.current = true
    // A list request started before revocation must not restore the removed grant.
    const id = ++requestId.current
    setIsLoading(false)
    setRevokingClientId(clientId)
    setError(null)

    try {
      const { error } = await createClient().auth.oauth.revokeGrant({ clientId })
      if (error) throw error
      if (mounted.current && id === requestId.current) {
        setGrants((current) => current?.filter((grant) => grant.client.id !== clientId) ?? null)
      }
    } catch (error) {
      if (mounted.current && id === requestId.current) {
        setError(
          `Unable to revoke access. ${error instanceof Error ? error.message : 'Try revoking access again.'}`
        )
      }
    } finally {
      isRevoking.current = false
      if (mounted.current && id === requestId.current) setRevokingClientId(null)
    }
  }, [])

  return { grants, error, isLoading, revokingClientId, refresh, revoke }
}

type UseOAuthGrantsReturn = ReturnType<typeof useOAuthGrants>

export { useOAuthGrants, type OAuthGrant, type UseOAuthGrantsReturn }
