import { Terminal } from 'lucide-react'
import type { ReactNode } from 'react'

/**
 * A destination the user is signing in on the way to (e.g. the Supabase CLI). Destinations brand
 * the sign-in/sign-up screens but are independent of identity providers: a destination may not have
 * a matching sign-in button at all.
 *
 * The inbound link selects a destination by passing its `id` as the `destination` query param.
 * Branding resolves entirely from this static registry with no API call — the sign-in/sign-up
 * screens render while the user is signed out, so they can't fetch anything that requires auth.
 */
export type SignInDestination = {
  /** Matches the `destination` query param that leads to this destination. */
  id: string
  displayName: string
  /** Mark rendered inset in a LogoBox next to the Supabase logo. */
  icon?: ReactNode
}

const CLI_DESTINATION: SignInDestination = {
  id: 'cli',
  displayName: 'Supabase CLI',
  icon: <Terminal className="size-6 text-foreground" strokeWidth={2} />,
}

// Statically-branded sign-in destinations. To add a new one, declare its config above and add it
// here. OAuth app consent screens brand themselves on `/authorize`, which runs post-auth and can
// look the app up by `auth_id`.
const SIGN_IN_DESTINATIONS: SignInDestination[] = [CLI_DESTINATION]

/** Resolves the destination the `destination` query param refers to, if it's one we brand. */
export function getDestinationById(id: string | undefined): SignInDestination | undefined {
  if (!id) return undefined
  return SIGN_IN_DESTINATIONS.find((destination) => destination.id === id)
}
