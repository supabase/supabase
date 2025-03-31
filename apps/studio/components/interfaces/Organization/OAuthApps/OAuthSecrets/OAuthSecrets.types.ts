import { components } from 'api-types'

export type Secret =
  components['schemas']['ListOAuthAppClientSecretsResponseDto']['client_secrets'][0] & {
    client_secret?: components['schemas']['CreateOAuthAppClientSecretResponseDto']['client_secret']
  }

export type CreatedSecret = components['schemas']['CreateOAuthAppClientSecretResponseDto']

export interface SecretRowProps {
  secret: Secret
  appId?: string
  isNew?: boolean
}
