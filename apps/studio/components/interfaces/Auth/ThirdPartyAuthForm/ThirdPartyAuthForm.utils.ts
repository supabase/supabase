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

/**
 * CI/CD services whose OIDC issuers identify workflows and machines rather than end users.
 * Some sign tokens for every customer of the service, others use one issuer URL per customer
 * or workspace. Patterns run against a normalized URL, see `normalizeOidcUrl`. Keep this list
 * in sync with the `auth_third_party_shared_ci_issuer` Security Advisor lint.
 */
const CI_OIDC_PROVIDERS: ReadonlyArray<{ name: string; issuer: RegExp; jwksUrl: RegExp }> = [
  {
    name: 'GitHub Actions',
    issuer: /^https:\/\/token\.actions\.githubusercontent\.com(\/[^/]+)?$/,
    jwksUrl: /^https:\/\/token\.actions\.githubusercontent\.com(\/[^/]+)?\/\.well-known\/jwks$/,
  },
  {
    name: 'GitLab.com',
    issuer: /^https:\/\/gitlab\.com$/,
    jwksUrl: /^https:\/\/gitlab\.com\/oauth\/discovery\/keys$/,
  },
  {
    name: 'CircleCI',
    issuer: /^https:\/\/oidc\.circleci\.com\/org\/[^/]+$/,
    jwksUrl: /^https:\/\/oidc\.circleci\.com\/org\/[^/]+\/\.well-known\/jwks-pub\.json$/,
  },
  {
    name: 'Bitbucket Pipelines',
    issuer:
      /^https:\/\/api\.bitbucket\.org\/2\.0\/workspaces\/[^/]+\/pipelines-config\/identity\/oidc$/,
    jwksUrl:
      /^https:\/\/api\.bitbucket\.org\/2\.0\/workspaces\/[^/]+\/pipelines-config\/identity\/oidc\/keys\.json$/,
  },
  {
    name: 'Buildkite',
    issuer: /^https:\/\/agent\.buildkite\.com$/,
    jwksUrl: /^https:\/\/agent\.buildkite\.com\/\.well-known\/jwks\.json$/,
  },
  {
    name: 'HCP Terraform',
    issuer: /^https:\/\/app\.terraform\.io$/,
    jwksUrl: /^https:\/\/app\.terraform\.io\/\.well-known\/jwks$/,
  },
  {
    name: 'Azure DevOps',
    issuer: /^https:\/\/vstoken\.dev\.azure\.com\/[^/]+$/,
    jwksUrl: /^https:\/\/vstoken\.dev\.azure\.com\/[^/]+\/\.well-known\/jwks$/,
  },
  {
    name: 'Bitrise',
    issuer: /^https:\/\/token\.builds\.bitrise\.io$/,
    jwksUrl: /^https:\/\/token\.builds\.bitrise\.io\/\.well-known\/jwks\.json$/,
  },
  {
    name: 'Codefresh',
    issuer: /^https:\/\/oidc\.codefresh\.io$/,
    jwksUrl: /^https:\/\/oidc\.codefresh\.io\/\.well-known\/jwks$/,
  },
  {
    name: 'Semaphore',
    issuer: /^https:\/\/[^/.]+\.semaphoreci\.com$/,
    jwksUrl: /^https:\/\/[^/.]+\.semaphoreci\.com\/\.well-known\/jwks\.json$/,
  },
  {
    name: 'Harness',
    issuer: /^https:\/\/app\.harness\.io\/ng\/api\/oidc\/account\/[^/]+$/,
    jwksUrl: /^https:\/\/app\.harness\.io\/ng\/api\/oidc\/account\/[^/]+\/\.well-known\/jwks$/,
  },
  {
    name: 'Spacelift',
    issuer: /^https:\/\/[^/.]+\.app\.spacelift\.io$/,
    jwksUrl: /^https:\/\/[^/.]+\.app\.spacelift\.io\/\.well-known\/jwks$/,
  },
]

/**
 * Reduces a URL to its origin and path, dropping whitespace, query, fragment, and trailing
 * slashes. The host and scheme are lowercased by the URL parser, the path keeps its case.
 */
const normalizeOidcUrl = (value?: string | null) => {
  if (!value) return undefined
  try {
    const { origin, pathname } = new URL(value.trim())
    return `${origin}${pathname}`.replace(/\/+$/, '')
  } catch {
    return undefined
  }
}

/**
 * Returns the names of CI/CD providers that match the given issuer URL or JWKS URL. An issuer
 * URL is matched against issuer patterns and a JWKS URL against JWKS patterns, and every
 * pattern is anchored, so lookalike hosts and extra path segments never match.
 */
export const findCiOidcProviders = ({
  issuerUrl,
  jwksUrl,
}: {
  issuerUrl?: string | null
  jwksUrl?: string | null
}): string[] => {
  const normalizedIssuer = normalizeOidcUrl(issuerUrl)
  const normalizedJwks = normalizeOidcUrl(jwksUrl)

  return CI_OIDC_PROVIDERS.filter(
    (provider) =>
      (normalizedIssuer !== undefined && provider.issuer.test(normalizedIssuer)) ||
      (normalizedJwks !== undefined && provider.jwksUrl.test(normalizedJwks))
  ).map(({ name }) => name)
}
