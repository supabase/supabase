import { OAuthScope } from '@supabase/shared-types/out/constants'
import { Check, ChevronDown } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useMemo, useState } from 'react'
import {
  Badge,
  Card,
  CardContent,
  cn,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from 'ui'
import { InfoTooltip } from 'ui-patterns/info-tooltip'
import { getMcpClientIconSrc } from 'ui-patterns/McpUrlBuilder'

import { PERMISSIONS_DESCRIPTIONS } from './OAuthApps.constants'
import { LogoBox } from '@/components/layouts/InterstitialLayout'
import { InlineLink } from '@/components/ui/InlineLink'
import { DOCS_URL } from '@/lib/constants'

const OAUTH_SCOPES_DOCS_URL = `${DOCS_URL}/guides/platform/oauth-apps/oauth-scopes`
const PERMISSION_DETAILS_TRIGGER_CLASSNAME =
  'mx-auto flex h-7 cursor-pointer items-center justify-center gap-1.5 rounded-md px-2 text-xs text-foreground-lighter transition-colors hover:bg-surface-200 hover:text-foreground'

export interface AuthorizeRequesterDetailsProps {
  icon: string | null
  name: string
  domain: string
  scopes: OAuthScope[]
  showOnlyScopes?: boolean
}

export const ScopeSection = ({
  description,
  hasReadScope,
  hasWriteScope,
}: {
  description: string
  hasReadScope: boolean
  hasWriteScope: boolean
}) => {
  if (!hasReadScope && !hasWriteScope) return null

  const permissions = [hasReadScope ? 'Read' : null, hasWriteScope ? 'Write' : null]
    .filter(Boolean)
    .join(' and ')

  return (
    <div className="first:border-t border-b flex flex-row space-x-1 text-sm text-foreground-light py-2 px-1">
      <div className="pt-0.5">
        <Check className="size-4 text-brand" strokeWidth={1.5} />
      </div>
      <div>
        <span className="font-semibold text-foreground">{permissions}</span> {description}
      </div>
    </div>
  )
}

type PermissionLevel = 'read' | 'write' | 'read-write'

type PermissionItem = {
  label: string
  description: string
  read?: OAuthScope
  write?: OAuthScope
}

type PermissionGroup = {
  label: string
  items: PermissionItem[]
}

const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    label: 'Data & authentication',
    items: [
      {
        label: 'Database',
        description: PERMISSIONS_DESCRIPTIONS.DATABASE,
        read: OAuthScope.DATABASE_READ,
        write: OAuthScope.DATABASE_WRITE,
      },
      {
        label: 'Secrets',
        description: PERMISSIONS_DESCRIPTIONS.SECRETS,
        read: OAuthScope.SECRETS_READ,
        write: OAuthScope.SECRETS_WRITE,
      },
      {
        label: 'Auth',
        description: PERMISSIONS_DESCRIPTIONS.AUTH,
        read: OAuthScope.AUTH_READ,
        write: OAuthScope.AUTH_WRITE,
      },
    ],
  },
  {
    label: 'Code execution',
    items: [
      {
        label: 'Edge Functions',
        description: PERMISSIONS_DESCRIPTIONS.EDGE_FUNCTIONS,
        read: OAuthScope.EDGE_FUNCTIONS_READ,
        write: OAuthScope.EDGE_FUNCTIONS_WRITE,
      },
    ],
  },
  {
    label: 'Platform management',
    items: [
      {
        label: 'Environment',
        description: PERMISSIONS_DESCRIPTIONS.ENVIRONMENT,
        read: OAuthScope.ENVIRONMENT_READ,
        write: OAuthScope.ENVIRONMENT_WRITE,
      },
      {
        label: 'Organizations',
        description: PERMISSIONS_DESCRIPTIONS.ORGANIZATIONS,
        read: OAuthScope.ORGANIZATIONS_READ,
        write: OAuthScope.ORGANIZATIONS_WRITE,
      },
      {
        label: 'Projects',
        description: PERMISSIONS_DESCRIPTIONS.PROJECTS,
        read: OAuthScope.PROJECTS_READ,
        write: OAuthScope.PROJECTS_WRITE,
      },
      {
        label: 'Domains',
        description: PERMISSIONS_DESCRIPTIONS.DOMAINS,
        read: OAuthScope.DOMAINS_READ,
        write: OAuthScope.DOMAINS_WRITE,
      },
      {
        label: 'PostgREST',
        description: PERMISSIONS_DESCRIPTIONS.REST,
        read: OAuthScope.REST_READ,
        write: OAuthScope.REST_WRITE,
      },
    ],
  },
  {
    label: 'Files & monitoring',
    items: [
      {
        label: 'Analytics',
        description: PERMISSIONS_DESCRIPTIONS.ANALYTICS,
        read: OAuthScope.ANALYTICS_READ,
        write: OAuthScope.ANALYTICS_WRITE,
      },
      {
        label: 'Analytics configuration',
        description: PERMISSIONS_DESCRIPTIONS.ANALYTICS_CONFIG,
        read: OAuthScope.ANALYTICS_CONFIG_READ,
        write: OAuthScope.ANALYTICS_CONFIG_WRITE,
      },
      {
        label: 'Storage',
        description: PERMISSIONS_DESCRIPTIONS.STORAGE,
        read: OAuthScope.STORAGE_READ,
        write: OAuthScope.STORAGE_WRITE,
      },
    ],
  },
]

