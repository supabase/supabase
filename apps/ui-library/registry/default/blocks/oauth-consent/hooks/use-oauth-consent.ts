import { isAuthSessionMissingError } from '@supabase/supabase-js'
import type { OAuthAuthorizationDetails } from '@supabase/supabase-js'
import { useCallback, useEffect, useRef, useState } from 'react'

import { createClient } from '@/registry/default/clients/nextjs/lib/supabase/client'

export type OAuthConsentDecision = 'approve' | 'deny'

export interface UseOAuthConsentOptions {
  authorizationId?: string | null
  signInPath?: string
}

const sameOriginPath = (path: string | null | undefined, fallback = '/') => {
  if (!path?.startsWith('/')) return fallback

  try {
    const url = new URL(path, window.location.origin)
    return url.origin === window.location.origin
      ? `${url.pathname}${url.search}${url.hash}`
      : fallback
  } catch {
    return fallback
  }
}

const withNextParam = (path: string, next: string) =>
  `${path}${path.includes('?') ? '&' : '?'}next=${encodeURIComponent(next)}`

const useOAuthConsent = ({
  authorizationId,
  signInPath = '/auth/login',
}: UseOAuthConsentOptions) => {
  const [details, setDetails] = useState<OAuthAuthorizationDetails | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [decision, setDecision] = useState<OAuthConsentDecision | null>(null)
  const isDeciding = useRef(false)

  useEffect(() => {
    let active = true

    const loadAuthorization = async () => {
      setIsLoading(true)
      setError(null)
      setDetails(null)
      setDecision(null)

      if (!authorizationId) {
        setError('This page needs an authorization_id. Start again from your OAuth client.')
        setIsLoading(false)
        return
      }

      const supabase = createClient()
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError && !isAuthSessionMissingError(userError)) {
        if (active) {
          setError(userError.message)
          setIsLoading(false)
        }
        return
      }

      if (!user) {
        const next = `${window.location.pathname}${window.location.search}`
        window.location.replace(withNextParam(sameOriginPath(signInPath, '/auth/login'), next))
        return
      }

      const { data, error } = await supabase.auth.oauth.getAuthorizationDetails(authorizationId)
      if (error) {
        if (active) {
          setError(error.message)
          setIsLoading(false)
        }
        return
      }

      if (!('authorization_id' in data)) {
        window.location.replace(data.redirect_url)
        return
      }

      if (active) {
        setDetails(data)
        setIsLoading(false)
      }
    }

    void loadAuthorization()
    return () => {
      active = false
    }
  }, [authorizationId, signInPath])

  const decide = useCallback(
    async (action: OAuthConsentDecision) => {
      if (!authorizationId || isDeciding.current) return

      isDeciding.current = true
      setDecision(action)
      setError(null)
      const supabase = createClient()
      const result =
        action === 'approve'
          ? await supabase.auth.oauth.approveAuthorization(authorizationId, {
              skipBrowserRedirect: true,
            })
          : await supabase.auth.oauth.denyAuthorization(authorizationId, {
              skipBrowserRedirect: true,
            })

      if (result.error) {
        setError(result.error.message)
        setDecision(null)
        isDeciding.current = false
        return
      }

      if (!result.data?.redirect_url) {
        setError('The server did not return a redirect. Start again from your OAuth client.')
        setDecision(null)
        isDeciding.current = false
        return
      }

      window.location.assign(result.data.redirect_url)
    },
    [authorizationId]
  )

  return {
    details,
    email: details?.user.email ?? null,
    error,
    isLoading,
    decision,
    approve: () => decide('approve'),
    deny: () => decide('deny'),
  }
}

type UseOAuthConsentReturn = ReturnType<typeof useOAuthConsent>

export { useOAuthConsent, type OAuthAuthorizationDetails, type UseOAuthConsentReturn }
