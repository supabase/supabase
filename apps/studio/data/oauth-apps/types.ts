export type OAuthScopeLevel = 'read' | 'write' | 'read_write'

export type OAuthScopeGroup = {
  name: string
  level: OAuthScopeLevel
  scopes: string[]
}

export type OAuthOrganizationRole = {
  slug: string
  name: string
  role: string
}