const CUSTOM_LOGO_KEYS = {
  perplexity: { icon: 'perplexity', hasDistinctDarkIcon: true },
  cursor: { icon: 'cursor', hasDistinctDarkIcon: true },
  claude: { icon: 'claude', hasDistinctDarkIcon: false },
  chatgpt: { icon: 'openai', hasDistinctDarkIcon: true },
  openai: { icon: 'openai', hasDistinctDarkIcon: true },
} as const

function getRequesterLogo({
  icon,
  name,
  useDarkVariant,
}: {
  icon: string | null
  name: string
  useDarkVariant: boolean
}) {
  const searchableText = `${icon ?? ''} ${name}`.toLowerCase()

  for (const [match, asset] of Object.entries(CUSTOM_LOGO_KEYS)) {
    if (searchableText.includes(match)) {
      const customLogoUrl = getMcpClientIconSrc({
        icon: asset.icon,
        useDarkVariant,
        hasDistinctDarkIcon: asset.hasDistinctDarkIcon,
      })

      if (customLogoUrl) return { src: customLogoUrl, isKnownClient: true }
    }
  }

  return { src: icon || '', isKnownClient: false }
}

export const RequesterLogo = ({ icon, name }: { icon: string | null; name: string }) => {
  const [failedIcon, setFailedIcon] = useState<string | null>(null)
  const { resolvedTheme } = useTheme()

  const logo = useMemo(
    () => getRequesterLogo({ icon, name, useDarkVariant: resolvedTheme === 'dark' }),
    [icon, name, resolvedTheme]
  )

  const showLetter = !logo.src || failedIcon === logo.src

  return (
    <LogoBox className="bg-surface-75">
      {showLetter ? (
        <span className="text-lg font-medium text-foreground-light">{name.slice(0, 1)}</span>
      ) : (
        <img
          alt={name}
          src={logo.src}
          className={cn(logo.isKnownClient ? 'size-7 object-contain' : 'size-full object-cover')}
          onError={() => setFailedIcon(logo.src)}
        />
      )}
    </LogoBox>
  )
}

