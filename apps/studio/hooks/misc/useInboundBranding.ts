import { useRouter } from 'next/router'
import { useMemo } from 'react'

import { useEnabledIdentityProviders } from './useEnabledIdentityProviders'
import { useApiAuthorizationQuery } from '@/data/api-authorization/api-authorization-query'
import { type ExternalIdentityProviderConfig } from '@/lib/external-identity-providers'
import {
  getAuthorizeRequestId,
  getDestinationForReturnTo,
  getOAuthAppDestination,
  type SignInDestination,
} from '@/lib/sign-in-destinations'

export type InboundBranding = {
  /**
   * Destination the user is signing in on the way to. Resolved from the `returnTo` value (e.g.
   * the CLI login page, or an OAuth app's consent screen via its `auth_id`). Brands the
   * screen's logo and heading.
   */
  destination?: SignInDestination
  /**
   * Enabled identity provider the inbound link asked us to focus on (the `provider` param).
   * When set, sign-in/sign-up render a trimmed-down screen offering only that provider's button.
   */
  focusProvider?: ExternalIdentityProviderConfig
}

/**
 * Reads the branding context for users arriving at sign-in/sign-up from somewhere else: the
 * Supabase CLI, or an OAuth app's consent screen.
 *
 * Destination and focused provider are independent: a `returnTo` destination brands the screen, and
 * a focused provider trims the screen to a single button whether or not we know the destination.
 *
 * The focused provider must be enabled and visible in the current flow (`showOnSignIn` /
 * `showOnSignUp`), otherwise there'd be no button to offer and we fall back to the full-option
 * screen.
 */
export function useInboundBranding(flow: 'sign-in' | 'sign-up' = 'sign-in'): InboundBranding {
  const router = useRouter()
  const enabledProviders = useEnabledIdentityProviders()

  const returnTo = typeof router.query.returnTo === 'string' ? router.query.returnTo : undefined
  const focusId = typeof router.query.provider === 'string' ? router.query.provider : undefined

  const focusProvider = useMemo(
    () =>
      focusId
        ? enabledProviders.find(
            (provider) =>
              focusId === provider.authProvider &&
              (flow === 'sign-up' ? provider.showOnSignUp : provider.showOnSignIn)
          )
        : undefined,
    [focusId, flow, enabledProviders]
  )

  // Statically-known destinations resolve instantly and take precedence, so the branding never
  // swaps once a slower dynamic lookup resolves.
  const staticDestination = getDestinationForReturnTo(returnTo)

  // An OAuth app's consent screen is branded from the authorization request the user is returning
  // to. If the lookup fails (or the requesting app is unknown), the screen just stays unbranded.
  const authorizeRequestId = getAuthorizeRequestId(returnTo)
  const { data: authorization } = useApiAuthorizationQuery(
    { id: authorizeRequestId },
    { enabled: !staticDestination && !!authorizeRequestId }
  )

  const destination =
    staticDestination ??
    (!!authorizeRequestId && authorization ? getOAuthAppDestination(authorization) : undefined)

  return { destination, focusProvider }
}
