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
  hasReadScope,
  hasWriteScope,
}: {
  description: string
  hasReadScope: boolean
  hasWriteScope: boolean
}) => {
  if (hasReadScope || hasWriteScope) {
    const perms = [hasReadScope ? 'Read' : null, hasWriteScope ? 'Write' : null]
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
            className="w-14 h-14 md:w-16 md:h-16 bg-center bg-no-repeat bg-cover flex items-center justify-center rounded-md border border-control"
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
            description="access to auth configurations and SSO providers."
            hasReadScope={scopes.includes(OAuthScope.AUTH_READ)}
            hasWriteScope={scopes.includes(OAuthScope.AUTH_WRITE)}
          />
          <ScopeSection
            description="access to Postgres configurations, SQL snippets, SSL enforcement configurations and Typescript schema types."
            hasReadScope={scopes.includes(OAuthScope.DATABASE_READ)}
            hasWriteScope={scopes.includes(OAuthScope.DATABASE_WRITE)}
          />
          <ScopeSection
            description="access to custom domains and vanity subdomains."
            hasReadScope={scopes.includes(OAuthScope.DOMAINS_READ)}
            hasWriteScope={scopes.includes(OAuthScope.DOMAINS_WRITE)}
          />
          <ScopeSection
            description="access to edge functions."
            hasReadScope={scopes.includes(OAuthScope.EDGE_FUNCTIONS_READ)}
            hasWriteScope={scopes.includes(OAuthScope.EDGE_FUNCTIONS_WRITE)}
          />
          <ScopeSection
            description="access to environments/branches."
            hasReadScope={scopes.includes(OAuthScope.ENVIRONMENT_READ)}
            hasWriteScope={scopes.includes(OAuthScope.ENVIRONMENT_WRITE)}
          />
          <ScopeSection
            description="access to the organization and all its members."
            hasReadScope={scopes.includes(OAuthScope.ORGANIZATIONS_READ)}
            hasWriteScope={scopes.includes(OAuthScope.ORGANIZATIONS_WRITE)}
          />
          <ScopeSection
            description="access to metadata, its upgrade status, network restrictions and network bans."
            hasReadScope={scopes.includes(OAuthScope.PROJECTS_READ)}
            hasWriteScope={scopes.includes(OAuthScope.PROJECTS_WRITE)}
          />
          <ScopeSection
            description="access to PostgREST configurations."
            hasReadScope={scopes.includes(OAuthScope.REST_READ)}
            hasWriteScope={scopes.includes(OAuthScope.REST_WRITE)}
          />
          <ScopeSection
            description="access to API keys, secrets and pgsodium configurations."
            hasReadScope={scopes.includes(OAuthScope.SECRETS_READ)}
            hasWriteScope={scopes.includes(OAuthScope.SECRETS_WRITE)}
          />
        </div>
      </div>
    </div>
  )
}

export default AuthorizeRequesterDetails