export const AuthorizeRequesterDetails = ({
  name,
  scopes,
  showOnlyScopes = false,
}: AuthorizeRequesterDetailsProps) => {
  const [showDetails, setShowDetails] = useState(showOnlyScopes)
  const requestedPermissions = useMemo(() => getRequestedPermissions(scopes), [scopes])
  const writablePermissions = requestedPermissions.filter(({ level }) => level !== 'read')
  const readOnlyPermissions = requestedPermissions.filter(({ level }) => level === 'read')

  return (
    <section className="flex flex-col">
      {requestedPermissions.length === 0 ? (
        <Card className="shadow-none">
          <CardContent className="border-none px-4 py-3 text-sm text-foreground-lighter">
            No permissions requested.
          </CardContent>
        </Card>
      ) : (
        <>
          {!showOnlyScopes && (
            <>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-foreground-light">
                  Permissions
                </p>
                <p className="mt-1 text-xs text-foreground-lighter">
                  Authorizing {name} grants it the following{' '}
                  <InlineLink href={OAUTH_SCOPES_DOCS_URL}>access permissions</InlineLink> to the
                  selected organization. Only continue if you trust this app.
                </p>
              </div>

              <Card className="overflow-hidden shadow-none bg-surface-200/60 border-muted mt-3">
                <CardContent className="border-none p-0">
                  <div className="divide-y divide-muted px-4">
                    {writablePermissions.length > 0 && (
                      <PermissionSummaryRow permissions={writablePermissions} level="read-write" />
                    )}
                    {readOnlyPermissions.length > 0 && (
                      <PermissionSummaryRow permissions={readOnlyPermissions} level="read" />
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          <Collapsible open={showDetails} onOpenChange={setShowDetails} className="mt-2 space-y-2">
            <CollapsibleTrigger className={PERMISSION_DETAILS_TRIGGER_CLASSNAME}>
              <span>{showDetails ? 'Hide detailed permissions' : 'Show detailed permissions'}</span>
              <ChevronDown
                className={cn('size-3.5 transition-transform', showDetails && 'rotate-180')}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="data-closed:animate-collapsible-up data-open:animate-collapsible-down overflow-hidden">
              <PermissionDetails requestedPermissions={requestedPermissions} />
            </CollapsibleContent>
          </Collapsible>
        </>
      )}
    </section>
  )
}

function PermissionSummaryRow({
  permissions,
  level,
}: {
  permissions: Array<RequestedPermission>
  level: PermissionLevel
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 text-sm">
      <p className="min-w-0 leading-tight">
        <span className="text-foreground">{permissions.map(({ label }) => label).join(', ')}</span>
      </p>
      <Badge variant={getPermissionLevelBadgeVariant(level)} className="shrink-0">
        {formatPermissionLevel(level)}
      </Badge>
    </div>
  )
}

function PermissionDetails({
  requestedPermissions,
}: {
  requestedPermissions: Array<RequestedPermission>
}) {
  const requestedByLabel = new Map(
    requestedPermissions.map((permission) => [permission.label, permission])
  )

  return (
    <Card className="overflow-hidden shadow-none bg-surface-200/60 border-muted">
      <CardContent className="border-none p-0">
        {PERMISSION_GROUPS.map((group) => {
          const groupPermissions = group.items
            .map((item) => requestedByLabel.get(item.label))
            .filter(Boolean) as RequestedPermission[]

          if (groupPermissions.length === 0) return null

          return (
            <div key={group.label} className="border-b border-muted last:border-b-0 px-4 py-3">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-foreground-lighter">
                {group.label}
              </p>
              <div className="divide-y divide-muted">
                {groupPermissions.map((permission) => (
                  <div
                    key={permission.label}
                    className="flex items-center justify-between gap-3 py-2"
                  >
                    <div className="flex min-w-0 items-center gap-1.5">
                      <p className="truncate text-sm text-foreground">{permission.label}</p>
                      <InfoTooltip side="right" className="max-w-64 text-xs">
                        {formatPermissionDescription(permission.description)}
                      </InfoTooltip>
                    </div>
                    <Badge variant={getPermissionLevelBadgeVariant(permission.level)}>
                      {formatPermissionLevel(permission.level)}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

type RequestedPermission = PermissionItem & {
  level: PermissionLevel
}

function getRequestedPermissions(scopes: OAuthScope[]): RequestedPermission[] {
  return PERMISSION_GROUPS.flatMap((group) =>
    group.items.flatMap((item) => {
      const hasReadScope = !!item.read && scopes.includes(item.read)
      const hasWriteScope = !!item.write && scopes.includes(item.write)

      if (!hasReadScope && !hasWriteScope) return []

      return {
        ...item,
        level: hasReadScope && hasWriteScope ? 'read-write' : hasWriteScope ? 'write' : 'read',
      }
    })
  )
}

function formatPermissionLevel(level: PermissionLevel) {
  if (level === 'read') return 'Read'
  if (level === 'write') return 'Write'
  return 'Read + Write'
}

function formatPermissionDescription(description: string) {
  return description.charAt(0).toUpperCase() + description.slice(1)
}

function getPermissionLevelBadgeVariant(level: PermissionLevel) {
  return level === 'read' ? 'default' : 'warning'
}
