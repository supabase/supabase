import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { Badge, cn, ScrollArea, Sheet, SheetContent, SheetHeader } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'

import { TOKEN_DENIED_REMEDIATION } from '../AccessToken.constants'
import { scopesToSelection, type ResourceAccessMode } from '../AccessToken.permissions'
import { useCapabilitySummary } from '../hooks/useCapabilitySummary'
import { useTokenAccessEvaluation } from '../hooks/useTokenAccessEvaluation'
import {
  OrganizationAccessPill,
  ProjectAccessPill,
  useResourceAccessWrap,
} from './ResourceAccessPills'
import { CapabilitiesSection } from './TokenCapabilities/CapabilitiesSection'
import { CapabilityLevelToggle } from './TokenCapabilities/CapabilityLevelToggle'
import { RiskBanner } from './TokenCapabilities/RiskBanner'
import {
  computeRiskBanner,
  getCapabilityDensityTier,
  type CapabilityLevelFilter,
} from './TokenCapabilities/TokenCapabilities.utils'
import { TokenDocsButtons } from './TokenDocsButtons'
import { useOrganizationsQuery } from '@/data/organizations/organizations-query'
import { useProjectsInfiniteQuery } from '@/data/projects/projects-infinite-query'
import {
  getEnabledMcpTools,
  useGetEnabledEndpointsForCapability,
} from '@/data/scoped-access-tokens/permission-scope-map-query'
import { useScopedAccessTokenQuery } from '@/data/scoped-access-tokens/scoped-access-token-query'

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
  const { data: organizations = [] } = useOrganizationsQuery({ enabled: visible && !!token })
  const { data: projectsData } = useProjectsInfiniteQuery(
    {
      limit: 1,
    },
    { enabled: visible && !!token }
  )

  const hasTooManyProjects = useMemo(() => {
    if (!projectsData) {
      return false
    }
    if (projectsData.pages.length === 0) {
      return false
    }
    return projectsData.pages[0].pagination.count > 100
  }, [projectsData])

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
    () =>
      computeRiskBanner({
        effectiveSelection: access.effectiveSelection,
        resourceAccess,
        organizationSlugs: tokenOrganizationSlugs,
        projectRefs: tokenProjectRefs,
      }),
    [access.effectiveSelection, resourceAccess, tokenOrganizationSlugs, tokenProjectRefs]
  )

  const { capabilities } = useCapabilitySummary({
    selection,
    grantedScopes,
    permissionScopeMap,
  })
  const capabilityTier = getCapabilityDensityTier(capabilities.length)
  const [levelFilter, setLevelFilter] = useState<CapabilityLevelFilter>('all')

  const enabledMcpTools = useMemo(
    () => getEnabledMcpTools({ grantedScopes, permissionScopeMap }).sort(),
    [grantedScopes, permissionScopeMap]
  )

  const { containerRef: pillsRef, isWrapped: isResourceAccessWrapped } = useResourceAccessWrap()

  return (
    <Sheet open={visible} onOpenChange={() => onClose()}>
      <SheetContent
        showClose={false}
        size="default"
        className="flex h-full flex-col gap-0 sm:w-[656px] lg:w-[800px]"
      >
        <SheetHeader
          className={cn(
            'flex flex-col md:flex-row justify-between gap-4 items-start md:items-center border-b'
          )}
        >
          <p className="truncate" title={`View access for ${token?.name}`}>
            View access for {token?.name}
          </p>
          <TokenDocsButtons />
        </SheetHeader>
        {/* Radix wraps viewport children in an inline-styled display:table div that grows to fit
            the widest child, which would let one long endpoint path expand the sheet instead of
            clipping — force it back to block so widths are bounded and rows can truncate. */}
        <ScrollArea className="flex-1 [&>[data-radix-scroll-area-viewport]>div]:block!">
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
                {!hasTooManyProjects && access.hasNoAccessibleResource && (
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
                  <h3 className="text-sm">Risk assessment</h3>
                  <RiskBanner risk={risk} showRoleCaveat={hasExceedingCapabilities} />
                </div>

                <div className="flex flex-col gap-3">
                  <h3 className="text-sm">Token summary</h3>
                  <dl className="divide-y rounded-md border bg-surface-300">
                    <div className="flex items-center justify-between gap-4 px-4 py-3">
                      <dt className="shrink-0 text-sm text-foreground-lighter">Created</dt>
                      <dd className="text-sm text-foreground">
                        {token.created_at ? (
                          <TimestampInfo
                            utcTimestamp={token.created_at}
                            label={dayjs(token.created_at).fromNow()}
                            className="text-sm"
                          />
                        ) : (
                          <span className="text-foreground-lighter">Unknown</span>
                        )}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4 px-4 py-3">
                      <dt className="shrink-0 text-sm text-foreground-lighter">Last used</dt>
                      <dd className="text-sm text-foreground">
                        {token.last_used_at ? (
                          <TimestampInfo
                            utcTimestamp={token.last_used_at}
                            label={dayjs(token.last_used_at).fromNow()}
                            className="text-sm"
                          />
                        ) : (
                          <span className="text-foreground-lighter">Never</span>
                        )}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4 px-4 py-3">
                      <dt className="shrink-0 text-sm text-foreground-lighter">Expires</dt>
                      <dd className="text-sm text-foreground">
                        {token.expires_at ? (
                          <TimestampInfo
                            utcTimestamp={token.expires_at}
                            label={dayjs(token.expires_at).fromNow()}
                            className="text-sm"
                          />
                        ) : (
                          <span className="text-foreground-lighter">Never</span>
                        )}
                      </dd>
                    </div>
                    <div
                      className={cn(
                        'flex flex-col items-start justify-between gap-4 px-4 py-3 sm:flex-row',
                        isResourceAccessWrapped ? 'sm:items-start' : 'sm:items-center'
                      )}
                    >
                      <dt className="shrink-0 text-sm text-foreground-lighter">Resource access</dt>
                      <dd className="w-full min-w-0 text-sm text-foreground sm:w-auto sm:flex-1">
                        <div
                          ref={pillsRef}
                          className="flex flex-wrap justify-start gap-1.5 sm:justify-end"
                        >
                          {resourceAccess === 'organization'
                            ? tokenOrganizationSlugs.map((orgSlug) => (
                                <OrganizationAccessPill
                                  key={orgSlug}
                                  slug={orgSlug}
                                  organization={organizations.find((org) => org.slug === orgSlug)}
                                />
                              ))
                            : null}
                          {resourceAccess === 'project'
                            ? tokenProjectRefs.map((projectRef) => (
                                <ProjectAccessPill key={projectRef} projectRef={projectRef} />
                              ))
                            : null}
                        </div>
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm">Capabilities</h3>
                    {capabilityTier === 'dense' && (
                      <CapabilityLevelToggle value={levelFilter} onChange={setLevelFilter} />
                    )}
                  </div>
                  <CapabilitiesSection
                    capabilities={capabilities}
                    accessEntries={access.entries}
                    levelFilter={levelFilter}
                  />
                </div>

                <div className="flex flex-col gap-3">
                  <h3 className="text-sm">Available MCP tools</h3>
                  {enabledMcpTools.length === 0 ? (
                    <span className="text-sm text-foreground-lighter">No MCP tools enabled</span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {enabledMcpTools.map((tool) => (
                        <Badge
                          key={tool}
                          variant="default"
                          className="px-2.5 py-1 font-mono text-xs normal-case tracking-normal"
                        >
                          {tool}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
