import dayjs from 'dayjs'
import { useMemo } from 'react'
import { cn, ScrollArea, Sheet, SheetContent, SheetHeader } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'

import { TOKEN_DENIED_REMEDIATION } from '../AccessToken.constants'
import {
  computeOverallRisk,
  PERMISSION_MODE_LABEL,
  scopesToSelection,
  type ResourceAccessMode,
} from '../AccessToken.permissions'
import { useCapabilitySummary } from '../hooks/useCapabilitySummary'
import { useOrgAndProjectData } from '../hooks/useOrgAndProjectData'
import { useTokenAccessEvaluation } from '../hooks/useTokenAccessEvaluation'
import { CapabilityCategoryList, ResourceSummaryItem, RiskLevelSummary } from './TokenSummaryRows'
import { DocsButton } from '@/components/ui/DocsButton'
import { useGetEnabledEndpointsForCapability } from '@/data/scoped-access-tokens/permission-scope-map-query'
import { useScopedAccessTokenQuery } from '@/data/scoped-access-tokens/scoped-access-token-query'
import { DOCS_URL } from '@/lib/constants'
import { pluralize } from '@/lib/helpers'

interface ViewTokenSheetProps {
  visible: boolean
  tokenId: string | undefined
  onClose: () => void
}

const SCOPE_TO_RESOURCE_ACCESS: Record<'user' | 'organization' | 'project', ResourceAccessMode> = {
  user: 'account',
  organization: 'organization',
  project: 'project',
}

const EMPTY_BINDINGS: string[] = []

