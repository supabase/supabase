import { ThirdPartyAuthIntegration } from '@/data/third-party-auth/integrations-query'
import { BASE_PATH } from '@/lib/constants'

export const INTEGRATION_TYPES = [
  'firebase',
  'auth0',
  'awsCognito',
  'clerk',
  'workos',
  'custom',
] as const
export type INTEGRATION_TYPES = (typeof INTEGRATION_TYPES)[number]

export const getIntegrationType = (integration?: ThirdPartyAuthIntegration): INTEGRATION_TYPES => {
  if (integration?.type === 'workos') {
    return 'workos'
  }

  // TODO(hf): Move these to check type as well.
  if (integration?.oidc_issuer_url?.startsWith('https://securetoken.google.com/')) {
    return 'firebase'
  }

  if (integration?.oidc_issuer_url?.includes('amazonaws.com')) {
    return 'awsCognito'
  }

  if (integration?.oidc_issuer_url?.includes('auth0.com')) {
    return 'auth0'
  }

  if (
    integration?.oidc_issuer_url?.includes('.clerk.accounts.dev') ||
    integration?.oidc_issuer_url?.startsWith('https://clerk.')
  ) {
    return 'clerk'
  }

  return 'custom'
}

export const getIntegrationTypeLabel = (type: INTEGRATION_TYPES) => {
  switch (type) {
    case 'firebase':
      return 'Firebase'
    case 'auth0':
      return 'Auth0'
    case 'awsCognito':
      return 'Amazon Cognito'
    case 'clerk':
      return 'Clerk'
    case 'workos':
      return 'WorkOS'
    case 'custom':
    default:
      return 'Custom OIDC'
  }
}

export const getIntegrationTypeIcon = (type: INTEGRATION_TYPES) => {
  switch (type) {
    case 'firebase':
      return `${BASE_PATH}/img/icons/firebase-icon.svg`
    case 'auth0':
      return `${BASE_PATH}/img/icons/auth0-icon.svg`
    case 'awsCognito':
      return `${BASE_PATH}/img/icons/cognito-icon.svg`
    case 'clerk':
      return `${BASE_PATH}/img/icons/clerk-icon.svg`
    case 'workos':
      return `${BASE_PATH}/img/icons/workos-icon.svg`
    case 'custom':
    default:
      return `${BASE_PATH}/img/icons/badge-check-icon.svg`
  }
}

export const isValidOidcIssuerUrl = (value: string) => {
  if (value.includes('?') || value.includes('#')) return false

  try {
    const url = new URL(value)
    return url.protocol === 'https:' && url.hostname.length > 0 && !url.username && !url.password
  } catch {
    return false
  }
}

type CiOidcProvider = {
  name: string
  /** Patterns for the normalized issuer, host plus path, see `normalizeOidcUrl`. */
  issuers: RegExp[]
  /** Path of the provider's JWKS URL, relative to its issuer. Providers without one match on the issuer only. */
  jwksPath?: string
}

/**
 * CI/CD services whose OIDC issuers identify workflows and machines rather than end users.
 * Some sign tokens for every customer of the service, others use one issuer URL per customer
 * or workspace. Keep this list, and the matching rules below, in sync with the
 * `auth_third_party_shared_ci_issuer` Security Advisor lint.
 */
const CI_OIDC_PROVIDERS: CiOidcProvider[] = [
  {
    name: 'GitHub Actions',
    issuers: [
      /^token\.actions\.githubusercontent\.com(\/[^/]+)?$/,
      /^token\.actions\.[a-z0-9-]+\.ghe\.com(\/[^/]+)?$/,
      /^[^/]+\/_services\/token$/,
    ],
  },
  { name: 'GitLab CI/CD', issuers: [/^gitlab\.com$/], jwksPath: '/oauth/discovery/keys' },
  { name: 'CircleCI', issuers: [/^oidc\.circleci\.com(\/org\/[^/]+)?$/] },
  {
    name: 'Bitbucket Pipelines',
    issuers: [/^api\.bitbucket\.org\/2\.0\/workspaces\/[^/]+\/pipelines-config\/identity\/oidc$/],
    jwksPath: '/keys.json',
  },
  { name: 'Buildkite', issuers: [/^agent\.buildkite\.com$/], jwksPath: '/.well-known/jwks' },
  { name: 'HCP Terraform', issuers: [/^app\.terraform\.io$/], jwksPath: '/.well-known/jwks' },
  { name: 'Semaphore', issuers: [/^[a-z0-9-]+\.semaphoreci\.com$/] },
  // The next five are not verified against public vendor docs. They match on the issuer only.
  { name: 'Azure DevOps', issuers: [/^vstoken\.dev\.azure\.com\/[^/]+$/] },
  { name: 'Bitrise', issuers: [/^token\.builds\.bitrise\.io$/] },
  { name: 'Codefresh', issuers: [/^oidc\.codefresh\.io$/] },
  { name: 'Harness', issuers: [/^app\.harness\.io\/ng\/api\/oidc\/account\/[^/]+$/] },
  { name: 'Spacelift', issuers: [/^[a-z0-9-]+\.app\.spacelift\.io$/] },
]

/**
 * Reduces an HTTPS URL to its host and path, dropping whitespace and trailing slashes. The host
 * is lowercased by the URL parser and the path keeps its case. A URL with another scheme, a port
 * other than the default, credentials, a query, or a fragment doesn't normalize.
 */
const normalizeOidcUrl = (value?: string | null) => {
  if (!value) return undefined
  try {
    const url = new URL(value.trim())
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
      return undefined
    }
    return `${url.host}${url.pathname}`.replace(/\/+$/, '')
  } catch {
    return undefined
  }
}

const matchesCiOidcProvider = (
  provider: CiOidcProvider,
  issuer: string | undefined,
  jwks: string | undefined
) => {
  if (issuer && provider.issuers.some((pattern) => pattern.test(issuer))) return true
  if (!jwks || !provider.jwksPath || !jwks.endsWith(provider.jwksPath)) return false

  const jwksIssuer = jwks.slice(0, -provider.jwksPath.length)
  return provider.issuers.some((pattern) => pattern.test(jwksIssuer))
}

/**
 * Returns the names of CI/CD providers that match the given issuer URL or JWKS URL. Every
 * pattern is anchored, so lookalike hosts and extra path segments never match.
 */
export const findCiOidcProviders = ({
  issuerUrl,
  jwksUrl,
}: {
  issuerUrl?: string | null
  jwksUrl?: string | null
}): string[] => {
  const issuer = normalizeOidcUrl(issuerUrl)
  const jwks = normalizeOidcUrl(jwksUrl)

  return CI_OIDC_PROVIDERS.filter((provider) => matchesCiOidcProvider(provider, issuer, jwks)).map(
    ({ name }) => name
  )
}
