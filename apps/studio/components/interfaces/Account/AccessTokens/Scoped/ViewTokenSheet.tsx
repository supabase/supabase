import dayjs from 'dayjs'
import { useMemo } from 'react'
import { Badge, cn, ScrollArea, Sheet, SheetContent, SheetHeader } from 'ui'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'

import {
  computeOverallRisk,
  PERMISSION_CATALOG_BY_CATEGORY,
  scopesToSelection,
  type OverallRisk,
  type PermissionCatalogEntry,
  type PermissionMode,
  type ResourceAccessMode,
  type RiskLevel,
} from '../AccessToken.permissions'
import { useOrgAndProjectData } from '../hooks/useOrgAndProjectData'
import { DocsButton } from '@/components/ui/DocsButton'
import {
  getEnabledEndpointsForCapability,
  getEnabledMcpTools,
  useGetEnabledEndpointsForCapability,
} from '@/data/scoped-access-tokens/permission-scope-map-query'
import { useScopedAccessTokenQuery } from '@/data/scoped-access-tokens/scoped-access-token-query'
import { DOCS_URL } from '@/lib/constants'

interface ViewTokenSheetProps {
  visible: boolean
  tokenId: string | undefined
  onClose: () => void
}

const RISK_TONE_VARIANT: Record<
  OverallRisk['tone'],
  'default' | 'success' | 'warning' | 'destructive'
> = {
  default: 'default',
  low: 'success',
  medium: 'warning',
  high: 'destructive',
}

const RISK_DOT_CLASS: Record<RiskLevel, string> = {
  low: 'bg-brand-600',
  medium: 'bg-warning-600',
  high: 'bg-destructive-600',
}

const modeLabel = (mode: PermissionMode) =>
  mode === 'readwrite' ? 'Read-write' : mode === 'read' ? 'Read' : 'None'

const SCOPE_TO_RESOURCE_ACCESS: Record<'user' | 'organization' | 'project', ResourceAccessMode> = {
  user: 'account',
  organization: 'organization',
  project: 'project',
}

