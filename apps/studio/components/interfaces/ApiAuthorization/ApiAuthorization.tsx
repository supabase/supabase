import { ApiAuthorizationInvalidScreen } from './ApiAuthorization.Invalid'
import { ApiAuthorizationValidScreen } from './ApiAuthorization.Valid'

export interface ApiAuthorizationScreenProps {
  auth_id: string | undefined
  organization_slug: string | undefined
  navigate: (destination: string) => void
}

export function ApiAuthorizationScreen({
  auth_id,
  organization_slug,
  navigate,
}: ApiAuthorizationScreenProps) {
  const valid = !!auth_id
  if (!valid) {
    return <ApiAuthorizationInvalidScreen missingParameters={['auth_id']} />
  }

  return (
    <ApiAuthorizationValidScreen
      auth_id={auth_id}
      organization_slug={organization_slug}
      navigate={navigate}
    />
  )
}