export function ViewTokenSheet({ visible, tokenId, onClose }: ViewTokenSheetProps) {
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

  // The sheet stays mounted (hidden) on the tokens page; don't fetch org/project data until it's
  // actually opened on a token.
  const { organizations, projects } = useOrgAndProjectData({ enabled: visible && !!token })

  const resourceAccess = token ? SCOPE_TO_RESOURCE_ACCESS[token.scope] : 'project'
  const grantedScopes = useMemo(() => token?.permissions ?? [], [token?.permissions])

  const selection = useMemo(() => scopesToSelection(grantedScopes), [grantedScopes])

  const tokenOrganizationSlugs = token?.organization_slugs ?? EMPTY_BINDINGS
  const tokenProjectRefs = token?.project_refs ?? EMPTY_BINDINGS

  const access = useTokenAccessEvaluation({
    selection,
    resourceAccess,
    organizationSlugs: tokenOrganizationSlugs,
    projectRefs: tokenProjectRefs,
    enabled: visible && !!token,
  })
  const hasExceedingCapabilities = access.exceedingEntryKeys.length > 0

  // Deleting a project/org erases the token's binding to it, so a resource-scoped token with no
  // bindings left means everything it was bound to has been deleted.
  const hasNoBoundResources = token !== undefined && access.hasNoBoundResources

  const resourceNoun = resourceAccess === 'organization' ? 'organization' : 'project'
  // Deleted bindings are erased from the token, so the original count is unknowable — the
  // phrasing has to work for any number of resources.
  const boundResourcesDeletedText = `Every ${resourceNoun} this token was bound to has been deleted`

  const risk = useMemo(
    () => computeOverallRisk(access.effectiveSelection, resourceAccess),
    [access.effectiveSelection, resourceAccess]
  )

  const hasCapabilities = grantedScopes.length > 0

  const { activeByCategory, mcpTools, capabilityGroups } = useCapabilitySummary({
    selection,
    grantedScopes,
    permissionScopeMap,
  })

  // Accessible resources render with their name and ref/slug. Resources the user has lost access
  // to are aggregated into an anonymous count — their identifiers aren't shown.
  const resourceSummary = useMemo(() => {
    const inaccessibleCountItem = (lostCount: number, noun: string) =>
      lostCount === 0
        ? []
        : [
            {
              key: 'inaccessible',
              label: `${lostCount} ${pluralize(lostCount, noun)}`,
              sublabel: undefined,
              isInaccessible: true,
            },
          ]

    if (resourceAccess === 'project') {
      const projectsByRef = new Map(projects.map((project) => [project.ref, project]))
      const accessible = tokenProjectRefs.flatMap((ref) => {
        const name = projectsByRef.get(ref)?.name
        if (name === undefined) return []
        return [{ key: ref, label: name, sublabel: ref, isInaccessible: false }]
      })
      return {
        title: 'Projects',
        items: [
          ...accessible,
          ...inaccessibleCountItem(access.inaccessibleProjectRefs.length, 'project'),
        ],
      }
    }
    if (resourceAccess === 'organization') {
      const organizationsBySlug = new Map(organizations.map((org) => [org.slug, org]))
      const accessible = tokenOrganizationSlugs.flatMap((slug) => {
        const name = organizationsBySlug.get(slug)?.name
        if (name === undefined) return []
        return [{ key: slug, label: name, sublabel: slug, isInaccessible: false }]
      })
      return {
        title: 'Organizations',
        items: [
          ...accessible,
          ...inaccessibleCountItem(access.inaccessibleOrgSlugs.length, 'organization'),
        ],
      }
    }
    return {
      title: 'Account',
      items: [
        {
          key: 'account',
          label: 'Account-level access',
          sublabel: undefined,
          isInaccessible: false,
        },
      ],
    }
  }, [
    resourceAccess,
    tokenProjectRefs,
    tokenOrganizationSlugs,
    projects,
    organizations,
    access.inaccessibleProjectRefs,
    access.inaccessibleOrgSlugs,
  ])

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
              {resourceSummary.items.length === 0 && hasNoBoundResources && (
                <p className="py-2 text-sm text-foreground-lighter">{boundResourcesDeletedText}</p>
              )}
              {resourceSummary.items.length === 0 && !hasNoBoundResources && (
                <p className="py-2 text-sm text-foreground-lighter">-</p>
              )}
              {resourceSummary.items.map((item) => (
                <ResourceSummaryItem
                  key={item.key}
                  label={item.label}
                  sublabel={item.sublabel}
                  isInaccessible={item.isInaccessible}
                />
              ))}
            </div>
          </div>,
        ],
        [
          'Capabilities',
          hasCapabilities ? (
            <CapabilityCategoryList categories={activeByCategory} accessEntries={access.entries} />
          ) : (
            <span className="text-foreground-lighter">No capabilities selected</span>
          ),
        ],
        [
          'Risk level',
          <RiskLevelSummary key="risk" risk={risk} showRoleCaveat={hasExceedingCapabilities} />,
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
          <div className="flex items-center gap-2">
            <DocsButton
              href={`${DOCS_URL}/guides/platform/access-control`}
              topic="Access control"
              label="Access control docs"
            />
            <DocsButton
              href={`${DOCS_URL}/reference/api/introduction`}
              topic="Management API"
              label="API docs"
            />
          </div>
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
                {hasNoBoundResources && (
                  <Admonition
                    type="destructive"
                    title="This token's resources no longer exist"
                    description={`${boundResourcesDeletedText}. ${TOKEN_DENIED_REMEDIATION}`}
                  />
                )}
                {access.hasNoAccessibleResource && (
                  <Admonition
                    type="destructive"
                    title="This token no longer has access"
                    description={`You were removed from the ${resourceNoun}s this token is bound to. ${TOKEN_DENIED_REMEDIATION}`}
                  />
                )}
                {hasExceedingCapabilities && !access.hasNoAccessibleResource && (
                  <Admonition
                    type="warning"
                    title="Some permissions exceed your current role for the selected resources"
                    description="A token only works with permissions you currently hold. Permissions marked below will be denied until your role includes them."
                  />
                )}
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
                                {PERMISSION_MODE_LABEL[mode]}
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
