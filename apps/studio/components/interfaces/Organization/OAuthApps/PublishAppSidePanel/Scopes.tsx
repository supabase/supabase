import { OAuthScope } from '@supabase/shared-types/out/constants'
import type { Dispatch, SetStateAction } from 'react'

import { PERMISSIONS_DESCRIPTIONS } from '../OAuthApps.constants'
import { AccessLevelDropdown, type AccessLevel } from './AccessLevelDropdown'

const accessLevels: AccessLevel[] = ['No access', 'Read only', 'Write', 'Read and write']

const Scope = ({
  title,
  description,
  readScopeName,
  writeScopeName,
  scopes,
  setScopes,
}: {
  title: string
  description: string
  readScopeName: OAuthScope
  writeScopeName: OAuthScope
  scopes: OAuthScope[]
  setScopes: Dispatch<SetStateAction<OAuthScope[]>>
}) => {
  const hasRead = scopes.includes(readScopeName)
  const hasWrite = scopes.includes(writeScopeName)
  let accessLevel: AccessLevel = 'No access'
  if (hasRead) accessLevel = 'Read only'
  if (hasWrite) accessLevel = hasRead ? 'Read and write' : 'Write'

  const handleAccessChange = (level: AccessLevel) => {
    setScopes((current) => {
      const next = current.filter((scope) => scope !== readScopeName && scope !== writeScopeName)
      if (level === 'Read only' || level === 'Read and write') next.push(readScopeName)
      if (level === 'Write' || level === 'Read and write') next.push(writeScopeName)
      return next
    })
  }

  return (
    <div
      className="grid grid-cols-1 items-start gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_10rem]"
      key={title}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <span className="text-sm font-medium text-foreground">{title}</span>
        <span className="text-sm text-foreground-lighter capitalize-sentence">{description}</span>
      </div>
      <AccessLevelDropdown
        permission={title}
        levels={accessLevels}
        value={accessLevel}
        onChange={handleAccessChange}
      />
    </div>
  )
}

export const ScopesPanel = ({
  scopes,
  setScopes,
}: {
  scopes: OAuthScope[]
  setScopes: Dispatch<SetStateAction<OAuthScope[]>>
}) => {
  return (
    <div className="divide-y divide-default rounded-md border border-default">
      <Scope
        title="Analytics"
        description={PERMISSIONS_DESCRIPTIONS.ANALYTICS}
        readScopeName={OAuthScope.ANALYTICS_READ}
        writeScopeName={OAuthScope.ANALYTICS_WRITE}
        scopes={scopes}
        setScopes={setScopes}
      />
      <Scope
        title="Analytics Config"
        description={PERMISSIONS_DESCRIPTIONS.ANALYTICS_CONFIG}
        readScopeName={OAuthScope.ANALYTICS_CONFIG_READ}
        writeScopeName={OAuthScope.ANALYTICS_CONFIG_WRITE}
        scopes={scopes}
        setScopes={setScopes}
      />
      <Scope
        title="Auth"
        description={PERMISSIONS_DESCRIPTIONS.AUTH}
        readScopeName={OAuthScope.AUTH_READ}
        writeScopeName={OAuthScope.AUTH_WRITE}
        scopes={scopes}
        setScopes={setScopes}
      />
      <Scope
        title="Database"
        description={PERMISSIONS_DESCRIPTIONS.DATABASE}
        readScopeName={OAuthScope.DATABASE_READ}
        writeScopeName={OAuthScope.DATABASE_WRITE}
        scopes={scopes}
        setScopes={setScopes}
      />
      <Scope
        title="Domains"
        description={PERMISSIONS_DESCRIPTIONS.DOMAINS}
        readScopeName={OAuthScope.DOMAINS_READ}
        writeScopeName={OAuthScope.DOMAINS_WRITE}
        scopes={scopes}
        setScopes={setScopes}
      />
      <Scope
        title="Edge Functions"
        description={PERMISSIONS_DESCRIPTIONS.EDGE_FUNCTIONS}
        readScopeName={OAuthScope.EDGE_FUNCTIONS_READ}
        writeScopeName={OAuthScope.EDGE_FUNCTIONS_WRITE}
        scopes={scopes}
        setScopes={setScopes}
      />
      <Scope
        title="Environment"
        description={PERMISSIONS_DESCRIPTIONS.ENVIRONMENT}
        readScopeName={OAuthScope.ENVIRONMENT_READ}
        writeScopeName={OAuthScope.ENVIRONMENT_WRITE}
        scopes={scopes}
        setScopes={setScopes}
      />
      <Scope
        title="Organizations"
        description={PERMISSIONS_DESCRIPTIONS.ORGANIZATIONS}
        readScopeName={OAuthScope.ORGANIZATIONS_READ}
        writeScopeName={OAuthScope.ORGANIZATIONS_WRITE}
        scopes={scopes}
        setScopes={setScopes}
      />
      <Scope
        title="Projects"
        description={PERMISSIONS_DESCRIPTIONS.PROJECTS}
        readScopeName={OAuthScope.PROJECTS_READ}
        writeScopeName={OAuthScope.PROJECTS_WRITE}
        scopes={scopes}
        setScopes={setScopes}
      />
      <Scope
        title="REST"
        description={PERMISSIONS_DESCRIPTIONS.REST}
        readScopeName={OAuthScope.REST_READ}
        writeScopeName={OAuthScope.REST_WRITE}
        scopes={scopes}
        setScopes={setScopes}
      />
      <Scope
        title="Secrets"
        description={PERMISSIONS_DESCRIPTIONS.SECRETS}
        readScopeName={OAuthScope.SECRETS_READ}
        writeScopeName={OAuthScope.SECRETS_WRITE}
        scopes={scopes}
        setScopes={setScopes}
      />
      <Scope
        title="Storage"
        description={PERMISSIONS_DESCRIPTIONS.STORAGE}
        readScopeName={OAuthScope.STORAGE_READ}
        writeScopeName={OAuthScope.STORAGE_WRITE}
        scopes={scopes}
        setScopes={setScopes}
      />
    </div>
  )
}
