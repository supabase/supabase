import { format } from 'date-fns'
import { useMemo } from 'react'
import { cn } from 'ui'
import { Admonition } from 'ui-patterns/admonition'

import {
  computeOverallRisk,
  PERMISSION_CATALOG_BY_CATEGORY,
  selectionToScopes,
  type OverallRisk,
  type PermissionCatalogEntry,
  type PermissionMode,
} from '../../AccessToken.permissions'
import { useOrgAndProjectData } from '../../hooks/useOrgAndProjectData'
import { EXPIRY_OPTIONS, type TokenFormValues } from './NewScopedTokenForm.utils'
import { RiskMarker } from './RiskMarker'
import {
  getEnabledEndpointsForCapability,
  getEnabledMcpTools,
} from '@/data/access-tokens/permission-scope-map'

interface ReviewStepProps {
  values: TokenFormValues
}

const RISK_TEXT_CLASS: Record<OverallRisk['tone'], string> = {
  default: 'text-foreground-light',
  low: 'text-brand-600',
  medium: 'text-warning-600',
  high: 'text-destructive-600',
}

const modeLabel = (mode: PermissionMode) =>
  mode === 'readwrite' ? 'Read-write' : mode === 'read' ? 'Read' : 'None'

export const NewScopedTokenFormReview = ({ values }: ReviewStepProps) => {
  const { organizations, projects } = useOrgAndProjectData()
  const selection = values.permissions
  const grantedScopes = useMemo(() => selectionToScopes(selection), [selection])
  const risk = useMemo(
    () => computeOverallRisk(selection, values.resourceAccess),
    [selection, values.resourceAccess]
  )

  const resourceSummary = useMemo(() => {
    if (values.resourceAccess === 'project') {
      const selectedProjects = projects.filter((p) => values.projectRefs.includes(p.ref))
      return `Projects: ${selectedProjects.length > 0 ? selectedProjects.map((p) => p.ref).join() : '-'}`
    }
    if (values.resourceAccess === 'organization') {
      const selectedOrganizations = organizations.filter((o) =>
        values.organizationSlugs.includes(o.slug)
      )
      return `Organization: ${selectedOrganizations.length > 0 ? selectedOrganizations.map((o) => o.slug).join() : '-'}`
    }
    return 'Account: Account-level access'
  }, [values, projects, organizations])

  const expiresSummary = useMemo(() => {
    if (values.expiresAt === 'custom') {
      return values.customExpiryDate
        ? format(new Date(values.customExpiryDate), 'dd MMM, yyyy')
        : 'Custom — no date set'
    }
    return EXPIRY_OPTIONS.find((o) => o.value === values.expiresAt)?.label ?? values.expiresAt
  }, [values])

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

  const mcpTools = useMemo(() => getEnabledMcpTools(grantedScopes), [grantedScopes])

  const capabilityGroups = useMemo(() => {
    const groups: { entry: PermissionCatalogEntry; mode: PermissionMode; endpoints: string[][] }[] =
      []
    for (const category of activeByCategory) {
      for (const { entry, mode } of category.entries) {
        const capabilityScopes =
          mode === 'readwrite' ? [...entry.readScopes, ...entry.writeScopes] : entry.readScopes
        const endpoints = getEnabledEndpointsForCapability(capabilityScopes, grantedScopes)
        if (endpoints.length > 0) {
          groups.push({ entry, mode, endpoints: endpoints.map((e) => [e.method, e.path]) })
        }
      }
    }
    return groups
  }, [activeByCategory, grantedScopes])

  const rows: [string, React.ReactNode][] = [
    ['Name', values.tokenName || <span className="text-foreground-lighter">Untitled token</span>],
    ['Resource access', resourceSummary],
    [
      'Capabilities',
      hasCapabilities ? (
        <div className="space-y-3">
          {activeByCategory.map((category) => (
            <div key={category.key} className="space-y-1">
              <p className="text-[11px] font-mono uppercase tracking-wide text-foreground-lighter">
                {category.name}
              </p>
              {category.entries.map(({ entry, mode }) => (
                <div key={entry.key} className="flex items-center gap-2 text-sm">
                  <span className="text-foreground">{entry.name}</span>
                  <span className="text-foreground-light">· {modeLabel(mode)}</span>
                  <RiskMarker entry={entry} withTooltip={false} />
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <span className="text-foreground-lighter">No capabilities selected</span>
      ),
    ],
    ['Expires', expiresSummary],
    [
      'Risk level',
      <span key="risk" className={cn('text-sm', RISK_TEXT_CLASS[risk.tone])}>
        {risk.text}
      </span>,
    ],
  ]

  return (
    <div className="space-y-6 px-5 sm:px-6 py-6">
      <dl className="divide-y rounded-md border">
        {rows.map(([key, value]) => (
          <div key={key} className="grid grid-cols-3 gap-4 px-4 py-3">
            <dt className="text-sm text-foreground-light">{key}</dt>
            <dd className="col-span-2 text-sm text-foreground">{value}</dd>
          </div>
        ))}
      </dl>

      {hasCapabilities && (
        <div className="space-y-4">
          <div className="space-y-3">
            <p className="text-[11px] font-mono uppercase tracking-wide text-foreground-lighter">
              Management API endpoints enabled
            </p>
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
                        <span className="w-14 shrink-0 text-foreground-light">{method}</span>
                        <span className="text-foreground">{path}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-mono uppercase tracking-wide text-foreground-lighter">
              MCP tools
            </p>
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
        </div>
      )}

      {hasCapabilities ? (
        <Admonition
          type="warning"
          title="Token access can't be edited after creation"
          description="Once created, a token's access can't be edited. To change it, revoke this token and create a new one."
        />
      ) : (
        <Admonition
          type="warning"
          title="This token has no capabilities"
          description="Go back and grant at least one permission before creating it."
        />
      )}
    </div>
  )
}
