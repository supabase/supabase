// Why the dashboard sent a user back to /sign-in. Keyed by a code in the URL so that the copy
// shown is always ours, never text taken from a link.
export const SIGN_IN_REDIRECT_REASONS = {
  profile_conflict: {
    title: "We couldn't finish signing you in",
    description:
      'Your account details conflict with an existing Supabase account. Sign in to that account and update its email under Account > Preferences, then try again.',
  },
} as const

export type SignInRedirectReason = keyof typeof SIGN_IN_REDIRECT_REASONS

export const isSignInRedirectReason = (value: string | null): value is SignInRedirectReason =>
  value !== null && Object.hasOwn(SIGN_IN_REDIRECT_REASONS, value)
