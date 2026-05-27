import { ApiAuthorizationInvalidScreen } from './ApiAuthorization.Invalid'
import { ApiAuthorizationValidScreen } from './ApiAuthorization.Valid'

export interface ApiAuthorizationScreenProps {
  auth_id: string | undefined
  organization_slug: string | undefined
  navigate: (destination: string) => void
  mock?: ApiAuthorizationMockState
}

export function ApiAuthorizationScreen({
  auth_id,
  organization_slug,
  navigate,
  mock,
}: ApiAuthorizationScreenProps) {
  const valid = !!auth_id || !!mock
  if (!valid) {
    return <ApiAuthorizationInvalidScreen missingParameters={['auth_id']} />
  }

  return (
    <ApiAuthorizationValidScreen
      auth_id={auth_id ?? 'mock-auth-id'}
      organization_slug={organization_slug}
      navigate={navigate}
      mock={mock}
    />
  )
}

export const API_AUTHORIZATION_MOCK_STATES = [
  'loading',
  'ready',
  'mcp',
  'approving',
  'approved',
  'expired',
  'organizations-loading',
  'organizations-error',
  'empty',
  'not-member',
  'error',
] as const

export type ApiAuthorizationMockState = (typeof API_AUTHORIZATION_MOCK_STATES)[number]

export const getApiAuthorizationMockState = (
  value: unknown
): ApiAuthorizationMockState | undefined => {
  return typeof value === 'string' &&
    API_AUTHORIZATION_MOCK_STATES.includes(value as ApiAuthorizationMockState)
    ? (value as ApiAuthorizationMockState)
    : undefined
}
