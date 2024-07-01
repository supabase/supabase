import { ThirdPartyAuthIntegration } from 'data/third-party-auth/integrations-query'
import { BASE_PATH } from 'lib/constants'

export const INTEGRATION_TYPES = ['firebase', 'auth0', 'awsCognito', 'custom'] as const
export type INTEGRATION_TYPES = (typeof INTEGRATION_TYPES)[number]

export const getIntegrationType = (integration?: ThirdPartyAuthIntegration): INTEGRATION_TYPES => {
  if (
    integration?.oidc_issuer_url &&
    integration?.oidc_issuer_url.startsWith('https://securetoken.google.com/')
  ) {
    return 'firebase'
  }
  if (integration?.oidc_issuer_url && integration?.oidc_issuer_url.includes('amazonaws.com')) {
    return 'awsCognito'
  }

  if (integration?.oidc_issuer_url && integration?.oidc_issuer_url.includes('auth0.com')) {
    return 'auth0'
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
      return 'AWS Cognito'
    case 'custom':
    default:
      return 'Custom'
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
    case 'custom':
    default:
      return `${BASE_PATH}/img/icons/cognito-icon.svg`
  }
}