export function ViewTokenSheet({ visible, tokenId, onClose }: ViewTokenSheetProps) {
  const { organizations, projects } = useOrgAndProjectData()
  const { data: permissionScopeMap } = useGetEnabledEndpointsForCapability()

  const {
    data: token,
    isLoading: isTokenLoading,
    error: tokenError,
  } = useScopedAccessTokenQuery(
    { id: tokenId! },
    {
      enabled: visible && !!tokenId,
      retry: 1,
      retryDelay: 1000,
    }
  )

  const resourceAccess = token ? SCOPE_TO_RESOURCE_ACCESS[token.scope] : 'project'
  const grantedScopes = useMemo(() => token?.permissions ?? [], [token?.permissions])

  const selection = useMemo(() => scopesToSelection(grantedScopes), [grantedScopes])

  const risk = useMemo(
    () => computeOverallRisk(selection, resourceAccess),
    [selection, resourceAccess]
  )

  const activeByCategory = useMemo(
    () =>
      PERMISSION_CATALOG_BY_CATEGORY.map((category) => ({
        ...category,
        entries: category.entries
          .map((entry) => ({ entry, mode: selection[entry.key] ?? 'none' }))
          .filter(({ mode }) => mode !== 'none'),
      })).filter((category) => category.entries.length > 0),
    [selection]
  )
  const hasCapabilities = grantedScopes.length > 0

  const mcpTools = useMemo(
    () => getEnabledMcpTools({ grantedScopes, permissionScopeMap }),
    [grantedScopes, permissionScopeMap]
  )

  const capabilityGroups = useMemo(() => {
    const groups: { entry: PermissionCatalogEntry; mode: PermissionMode; endpoints: string[][] }[] =
      []
    for (const category of activeByCategory) {
      for (const { entry, mode } of category.entries) {
        const capabilityScopes =
          mode === 'readwrite' ? [...entry.readScopes, ...entry.writeScopes] : entry.readScopes
        const endpoints = getEnabledEndpointsForCapability({
          capabilityScopes,
          allGrantedScopes: grantedScopes,
          permissionScopeMap,
        })
        if (endpoints.length > 0) {
          groups.push({ entry, mode, endpoints: endpoints.map((e) => [e.method, e.path]) })
        }
      }
    }
    return groups
  }, [activeByCategory, grantedScopes, permissionScopeMap])

  const resourceSummary = useMemo(() => {
    if (resourceAccess === 'project') {
      const selectedProjects = projects.filter((p) => (token?.project_refs ?? []).includes(p.ref))
      return {
        title: 'Project',
        items: selectedProjects.length > 0 ? selectedProjects.map((p) => p.name) : ['-'],
      }
    }
    if (resourceAccess === 'organization') {
      const selectedOrganizations = organizations.filter((o) =>
        (token?.organization_slugs ?? []).includes(o.slug)
      )
      return {
        title: 'Organization',
        items: selectedOrganizations.length > 0 ? selectedOrganizations.map((o) => o.name) : ['-'],
      }
    }
    return { title: 'Account', items: ['Account-level access'] }
  }, [resourceAccess, token, projects, organizations])

  const rows: [string, React.ReactNode][] = token
    ? [
        [
          'Created',
          token.created_at ? (
            <TimestampInfo
              utcTimestamp={token.created_at}
              label={dayjs(token.created_at).format('DD MMM YYYY')}
              className="text-sm"
            />
          ) : (
            <span className="text-foreground-lighter">Unknown</span>
          ),
        ],
        [
          'Last used',
          token.last_used_at ? (
            <TimestampInfo
              utcTimestamp={token.last_used_at}
              label={dayjs(token.last_used_at).fromNow()}
              className="text-sm"
            />
          ) : (
            <span className="text-foreground-lighter">Never</span>
          ),
        ],
        [
          'Expires',
          token.expires_at ? (
            <TimestampInfo
              utcTimestamp={token.expires_at}
              label={dayjs(token.expires_at).format('DD MMM YYYY')}
              className="text-sm"
            />
          ) : (
            <span className="text-foreground-lighter">Never</span>
          ),
        ],
        [
          'Resource access',
          <div key="resource-access" className="space-y-2">
            <p className="text-[11px] font-mono uppercase tracking-wide text-foreground-lighter">
              {resourceSummary.title}
            </p>
            <div className="divide-y">
              {resourceSummary.items.map((item) => (
                <p key={item} className="py-2 text-sm text-foreground">
                  {item}
                </p>
              ))}
            </div>
          </div>,
        ],
        [
          'Capabilities',
          hasCapabilities ? (
            <div className="space-y-4">
              {activeByCategory.map((category) => (
                <div key={category.key} className="space-y-2">
                  <p className="text-[11px] font-mono uppercase tracking-wide text-foreground-lighter">
                    {category.name}
                  </p>
                  <div className="divide-y">
                    {category.entries.map(({ entry, mode }) => (
                      <div
                        key={entry.key}
                        className="flex items-center justify-between gap-2 text-sm py-2"
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className={cn(
                              'h-1.5 w-1.5 shrink-0 rounded-full',
                              RISK_DOT_CLASS[entry.risk]
                            )}
                          />
                          <span className="text-foreground text-wrap">{entry.name}</span>
                        </span>
                        <span className="text-foreground-lighter text-xs font-mono uppercase font-normal text-right">
                          {modeLabel(mode)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <span className="text-foreground-lighter">No capabilities selected</span>
          ),
        ],
        [
          'Risk level',
          <span key="risk" className="flex flex-wrap items-center gap-2">
            <span className="flex">
              <Badge variant={RISK_TONE_VARIANT[risk.tone]}>{risk.level} Risk</Badge>
            </span>
            <span className="text-sm text-foreground leading-px">
              {risk.text.replace(`${risk.level} — `, '')}
            </span>
          </span>,
        ],
      ]
    : []

  return (
    <Sheet open={visible} onOpenChange={() => onClose()}>
      <SheetContent
        showClose={false}
        size="default"
        className="flex h-full flex-col gap-0 sm:w-[656px] lg:w-[800px]"
      >
        <SheetHeader className={cn('flex flex-row justify-between gap-x-4 items-center border-b')}>
          <p className="truncate" title={`View access for ${token?.name}`}>
            View access for {token?.name}
          </p>
          <DocsButton href={`${DOCS_URL}/reference/api/introduction`} />
        </SheetHeader>
        <ScrollArea className="flex-1">
          <div className="space-y-6 px-5 sm:px-6 py-6">
            {isTokenLoading && (
              <div className="flex items-center justify-center py-8">
                <p className="text-foreground-light">Loading token information...</p>
              </div>
            )}

            {tokenError && (
              <div className="flex items-center justify-center py-8">
                <p className="text-destructive">
                  Error loading token information. Please try again.
                </p>
              </div>
            )}

            {token && (
              <>
                <div className="flex flex-col gap-3">
                  <h3 className="text-sm">Token summary</h3>
                  <dl className="divide-y rounded-md border bg-surface-300">
                    {rows.map(([key, value]) => (
                      <div key={key} className="grid grid-cols-3 gap-4 px-4 py-3">
                        <dt className="text-sm text-foreground-lighter">{key}</dt>
                        <dd className="col-span-2 text-sm text-foreground">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>

                {hasCapabilities && (
                  <>
                    <div className="flex flex-col gap-3">
                      <h3 className="text-sm">Management API endpoints enabled</h3>
                      {capabilityGroups.length === 0 ? (
                        <p className="text-xs text-foreground-light">
                          No Management API endpoints are enabled by the selected capabilities.
                        </p>
                      ) : (
                        capabilityGroups.map(({ entry, mode, endpoints }) => (
                          <div key={entry.key} className="rounded-md border">
                            <div className="flex items-center justify-between border-b bg-surface-100 px-3 py-2">
                              <span className="text-xs text-foreground">{entry.name}</span>
                              <span className="text-[11px] font-mono uppercase text-foreground-lighter">
                                {mode === 'readwrite' ? 'Read-write' : 'Read'}
                              </span>
                            </div>
                            <div className="divide-y">
                              {endpoints.map(([method, path]) => (
                                <div
                                  key={`${method} ${path}`}
                                  className="flex items-center gap-2 px-3 py-1.5 font-mono text-xs"
                                >
                                  <span className="w-14 shrink-0 text-foreground-light">
                                    {method}
                                  </span>
                                  <span className="text-foreground">{path}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="flex flex-col gap-3">
                      <h3 className="text-sm">MCP tools</h3>
                      {mcpTools.length === 0 ? (
                        <p className="text-xs text-foreground-light">
                          No MCP tools are enabled by the selected capabilities.
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {mcpTools.map((tool) => (
                            <span
                              key={tool}
                              className="rounded border bg-surface-100 px-2 py-1 font-mono text-xs text-foreground-light"
                            >
                              {tool}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
