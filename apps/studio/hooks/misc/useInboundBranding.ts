import { useRouter } from 'next/router'
import { useMemo } from 'react'

import { useEnabledIdentityProviders } from './useEnabledIdentityProviders'
import { type ExternalIdentityProviderConfig } from '@/lib/external-identity-providers'
import { getDestinationById, type SignInDestination } from '@/lib/sign-in-destinations'

export type InboundBranding = {
  /**
   * Destination the user is signing in on the way to (e.g. the Supabase CLI), selected by the
   * `destination` query param and resolved from the static `SIGN_IN_DESTINATIONS` registry. Brands
   * the screen's logo and heading.
   */
  destination?: SignInDestination
  /**
   * Enabled identity provider the inbound link asked us to focus on (the `method` param).
   * When set, sign-in/sign-up render a trimmed-down screen offering only that provider's button.
   */
  focusProvider?: ExternalIdentityProviderConfig
}

/**
 * Reads the branding context for users arriving at sign-in/sign-up from somewhere else, such as the
 * Supabase CLI. Both signals come straight from the URL: these screens render while the user is
 * signed out, so branding can't depend on an authenticated API lookup. (The OAuth consent screen
 * runs post-auth and brands itself dynamically by `auth_id` instead.)
 *
 * Destination and focused provider are independent: a destination brands the screen, and a focused
 * provider trims the screen to a single button whether or not we know the destination.
 *
 * The focused provider must be enabled and visible in the current flow (`showOnSignIn` /
 * `showOnSignUp`), otherwise there'd be no button to offer and we fall back to the full-option
 * screen.
 */
export function useInboundBranding(flow: 'sign-in' | 'sign-up' = 'sign-in'): InboundBranding {
  const router = useRouter()
  const enabledProviders = useEnabledIdentityProviders()

  const destinationId =
    router.isReady && typeof router.query.destination === 'string'
      ? router.query.destination
      : undefined
  const focusId =
    router.isReady && typeof router.query.method === 'string' ? router.query.method : undefined

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

  const destination = getDestinationById(destinationId)

  return { destination, focusProvider }
}
