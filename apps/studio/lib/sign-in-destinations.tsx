import { Terminal } from 'lucide-react'
import type { ReactNode } from 'react'

/**
 * A destination the user is signing in on the way to (e.g. the Supabase CLI, an OAuth app's
 * consent screen). Destinations brand the sign-in/sign-up screens but are independent of identity
 * providers: a destination may not have a matching sign-in button at all.
 */
export type SignInDestination = {
  id: string
  displayName: string
  /** Mark rendered inset in a LogoBox next to the Supabase logo. */
  icon?: ReactNode
  /** Matches the validated `returnTo` value that leads to this destination. */
  matchesReturnTo?: (returnTo: string) => boolean
}

export const CLI_DESTINATION: SignInDestination = {
  id: 'cli',
  displayName: 'Supabase CLI',
  icon: <Terminal className="size-6 text-foreground" strokeWidth={2} />,
  matchesReturnTo: (returnTo) => returnTo === '/cli/login' || returnTo.startsWith('/cli/login?'),
}

// Statically-branded sign-in destinations. To add a new one, declare its config above and add it
// here; OAuth app consent screens are branded dynamically via `getOAuthAppDestination`.
export const SIGN_IN_DESTINATIONS: SignInDestination[] = [CLI_DESTINATION]

/** Resolves the destination a `returnTo` value leads to, if it's one we brand. */
export function getDestinationForReturnTo(
  returnTo: string | undefined
): SignInDestination | undefined {
  if (!returnTo) return undefined
  return SIGN_IN_DESTINATIONS.find((destination) => destination.matchesReturnTo?.(returnTo))
}

/**
 * Extracts the `auth_id` from a `returnTo` path pointing at the OAuth consent screen
 * (`/authorize`), so the sign-in screen can brand itself with the requesting app's details.
 */
export function getAuthorizeRequestId(returnTo: string | undefined): string | undefined {
  if (!returnTo || !(returnTo === '/authorize' || returnTo.startsWith('/authorize?'))) {
    return undefined
  }

  return new URLSearchParams(returnTo.split('?')[1]).get('auth_id') || undefined
}

/**
 * Destination for an OAuth app's consent screen, branded from the authorization request details
 * (fetched by `auth_id`, the same data the consent screen itself renders).
 */
export function getOAuthAppDestination(app: {
  name: string
  icon: string | null
}): SignInDestination {
  return {
    id: 'oauth-app',
    displayName: app.name,
    // Edge-to-edge like the consent screen's RequesterLogo; DestinationLogo falls back to the
    // app's initial when it has no icon.
    icon: app.icon ? (
      <img alt={app.name} src={app.icon} className="size-full object-cover" />
    ) : undefined,
  }
}
