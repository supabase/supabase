export interface CreateCustomProviderParams {
  provider_type: 'oauth2' | 'oidc'
  identifier: string
  name: string
  client_id: string
  client_secret: string
  acceptable_client_ids?: string[]
  scopes?: string[]
  pkce_enabled?: boolean
  attribute_mapping?: Record<string, any>
  authorization_params?: Record<string, any>
  enabled?: boolean
  email_optional?: boolean
  // OIDC specific
  issuer?: string
  discovery_url?: string
  skip_nonce_check?: boolean
  // OAuth2 specific
  authorization_url?: string
  token_url?: string
  userinfo_url?: string
  jwks_uri?: string
}

export interface UpdateCustomProviderParams {
  name?: string
  client_id?: string
  client_secret?: string
  acceptable_client_ids?: string[]
  scopes?: string[]
  pkce_enabled?: boolean
  attribute_mapping?: Record<string, any>
  authorization_params?: Record<string, any>
  enabled?: boolean
  email_optional?: boolean
  issuer?: string
  discovery_url?: string
  skip_nonce_check?: boolean
  authorization_url?: string
  token_url?: string
  userinfo_url?: string
  jwks_uri?: string
}
