import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { cn, ScrollArea, Sheet, SheetContent, SheetHeader } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'

import { TOKEN_DENIED_REMEDIATION } from '../AccessToken.constants'
import { scopesToSelection, type ResourceAccessMode } from '../AccessToken.permissions'
import { useCapabilitySummary } from '../hooks/useCapabilitySummary'
import { useOrgAndProjectData } from '../hooks/useOrgAndProjectData'
import { useTokenAccessEvaluation } from '../hooks/useTokenAccessEvaluation'
import {
  ResourceAccessPills,
  useResourceAccessWrap,
  type ResourceAccessPillItem,
} from './ResourceAccessPills'
import { CapabilitiesSection } from './TokenCapabilities/CapabilitiesSection'
import { CapabilityLevelToggle } from './TokenCapabilities/CapabilityLevelToggle'
import { RiskBanner } from './TokenCapabilities/RiskBanner'
import {
  computeRiskBanner,
  getCapabilityDensityTier,
  type CapabilityLevelFilter,
} from './TokenCapabilities/TokenCapabilities.utils'
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

  // Accessible resources render with their name. Resources the user has lost access to are
  // aggregated into an anonymous count — their identifiers aren't shown.
  const resourceItems = useMemo<ResourceAccessPillItem[]>(() => {
    const inaccessibleCountItem = (lostCount: number, noun: string) =>
      lostCount === 0
        ? []
        : [
            {
              key: 'inaccessible',
              label: `${lostCount} ${pluralize(lostCount, noun)}`,
              isInaccessible: true,
            },
          ]

    if (resourceAccess === 'project') {
      const projectsByRef = new Map(projects.map((project) => [project.ref, project]))
      const accessible = tokenProjectRefs.flatMap((ref) => {
        const name = projectsByRef.get(ref)?.name
        if (name === undefined) return []
        return [{ key: ref, label: name }]
      })
      return [
        ...accessible,
        ...inaccessibleCountItem(access.inaccessibleProjectRefs.length, 'project'),
      ]
    }
    if (resourceAccess === 'organization') {
      const organizationsBySlug = new Map(organizations.map((org) => [org.slug, org]))
      const accessible = tokenOrganizationSlugs.flatMap((slug) => {
        const name = organizationsBySlug.get(slug)?.name
        if (name === undefined) return []
        return [{ key: slug, label: name }]
      })
      return [
        ...accessible,
        ...inaccessibleCountItem(access.inaccessibleOrgSlugs.length, 'organization'),
      ]
    }
    return [{ key: 'account', label: 'Account-level access' }]
  }, [
    resourceAccess,
    tokenProjectRefs,
    tokenOrganizationSlugs,
    projects,
    organizations,
    access.inaccessibleProjectRefs,
    access.inaccessibleOrgSlugs,
  ])

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
                          <ResourceAccessPills
                            resourceAccess={resourceAccess}
                            items={resourceItems}
                            emptyText={hasNoBoundResources ? boundResourcesDeletedText : '-'}
                          />
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
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
