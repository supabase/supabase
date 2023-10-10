import { OAuthScope } from '@supabase/shared-types/out/constants'
import { IconCheck } from 'ui'

export interface AuthorizeRequesterDetailsProps {
  icon: string | null
  name: string
  domain: string
  scopes: OAuthScope[]
}

const ScopeSection = ({
  description,
  readScope,
  writeScope,
  allScopes,
}: {
  description: string
  readScope: OAuthScope
  writeScope: OAuthScope
  allScopes: OAuthScope[]
}) => {
  const hasRead = allScopes.includes(readScope)
  const hasWrite = allScopes.includes(writeScope)

  if (hasRead || hasWrite) {
    const perms = [hasRead ? 'Read' : null, hasWrite ? 'Write' : null]
      .filter(Boolean)

      .map((str) => (
        <span key={str} className="font-semibold text-foreground">
          {str}
        </span>
      ))
      .reduce((acc, v) => (
        <>
          {acc}
          <span> and </span>
          {v}
        </>
      ))

    return (
      <div className="first:border-t border-b flex flex-row space-x-1 text-sm text-foreground-light py-2 px-1">
        <div className="pt-0.5">
          <IconCheck stroke="green" height={18} width={18} strokeWidth={1.5} />
        </div>
        <div>
          {perms} {description}
        </div>
      </div>
    )
  }
  return null
}

const AuthorizeRequesterDetails = ({
  icon,
  name,
  domain,
  scopes,
}: AuthorizeRequesterDetailsProps) => {
  return (
    <div className="flex space-y-4 flex-col">
      <div className="flex flex-row space-x-4">
        <div className="flex items-center">
          <div
            className="w-14 h-14 md:w-16 md:h-16 bg-center bg-no-repeat bg-cover flex items-center justify-center rounded-md border border-scale-600"
            style={{
              backgroundImage: icon !== null ? `url('${icon}')` : 'none',
            }}
          >
            {icon === null && <p className="text-foreground-light text-lg">{name[0]}</p>}
          </div>
        </div>
        <p className="text-sm text-foreground-light">
          {name} ({domain}) is requesting API access to an organization.
        </p>
      </div>
      <div>
        <h2>Permissions</h2>
        <p className="text-sm text-foreground-light">
          The following scopes will apply for the{' '}
          <span className="text-amber-900">selected organization and all of its projects.</span>
        </p>
        <div className="pt-2">
          <ScopeSection
            description="access to auth configurations and SSO providers"
            readScope={OAuthScope.AUTH_READ}
            writeScope={OAuthScope.AUTH_WRITE}
            allScopes={scopes}
          />
          <ScopeSection
            description="access to Postgres configurations, SQL snippets, SSL enforcement configurations and Typescript schema types."
            readScope={OAuthScope.DATABASE_READ}
            writeScope={OAuthScope.DATABASE_WRITE}
            allScopes={scopes}
          />
          <ScopeSection
            description="access to custom domains and vanity subdomains."
            readScope={OAuthScope.DOMAINS_READ}
            writeScope={OAuthScope.DOMAINS_WRITE}
            allScopes={scopes}
          />
          <ScopeSection
            description="access to edge functions."
            readScope={OAuthScope.EDGE_FUNCTIONS_READ}
            writeScope={OAuthScope.EDGE_FUNCTIONS_WRITE}
            allScopes={scopes}
          />
          <ScopeSection
            description="access to environments/branches."
            readScope={OAuthScope.ENVIRONMENT_READ}
            writeScope={OAuthScope.ENVIRONMENT_WRITE}
            allScopes={scopes}
          />
          <ScopeSection
            description="access to the organization and all its members."
            readScope={OAuthScope.ORGANIZATIONS_READ}
            writeScope={OAuthScope.ORGANIZATIONS_WRITE}
            allScopes={scopes}
          />
          <ScopeSection
            description="access to metadata, its upgrade status, network restrictions and network bans."
            readScope={OAuthScope.PROJECTS_READ}
            writeScope={OAuthScope.PROJECTS_WRITE}
            allScopes={scopes}
          />
          <ScopeSection
            description="access to PostgREST configurations."
            readScope={OAuthScope.REST_READ}
            writeScope={OAuthScope.REST_WRITE}
            allScopes={scopes}
          />
          <ScopeSection
            description="access to API keys, secrets and pgsodium configurations."
            readScope={OAuthScope.SECRETS_READ}
            writeScope={OAuthScope.SECRETS_WRITE}
            allScopes={scopes}
          />
        </div>
      </div>
    </div>
  )
}

export default AuthorizeRequesterDetails
