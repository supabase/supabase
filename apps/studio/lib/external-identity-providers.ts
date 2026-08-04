import { BASE_PATH } from './constants'

export type ExternalIdentityProviderConfig = {
  id: string
  authProvider: string
  displayName: string
  iconPath: string
  scopes?: string
  showOnSignIn: boolean
  showOnSignUp: boolean
  showInAccountPreferences: boolean
}

export type IdentityProviderDisplay = {
  id: string
  displayName: string
  iconPath: string
  /** The icon is a single-color mark that should be tinted to the theme's foreground color. */
  hasMonochromeIcon?: boolean
}

const BUILT_IN_IDENTITY_PROVIDERS: Record<string, IdentityProviderDisplay> = {
  email: {
    id: 'email',
    displayName: 'Email',
    iconPath: `${BASE_PATH}/img/icons/email-icon2.svg`,
  },
}

// Statically supported identity providers. To add a new one, declare its config here, gate its
// visibility behind a `dashboard_auth:sign_in_with_*` feature flag in `useEnabledIdentityProviders`,
// and add the matching flag to `packages/common/enabled-features/enabled-features.json`.
export const GITHUB_IDENTITY_PROVIDER: ExternalIdentityProviderConfig = {
  id: 'github',
  authProvider: 'github',
  displayName: 'GitHub',
  iconPath: '/img/icons/github-icon.svg',
  showOnSignIn: true,
  showOnSignUp: true,
  showInAccountPreferences: false,
}

export const CHATGPT_IDENTITY_PROVIDER: ExternalIdentityProviderConfig = {
  id: 'chatgpt',
  authProvider: 'custom:openai',
  displayName: 'ChatGPT',
  iconPath: '/img/icons/openai-icon.svg',
  showOnSignIn: true,
  showOnSignUp: true,
  showInAccountPreferences: false,
}

// Registry of every known provider, independent of which are currently enabled. Used for config and
// display lookups (e.g. resolving the provider that a mid-flow interstitial was reached with).
const IDENTITY_PROVIDERS: ExternalIdentityProviderConfig[] = [
  GITHUB_IDENTITY_PROVIDER,
  CHATGPT_IDENTITY_PROVIDER,
]

export function normalizeIconPath(iconPath: string): string {
  if (
    iconPath.startsWith('http://') ||
    iconPath.startsWith('https://') ||
    iconPath.startsWith('/')
  ) {
    return iconPath.startsWith('/') ? `${BASE_PATH}${iconPath}` : iconPath
  }

  return `${BASE_PATH}/${iconPath}`
}

export function getProviderDisplay(provider: string): IdentityProviderDisplay {
  const config = IDENTITY_PROVIDERS.find(
    ({ id, authProvider }) => provider === id || provider === authProvider
  )

  if (config) {
    return {
      id: config.id,
      displayName: config.displayName,
      iconPath: normalizeIconPath(config.iconPath),
      hasMonochromeIcon: true,
    }
  }

  if (provider.startsWith('sso')) {
    return {
      id: provider,
      displayName: 'SSO',
      iconPath: `${BASE_PATH}/img/icons/saml-icon.svg`,
    }
  }

  return (
    BUILT_IN_IDENTITY_PROVIDERS[provider] ?? {
      id: provider,
      displayName: provider.replaceAll('_', ' '),
      iconPath: `${BASE_PATH}/img/icons/saml-icon.svg`,
    }
  )
}

/**
 * Builds the absolute URL an external provider's OAuth flow redirects back to: the MFA-check page
 * (`/sign-in-mfa`), tagged with the provider id as the sign-in method and an optional `returnTo`
 * destination. Callers should pass the result through `buildPathWithParams` to preserve the current
 * location's search params across the OAuth round-trip.
 */
export function buildProviderAuthRedirect(providerId: string, returnTo?: string): string {
  const origin =
    typeof window !== 'undefined' && process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL

  const params = new URLSearchParams({ method: providerId })
  if (returnTo) params.set('returnTo', returnTo)

  return `${origin}${BASE_PATH}/sign-in-mfa?${params.toString()}`
}

export function getIdentityProviderConfig(
  provider: string | undefined
): ExternalIdentityProviderConfig | undefined {
  if (!provider) return undefined

  return IDENTITY_PROVIDERS.find(
    ({ id, authProvider }) => provider === id || provider === authProvider
  )
}
