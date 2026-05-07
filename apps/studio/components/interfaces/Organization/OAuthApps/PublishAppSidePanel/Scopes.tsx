import { OAuthScope } from '@supabase/shared-types/out/constants'
import { ChevronDown } from 'lucide-react'
import { Dispatch, PropsWithChildren, SetStateAction } from 'react'

import {
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'ui'
import { PERMISSIONS_DESCRIPTIONS } from '../OAuthApps.constants'

const ScopeDropdownCheckboxItem = ({
  children,
  scopeName,
  scopes,
  onChange,
}: PropsWithChildren<{
  scopeName: OAuthScope
  scopes: OAuthScope[]
  onChange: (v: OAuthScope[]) => void
}>) => {
  return (
    <DropdownMenuCheckboxItem
      checked={scopes.includes(scopeName)}
      onCheckedChange={(checked) => {
        if (checked) {
          onChange([...scopes, scopeName])
        } else {
          onChange([...scopes.filter((s) => s !== scopeName)])
        }
      }}
    >
      {children}
    </DropdownMenuCheckboxItem>
  )
}

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
  let accessDescription = 'Access: No access'
  if (scopes.includes(readScopeName)) {
    accessDescription = 'Access: Read-only'
  }
  if (scopes.includes(writeScopeName)) {
    accessDescription = 'Access: Write-only'
  }
  if (scopes.includes(readScopeName) && scopes.includes(writeScopeName)) {
    accessDescription = 'Access: Read and write'
  }

  return (
    <div
      className="flex flex-row justify-between p-4 border first:rounded-t last:rounded-b gap-x-2"
      key={title}
    >
      <div className="flex flex-col">
        <span className="text-foreground text-sm">{title}</span>
        <span className="text-foreground-light text-xs capitalize-sentence">{description}</span>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="default" iconRight={<ChevronDown />}>
            <p>{accessDescription}</p>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuLabel>Select an access level</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <ScopeDropdownCheckboxItem scopeName={readScopeName} scopes={scopes} onChange={setScopes}>
            Read
          </ScopeDropdownCheckboxItem>
          <ScopeDropdownCheckboxItem
            scopeName={writeScopeName}
            scopes={scopes}
            onChange={setScopes}
          >
            Write
          </ScopeDropdownCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
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
    <div className="-space-y-px">
      <Scope
        title="Analytics"
        description={PERMISSIONS_DESCRIPTIONS.ANALYTICS}
        readScopeName={OAuthScope.ANALYTICS_READ}
        writeScopeName={OAuthScope.ANALYTICS_WRITE}
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
