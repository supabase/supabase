import { Check } from 'lucide-react'
import { useMemo } from 'react'
import {
  Card,
  CardContent,
  cn,
  ScrollArea,
  Separator,
  Sheet,
  SheetContent,
  SheetHeader,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'

import { useOrgAndProjectData } from '../hooks/useOrgAndProjectData'
import {
  AccessLevelTag,
  CAPABILITIES,
  getApiDocsUrl,
  getCapabilityAccessLevel,
  type AccessLevel,
  type Capability,
} from './NewScopedTokenSheet'
import { DocsButton } from '@/components/ui/DocsButton'
import { useScopedAccessTokenQuery } from '@/data/scoped-access-tokens/scoped-access-token-query'
import { formatTzTimestamp } from '@/lib/datetime'

interface ViewTokenSheetProps {
  visible: boolean
  tokenId: string | undefined
  onClose: () => void
}

type GrantedLevel = Exclude<AccessLevel, 'none'>

// Collapse a long endpoint path to its tail, e.g.
// `/v1/projects/{ref}/database/migrations` → `…/database/migrations`.
const truncatePath = (path: string) => {
  const segments = path.split('/').filter(Boolean)
  if (segments.length <= 3) return path
  return `…/${segments.slice(3).join('/')}`
}

const RISK_SUMMARY: Record<'destructive' | 'warning' | 'brand', { label: string; dot: string }> = {
  destructive: { label: 'High-risk write access', dot: 'bg-destructive' },
  warning: { label: 'Medium-risk write access', dot: 'bg-warning' },
  brand: { label: 'Low-risk access', dot: 'bg-brand' },
}

const RESOURCE_CHIP_CLASS =
  'rounded-sm border border-default px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.04em] text-foreground-lighter'

export function ViewTokenSheet({ visible, tokenId, onClose }: ViewTokenSheetProps) {
  const { organizations, projects } = useOrgAndProjectData()

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

  // Resolve each capability's access level from the token's granted permissions
  // once, then derive every list below from this single map.
  const levelById = useMemo(() => {
    const map = new Map<string, AccessLevel>()
    for (const capability of CAPABILITIES) {
      map.set(capability.id, getCapabilityAccessLevel(capability.id, token?.permissions))
    }
    return map
  }, [token?.permissions])

  const grantedCapabilities = useMemo<Array<{ capability: Capability; level: GrantedLevel }>>(
    () =>
      CAPABILITIES.flatMap((capability) => {
        const level = levelById.get(capability.id) ?? 'none'
        return level === 'none' ? [] : [{ capability, level }]
      }),
    [levelById]
  )

  const canItems = useMemo(
    () => grantedCapabilities.flatMap(({ capability, level }) => capability.allows[level]),
    [grantedCapabilities]
  )

  const cannotItems = useMemo(
    () =>
      CAPABILITIES.filter(
        (capability) => capability.cannot && (levelById.get(capability.id) ?? 'none') === 'none'
      ).map((capability) => capability.cannot as string),
    [levelById]
  )

  const mcpTools = useMemo(
    () =>
      grantedCapabilities
        .flatMap(({ capability, level }) => capability.tools[level])
        .filter(Boolean),
    [grantedCapabilities]
  )

  const riskTone = grantedCapabilities.some(({ capability }) => capability.risk === 'destructive')
    ? 'destructive'
    : grantedCapabilities.some(({ capability }) => capability.risk === 'warning')
      ? 'warning'
      : 'brand'

  const resourceAccessInfo = useMemo(() => {
    const resources: Array<{ name: string; type: string; identifier: string }> = []

    const organizationSlugs = token?.organization_slugs
    if (Array.isArray(organizationSlugs)) {
      organizationSlugs.forEach((orgSlug: string) => {
        const org = organizations.find((o) => o.slug === orgSlug)
        resources.push({ name: org?.name || orgSlug, type: 'Organization', identifier: orgSlug })
      })
    }

    const projectRefs = token?.project_refs
    if (Array.isArray(projectRefs)) {
      projectRefs.forEach((projectRef: string) => {
        const project = projects.find((p) => p.ref === projectRef)
        resources.push({
          name: project?.name || projectRef,
          type: 'Project',
          identifier: projectRef,
        })
      })
    }

    return resources
  }, [token?.organization_slugs, token?.project_refs, organizations, projects])

  return (
    <Sheet open={visible} onOpenChange={() => onClose()}>
      <SheetContent
        showClose={false}
        size="default"
        className="min-w-[600px]! flex flex-col h-full gap-0"
      >
        <SheetHeader className={cn('flex flex-row justify-between gap-x-4 items-center border-b')}>
          <p className="truncate" title={`View access for ${token?.name}`}>
            View access for {token?.name}
          </p>
          <DocsButton href="https://supabase.com/docs/reference/api/introduction" />
        </SheetHeader>
        <ScrollArea className="flex-1 max-h-[calc(100vh-60px)]">
          <div className="space-y-8 px-5 sm:px-6 py-6">
            {isTokenLoading && (
              <div className="flex items-center justify-center py-8">
                <p className="text-foreground-light">Loading token information...</p>
              </div>
            )}

            {tokenError && (
              <div className="flex items-center justify-center py-8">
                <p className="text-foreground-light text-red-500">
                  Error loading token information. Please try again.
                </p>
              </div>
            )}

            {token && (
              <>
                {/* 1. Token information */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-foreground">Token information</h3>
                  <Card className="w-full overflow-hidden bg-surface-100">
                    <CardContent className="p-0">
                      <Table className="p-5 table-auto">
                        <TableHeader>
                          <TableRow className="bg-200">
                            <TableHead className="text-left font-mono uppercase text-xs text-foreground-lighter h-auto py-2 w-[60%]">
                              Info
                            </TableHead>
                            <TableHead className="text-left font-mono uppercase text-xs text-foreground-lighter h-auto py-2">
                              Date
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell>
                              <p className="truncate text-foreground-light">Created</p>
                            </TableCell>
                            <TableCell>
                              {token?.created_at ? (
                                <TimestampInfo
                                  utcTimestamp={token.created_at}
                                  label={formatTzTimestamp(token.created_at)}
                                  className="text-sm"
                                />
                              ) : (
                                <span className="text-foreground">Unknown</span>
                              )}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>
                              <p className="truncate text-foreground-light">Last used</p>
                            </TableCell>
                            <TableCell>
                              {token?.last_used_at ? (
                                <TimestampInfo
                                  utcTimestamp={token.last_used_at}
                                  label={formatTzTimestamp(token.last_used_at)}
                                  className="text-sm"
                                />
                              ) : (
                                <span className="text-foreground">Never</span>
                              )}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>
                              <p className="truncate text-foreground-light">Expires</p>
                            </TableCell>
                            <TableCell>
                              {token?.expires_at ? (
                                <TimestampInfo
                                  utcTimestamp={token.expires_at}
                                  label={formatTzTimestamp(token.expires_at)}
                                  className="text-sm"
                                />
                              ) : (
                                <span className="text-foreground">Never</span>
                              )}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>

                {/* 2. Resource access */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-foreground">Resource access</h3>
                  <div className="space-y-2">
                    {resourceAccessInfo.length > 0 ? (
                      resourceAccessInfo.map((resource, index) => (
                        <div
                          key={`${resource.type}-${resource.identifier}-${index}`}
                          className="flex items-center gap-2"
                        >
                          <span className={RESOURCE_CHIP_CLASS}>{resource.type}</span>
                          <span className="text-sm text-foreground">{resource.name}</span>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className={RESOURCE_CHIP_CLASS}>Account</span>
                        <span className="text-sm text-foreground">Account-level access</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. This token can */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-foreground">This token can</h3>
                  {canItems.length === 0 ? (
                    <p className="text-sm text-foreground-light">No capabilities granted.</p>
                  ) : (
                    <ul className="flex flex-col gap-[9px]">
                      {canItems.map((item) => (
                        <li
                          key={item}
                          className="flex items-center gap-2.5 text-[13.5px] text-foreground"
                        >
                          <Check size={14} strokeWidth={1.5} className="flex-none text-brand" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* 4. It cannot */}
                {cannotItems.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-foreground">It cannot</h3>
                    <ul className="flex flex-col gap-2">
                      {cannotItems.map((item) => (
                        <li
                          key={item}
                          className="flex items-center gap-2.5 text-[13.5px] text-foreground-lighter"
                        >
                          <span className="w-3.5 flex-none text-center text-foreground-muted">
                            –
                          </span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-foreground-muted">
                      Notable restrictions only — the token can only do what&apos;s listed above.
                    </p>
                  </div>
                )}

                <Separator />

                {/* 6. Management API endpoints enabled */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-foreground">
                    Management API endpoints enabled
                  </h3>
                  {grantedCapabilities.length === 0 ? (
                    <p className="text-sm text-foreground-light">None</p>
                  ) : (
                    <div className="space-y-3">
                      {grantedCapabilities.map(({ capability, level }) => (
                        <div key={capability.id} className="space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[13px] text-foreground-light">
                              {capability.label}
                            </span>
                            <AccessLevelTag level={level} className="font-mono" />
                          </div>
                          <div className="font-mono text-xs leading-[2]">
                            {capability.apiDocs[level].map((endpoint) => (
                              <a
                                key={`${capability.id}-${endpoint.operationId}`}
                                href={getApiDocsUrl(endpoint.operationId)}
                                target="_blank"
                                rel="noreferrer"
                                className="block hover:underline"
                              >
                                <span className="text-foreground-light">{endpoint.method}</span>{' '}
                                <span className="text-foreground-lighter">
                                  {truncatePath(endpoint.path)}
                                </span>
                              </a>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 7. MCP tools enabled */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-foreground">MCP tools enabled</h3>
                  {mcpTools.length === 0 ? (
                    <p className="text-sm text-foreground-light">None</p>
                  ) : (
                    <p className="font-mono text-[12.5px] text-foreground-lighter">
                      {mcpTools.join(', ')}
                    </p>
                  )}
                </div>

                {/* 8. Risk summary */}
                <div className="flex items-center justify-between gap-2 rounded-md border border-default bg-surface-100 px-3.5 py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn('h-[7px] w-[7px] rounded-full', RISK_SUMMARY[riskTone].dot)}
                      aria-hidden
                    />
                    <span className="text-sm text-foreground">{RISK_SUMMARY[riskTone].label}</span>
                  </div>
                  <span className="text-xs text-foreground-lighter">Notable restrictions only</span>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
